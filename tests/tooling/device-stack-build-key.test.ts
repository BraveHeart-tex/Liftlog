import { execFileSync, spawn } from 'node:child_process';
import {
  appendFileSync,
  chmodSync,
  copyFileSync,
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

// `device:stack build-key` on a temporary copy of this checkout: tracked and untracked
// files, node_modules linked, a fake `java` on PATH and a private Gradle user home.
const script = resolve('scripts/device-stack.mjs');
const fakeJava = `#!/bin/sh
echo "openjdk version \\"\${FAKE_JAVA_VERSION:-17.0.12}\\"" >&2
`;

let dir: string;
let root: string;
let gradleHome: string;
let baseline: string;

type BuildKey = { key: string; inputs: Record<string, string> };

function buildKey(extraEnv: Record<string, string> = {}) {
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

// Applies an edit, returns the key with it, then restores the file.
async function keyWith(path: string, edit: (contents: string) => string) {
  const file = join(root, path);
  const original = readFileSync(file, 'utf8');

  writeFileSync(file, edit(original));

  try {
    return (await buildKey()).key;
  } finally {
    writeFileSync(file, original);
  }
}

beforeAll(async () => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'build-key-')));
  root = join(dir, 'checkout');
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
    mkdirSync(dirname(join(root, file)), { recursive: true });

    const stats = lstatSync(file, { throwIfNoEntry: false });

    // Skips a tracked file deleted in the working tree; copies symlinks as links.
    if (stats?.isSymbolicLink()) {
      symlinkSync(readlinkSync(file), join(root, file));
    } else if (stats) {
      copyFileSync(file, join(root, file));
    }
  }

  symlinkSync(resolve('node_modules'), join(root, 'node_modules'));
  baseline = (await buildKey()).key;
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

jest.setTimeout(120_000);

test('build-key prints the key and the hash of each input as JSON', async () => {
  const output = await buildKey();

  expect(Object.keys(output)).toEqual(['key', 'inputs']);
  expect(output.key).toMatch(/^[0-9a-f]{64}$/);
  expect(Object.keys(output.inputs)).toEqual([
    'fingerprint',
    'variant',
    'abi',
    'jdk',
    'gradleProperties',
    'environment'
  ]);

  for (const hash of Object.values(output.inputs)) {
    expect(hash).toMatch(/^[0-9a-f]{40,64}$/);
  }

  expect(output.key).toBe(baseline);
});

test.each([
  [
    'a native field in app.json',
    'app.json',
    (contents: string) => {
      const config = JSON.parse(contents);
      config.expo.android.permissions.push('android.permission.CAMERA');

      return JSON.stringify(config, null, 2);
    }
  ],
  [
    'a config plugin',
    'plugins/with-android-release-signing.js',
    (contents: string) => `${contents}\n// changed\n`
  ],
  [
    'a plugin-copied Gradle file',
    'plugins/android/liftlog-release-signing.gradle',
    (contents: string) => `${contents}\n// changed\n`
  ],
  [
    "a local module's Android source",
    'modules/liftlog-updater/android/src/main/java/expo/modules/liftlogupdater/ApkVerification.kt',
    (contents: string) => `${contents}\n// changed\n`
  ]
])('changing %s changes the key', async (_, path, edit) => {
  expect(await keyWith(path, edit)).not.toBe(baseline);
});

test('a different JDK, user Gradle properties or autolinking setting changes the key', async () => {
  expect((await buildKey({ FAKE_JAVA_VERSION: '21.0.4' })).key).not.toBe(
    baseline
  );
  expect(
    (await buildKey({ EXPO_USE_COMMUNITY_AUTOLINKING: '1' })).key
  ).not.toBe(baseline);

  const properties = join(gradleHome, 'gradle.properties');
  writeFileSync(properties, 'org.gradle.jvmargs=-Xmx4g\n');

  try {
    expect((await buildKey()).key).not.toBe(baseline);
  } finally {
    rmSync(properties);
  }
});

test('changes under src/ or to package.json scripts leave the key unchanged', async () => {
  expect(
    await keyWith(
      'src/app/(tabs)/_layout.tsx',
      contents => `${contents}\n// changed\n`
    )
  ).toBe(baseline);
  expect(
    await keyWith('package.json', contents => {
      const pkg = JSON.parse(contents);
      pkg.scripts.extra = 'echo changed';

      return JSON.stringify(pkg, null, 2);
    })
  ).toBe(baseline);
});

test('a generated android/ directory leaves the key unchanged', async () => {
  const android = join(root, 'android');
  mkdirSync(join(android, 'app'), { recursive: true });
  writeFileSync(
    join(android, 'settings.gradle'),
    "rootProject.name = 'Liftlog'\n"
  );
  appendFileSync(join(android, 'app', 'build.gradle'), 'android {}\n');

  try {
    expect((await buildKey()).key).toBe(baseline);
  } finally {
    rmSync(android, { recursive: true });
  }
});
