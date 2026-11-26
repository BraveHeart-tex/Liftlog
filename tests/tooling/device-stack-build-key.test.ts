import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  constants,
  copyFileSync,
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';

// `device:stack build-key` on temporary copies of this checkout: tracked and untracked
// files, node_modules linked, a fake `java` on PATH and a private Gradle user home. Every
// case starts in beforeAll on its own clone of the copy, a few at a time, and its test
// awaits the result.
const script = resolve('scripts/device-stack.mjs');
const fakeJava = `#!/bin/sh
echo "openjdk version \\"\${FAKE_JAVA_VERSION:-17.0.12}\\"" >&2
`;
const concurrency = 2;

let dir: string;
let template: string;
let gradleHome: string;
let baseline: BuildKey;

type BuildKey = { key: string; inputs: Record<string, string> };

function buildKey(root: string, extraEnv: Record<string, string> = {}) {
  return new Promise<BuildKey>((done, fail) => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PATH: `${join(dir, 'bin')}${delimiter}${process.env.PATH}`,
      GRADLE_USER_HOME: gradleHome,
      ...extraEnv
    };

    delete env.JAVA_HOME;

    if (!('EXPO_USE_COMMUNITY_AUTOLINKING' in extraEnv)) {
      delete env.EXPO_USE_COMMUNITY_AUTOLINKING;
    }

    const child = spawn(process.execPath, [script, 'build-key'], {
      cwd: root,
      env
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('close', status =>
      status === 0
        ? done(JSON.parse(stdout))
        : fail(new Error(`build-key exited ${status}: ${stderr}`))
    );
  });
}

// At most `concurrency` build-key runs at once.
let free = concurrency;
const queue: (() => void)[] = [];

async function limited<T>(task: () => Promise<T>) {
  if (free > 0) {
    free--;
  } else {
    await new Promise<void>(start => queue.push(start));
  }

  try {
    return await task();
  } finally {
    const next = queue.shift();

    if (next) {
      next();
    } else {
      free++;
    }
  }
}

// A clone of the copied checkout under `name` with `change` applied.
function checkout(name: string, change: (root: string) => void) {
  const root = join(dir, name);
  cpSync(template, root, {
    recursive: true,
    verbatimSymlinks: true,
    mode: constants.COPYFILE_FICLONE
  });
  change(root);

  return root;
}

const edit =
  (path: string, change: (contents: string) => string) => (root: string) =>
    writeFileSync(
      join(root, path),
      change(readFileSync(join(root, path), 'utf8'))
    );

const appendLine = (contents: string) => `${contents}\n// changed\n`;

// Each case's key, by case name; filled in beforeAll.
const keys = new Map<string, Promise<string>>();

const changed: [string, string, (contents: string) => string][] = [
  [
    'a native field in app.json',
    'app.json',
    contents => {
      const config = JSON.parse(contents);
      config.expo.android.permissions.push('android.permission.CAMERA');

      return JSON.stringify(config, null, 2);
    }
  ],
  ['a config plugin', 'plugins/with-android-release-signing.js', appendLine],
  [
    'a plugin-copied Gradle file',
    'plugins/android/liftlog-release-signing.gradle',
    appendLine
  ],
  [
    "a local module's Android source",
    'modules/liftlog-updater/android/src/main/java/expo/modules/liftlogupdater/ApkVerification.kt',
    appendLine
  ]
];

function startCases() {
  const cases: [string, () => Promise<BuildKey>][] = [
    ...changed.map(
      ([name, path, change], index): [string, () => Promise<BuildKey>] => [
        name,
        () => buildKey(checkout(`changed-${index}`, edit(path, change)))
      ]
    ),
    ['jdk', () => buildKey(template, { FAKE_JAVA_VERSION: '21.0.4' })],
    [
      'autolinking',
      () => buildKey(template, { EXPO_USE_COMMUNITY_AUTOLINKING: '1' })
    ],
    [
      'gradle properties',
      () => {
        const home = join(dir, 'gradle-properties');
        mkdirSync(home);
        writeFileSync(
          join(home, 'gradle.properties'),
          'org.gradle.jvmargs=-Xmx4g\n'
        );

        return buildKey(template, { GRADLE_USER_HOME: home });
      }
    ],
    [
      'src',
      () =>
        buildKey(
          checkout('src', edit('src/app/(tabs)/_layout.tsx', appendLine))
        )
    ],
    [
      'package.json scripts',
      () =>
        buildKey(
          checkout(
            'scripts',
            edit('package.json', contents => {
              const pkg = JSON.parse(contents);
              pkg.scripts.extra = 'echo changed';

              return JSON.stringify(pkg, null, 2);
            })
          )
        )
    ],
    [
      'android',
      () =>
        buildKey(
          checkout('android', root => {
            mkdirSync(join(root, 'android', 'app'), { recursive: true });
            writeFileSync(
              join(root, 'android', 'settings.gradle'),
              "rootProject.name = 'Liftlog'\n"
            );
            writeFileSync(
              join(root, 'android', 'app', 'build.gradle'),
              'android {}\n'
            );
          })
        )
    ]
  ];

  for (const [name, run] of cases) {
    const key = limited(run).then(output => output.key);
    // A failed case fails its own test, not the whole file.
    key.catch(() => {});
    keys.set(name, key);
  }
}

function keyOf(name: string) {
  const key = keys.get(name);

  if (!key) {
    throw new Error(`no build key case named ${name}`);
  }

  return key;
}

beforeAll(async () => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'build-key-')));
  template = join(dir, 'checkout');
  gradleHome = join(dir, 'gradle');
  mkdirSync(join(dir, 'bin'), { recursive: true });
  mkdirSync(gradleHome);
  writeFileSync(join(dir, 'bin', 'java'), fakeJava);
  chmodSync(join(dir, 'bin', 'java'), 0o755);

  const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean);

  for (const file of files) {
    mkdirSync(dirname(join(template, file)), { recursive: true });

    const stats = lstatSync(file, { throwIfNoEntry: false });

    // Skips a tracked file deleted in the working tree; copies symlinks as links.
    if (stats?.isSymbolicLink()) {
      symlinkSync(readlinkSync(file), join(template, file));
    } else if (stats) {
      copyFileSync(file, join(template, file));
    }
  }

  symlinkSync(resolve('node_modules'), join(template, 'node_modules'));

  const output = limited(() => buildKey(template));
  startCases();
  baseline = await output;
});

afterAll(async () => {
  // Lets every started run finish before its checkout is removed.
  await Promise.allSettled(keys.values());
  rmSync(dir, { recursive: true, force: true });
});

jest.setTimeout(120_000);

test('build-key prints the key and the hash of each input as JSON', () => {
  expect(Object.keys(baseline)).toEqual(['key', 'inputs']);
  expect(baseline.key).toMatch(/^[0-9a-f]{64}$/);
  expect(Object.keys(baseline.inputs)).toEqual([
    'fingerprint',
    'variant',
    'abi',
    'jdk',
    'gradleProperties',
    'environment'
  ]);

  for (const hash of Object.values(baseline.inputs)) {
    expect(hash).toMatch(/^[0-9a-f]{40,64}$/);
  }
});

test.each(changed.map(([name]) => name))(
  'changing %s changes the key',
  async name => {
    expect(await keyOf(name)).not.toBe(baseline.key);
  }
);

test('a different JDK, user Gradle properties or autolinking setting changes the key', async () => {
  expect(await keyOf('jdk')).not.toBe(baseline.key);
  expect(await keyOf('autolinking')).not.toBe(baseline.key);
  expect(await keyOf('gradle properties')).not.toBe(baseline.key);
});

test('changes under src/ or to package.json scripts leave the key unchanged', async () => {
  expect(await keyOf('src')).toBe(baseline.key);
  expect(await keyOf('package.json scripts')).toBe(baseline.key);
});

test('a generated android/ directory leaves the key unchanged', async () => {
  expect(await keyOf('android')).toBe(baseline.key);
});
