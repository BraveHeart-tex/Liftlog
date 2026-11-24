import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';

const script = resolve('scripts/device-stack.mjs');
const PACKAGE = 'com.borakaraca94.liftlog';
const AVD = 'liftlog_harness_34';
const AUDIT_AVD = 'liftlog_audit_34';
// Online before every start: a physical phone and the maintainer's emulator on 5554/5555.
const PHONE = 'R5CT3000ABC';
const FOREIGN = 'emulator-5554';
const SERIAL = 'emulator-5556';

// One fake implementation behind every binary the script calls (`adb`, `emulator`, `lsof`,
// `agent-device`, `pnpm`, `avdmanager`, and the `gradlew` the fake prebuild writes). Each call
// is logged; device and listener state lives in a JSON file the test seeds. Long-running fakes
// (emulator, logcat, Metro) stay alive like the real ones so `stop` has something to end.
// Gradle logs the android/ entries it builds from, waits while \`gradleHold\` names a missing
// file, and writes an APK whose content is the fingerprint at the end of the build.
const fakeImpl = `
const { appendFileSync, chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } = require('node:fs')
const { spawn } = require('node:child_process')
const { join } = require('node:path')
const name = require('node:path').basename(process.argv[1])
const args = process.argv.slice(2)
const statePath = process.env.FAKE_STATE
const read = () => JSON.parse(readFileSync(statePath, 'utf8'))
const write = s => writeFileSync(statePath, JSON.stringify(s))
appendFileSync(process.env.FAKE_LOG, JSON.stringify({
  name, args, ci: process.env.CI ?? null, cwd: process.cwd(),
  ...(name === 'gradlew' && { files: readdirSync('.') })
}) + '\\n')
const stayAlive = () => setInterval(() => {}, 1000)
const state = read()
const avdOf = serial =>
  serial === '${FOREIGN}' ? '${AUDIT_AVD}' : state.booted && serial === 'emulator-' + state.harnessPort ? state.harnessAvd : null
if (name === 'emulator') {
  if (args[0] === '-list-avds') process.stdout.write(state.avds.join('\\n') + '\\n')
  else {
    const port = Number(args[args.indexOf('-port') + 1])
    write({ ...state, booted: true, harnessPort: port, harnessAvd: args[args.indexOf('-avd') + 1], emulatorPid: process.pid })
    stayAlive()
  }
} else if (name === 'avdmanager') {
  write({ ...state, avds: [...state.avds, args[args.indexOf('--name') + 1]] })
} else if (name === 'adb') {
  const serial = args[0] === '-s' ? args[1] : null
  const rest = args[0] === '-s' ? args.slice(2) : args
  const command = rest.join(' ')
  if (command === 'get-state') {
    if (serial === '${PHONE}' || avdOf(serial)) process.stdout.write('device\\n')
    else process.exit(1)
  } else if (command === 'emu avd name') {
    if (!avdOf(serial)) process.exit(1)
    process.stdout.write(avdOf(serial) + '\\r\\nOK\\r\\n')
  } else if (command === 'shell getprop sys.boot_completed') process.stdout.write('1\\n')
  else if (command === 'shell pm path ${PACKAGE}') {
    if (state.installed === null) process.exit(1)
    process.stdout.write('package:/data/app/~~x/${PACKAGE}-y/base.apk\\n')
  } else if (rest[0] === 'shell' && rest[1] === 'sha256sum') {
    const hash = require('node:crypto').createHash('sha256').update(state.installed).digest('hex')
    process.stdout.write(hash + '  ' + rest[2] + '\\n')
  } else if (rest[0] === 'install') {
    write({ ...state, installed: readFileSync(rest.at(-1), 'utf8') })
  } else if (rest[0] === 'logcat') {
    process.stdout.write('I ReactNativeJS: fake log line\\n'); stayAlive()
  } else if (command === 'emu kill') {
    try { process.kill(state.emulatorPid) } catch {}
    write({ ...state, booted: false })
  }
} else if (name === 'lsof') {
  if (args.includes('-sTCP:LISTEN')) {
    const port = Number(args.find(arg => arg.startsWith('-iTCP:')).slice(6))
    process.stdout.write(state.listeners.filter(l => l.port === port).map(l => l.pid).join('\\n'))
  } else {
    const pid = Number(args[args.indexOf('-p') + 1])
    const listener = state.listeners.find(l => l.pid === pid)
    if (listener) process.stdout.write('p' + pid + '\\nfcwd\\nn' + listener.cwd + '\\n')
  }
} else if (name === 'agent-device' && args[0] === 'snapshot') {
  process.stdout.write(state.onboarding
    ? 'This is the developer menu.\\nContinue'
    : 'workout-start-screen')
} else if (name === 'pnpm' && args.includes('prebuild')) {
  const android = join(process.cwd(), 'android')
  mkdirSync(android, { recursive: true })
  writeFileSync(join(android, 'gradlew'), '#!' + process.execPath + '\\nrequire(' + JSON.stringify(__filename) + ')\\n')
  chmodSync(join(android, 'gradlew'), 0o755)
} else if (name === 'gradlew') {
  const finish = () => {
    const current = read()
    if (current.gradleFails) process.exit(1)
    if (current.fingerprintAfterBuild) write({ ...current, fingerprint: current.fingerprintAfterBuild })
    const out = join('app', 'build', 'outputs', 'apk', 'debug')
    mkdirSync(out, { recursive: true })
    writeFileSync(join(out, 'app-debug.apk'), 'apk:' + current.fingerprint)
    process.exit(0)
  }
  const wait = () => (!state.gradleHold || existsSync(state.gradleHold) ? finish() : setTimeout(wait, 100))
  wait()
} else if (name === 'pnpm') {
  // The listener lsof reports: this Metro, or another process that took the port first.
  const port = Number(process.env.DEVICE_STACK_PORT)
  if (state.foreignMetro) {
    const foreign = spawn(process.execPath, [process.env.FAKE_METRO], { detached: true, stdio: 'ignore' })
    foreign.unref()
    write({ ...state, listeners: [...state.listeners, { pid: foreign.pid, cwd: '/', port }] })
    stayAlive()
  } else {
    write({ ...state, listeners: [...state.listeners, { pid: process.pid, cwd: process.cwd(), port }] })
    require(process.env.FAKE_METRO)
  }
}
`;

// A fake Metro: answers /status and the manifest with the slug and name it is given.
const fakeMetro = `
const { createServer } = require('node:http')
const { FAKE_SLUG = 'liftlog', FAKE_NAME = 'Liftlog', DEVICE_STACK_PORT } = process.env
createServer((request, response) => {
  if (request.url === '/status') return response.end('packager-status:running')
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({ extra: { expoClient: { slug: FAKE_SLUG, name: FAKE_NAME } } }))
}).listen(Number(DEVICE_STACK_PORT), '127.0.0.1', () => console.log('fake metro listening'))
`;

type Listener = { pid: number; cwd: string; port: number };
type FakeState = {
  avds: string[];
  booted: boolean;
  // Content of the installed APK, null when the app is not installed.
  installed: string | null;
  fingerprint: string;
  fingerprintAfterBuild?: string;
  gradleFails?: boolean;
  gradleHold?: string;
  emulatorPid?: number;
  onboarding?: boolean;
  foreignMetro?: boolean;
  listeners: Listener[];
};
type Call = {
  name: string;
  args: string[];
  ci: string | null;
  cwd: string;
  files?: string[];
};

const pids: number[] = [];
const directories: string[] = [];

function freePort() {
  return new Promise<number>(done => {
    const server = createServer().listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => done(port));
    });
  });
}

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
};

// The dev build key reads the Expo fingerprint through the checkout's expo package; this one
// reports the fingerprint in the fake state.
const fakeFingerprint = `
exports.createFingerprintAsync = async () =>
  ({ hash: JSON.parse(require('node:fs').readFileSync(process.env.FAKE_STATE, 'utf8')).fingerprint })
`;

function fakeExpo(checkout: string) {
  mkdirSync(join(checkout, 'node_modules', 'expo'), { recursive: true });
  mkdirSync(join(checkout, 'node_modules', '@expo', 'fingerprint'), {
    recursive: true
  });
  writeFileSync(
    join(checkout, 'node_modules', 'expo', 'package.json'),
    '{"name":"expo"}'
  );
  writeFileSync(
    join(checkout, 'node_modules', '@expo', 'fingerprint', 'index.js'),
    fakeFingerprint
  );
}

const git = (cwd: string, ...args: string[]) =>
  execFileSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
    { cwd, stdio: 'ignore' }
  );

// `seedBuild` fills the dev build cache with `build` and installs that APK, then clears the
// call log, so a test starts from a cache hit with the matching build installed.
async function harness(
  seed: Partial<FakeState> = {},
  { seedBuild = true } = {}
) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'device-stack-')));
  directories.push(dir);
  const bin = join(dir, 'bin');
  const root = join(dir, 'checkout');
  const home = join(dir, 'home');
  const port = await freePort();

  mkdirSync(bin);
  mkdirSync(root);
  mkdirSync(home);
  copyFileSync(resolve('app.json'), join(root, 'app.json'));
  writeFileSync(join(root, '.gitignore'), 'node_modules\n.device-stack\n');
  git(root, 'init', '-q');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'checkout');
  fakeExpo(root);
  writeFileSync(
    join(bin, 'java'),
    '#!/bin/sh\necho \'openjdk version "17.0.12"\' >&2\n'
  );
  chmodSync(join(bin, 'java'), 0o755);
  writeFileSync(join(dir, 'fake.js'), fakeImpl);
  writeFileSync(join(dir, 'metro.js'), fakeMetro);

  // Node itself runs each fake, so a process's argv never changes after it starts.
  for (const name of [
    'adb',
    'emulator',
    'lsof',
    'agent-device',
    'pnpm',
    'avdmanager'
  ]) {
    writeFileSync(
      join(bin, name),
      `#!${process.execPath}\nrequire(${JSON.stringify(join(dir, 'fake.js'))})\n`
    );
    chmodSync(join(bin, name), 0o755);
  }

  const statePath = join(dir, 'fake-state.json');
  const logPath = join(dir, 'calls.log');
  writeFileSync(logPath, '');
  writeFileSync(
    statePath,
    JSON.stringify({
      avds: [AUDIT_AVD, AVD],
      booted: false,
      installed: null,
      fingerprint: 'fingerprint-1',
      // The maintainer's emulator holds its console and adb ports.
      listeners: [
        { pid: 999_991, cwd: '/', port: 5554 },
        { pid: 999_991, cwd: '/', port: 5555 }
      ],
      ...seed
    })
  );
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: home,
    CI: '1',
    PATH: `${bin}${delimiter}${process.env.PATH}`,
    DEVICE_STACK_PORT: String(port),
    FAKE_STATE: statePath,
    FAKE_LOG: logPath,
    FAKE_METRO: join(dir, 'metro.js')
  };
  const fakeState = (): FakeState =>
    JSON.parse(readFileSync(statePath, 'utf8'));
  const recorded = () => {
    const path = join(root, '.device-stack', 'state.json');

    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  };

  // Starts a Metro that `start` did not start, as another process would have.
  async function runningMetro({ cwd = root, slug = 'liftlog' } = {}) {
    const child = spawn(process.execPath, [join(dir, 'metro.js')], {
      env: { ...env, FAKE_SLUG: slug },
      stdio: ['ignore', 'pipe', 'ignore']
    });
    pids.push(child.pid!);
    await new Promise(done => child.stdout!.once('data', done));
    const state = fakeState();
    state.listeners.push({ pid: child.pid!, cwd, port });
    writeFileSync(statePath, JSON.stringify(state));

    return child.pid!;
  }

  delete env.JAVA_HOME;

  // Runs the script in a checkout; `onSpawn` receives the child, so a test can signal it.
  function stackIn(
    cwd: string,
    args: string[],
    onSpawn?: (child: ReturnType<typeof spawn>) => void
  ) {
    return new Promise<{
      status: number | null;
      signal: NodeJS.Signals | null;
      stdout: string;
      stderr: string;
      calls: Call[];
    }>(done => {
      const child = spawn(process.execPath, [script, ...args], { cwd, env });
      onSpawn?.(child);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => (stdout += chunk));
      child.stderr.on('data', chunk => (stderr += chunk));
      child.on('close', (status, signal) => {
        const state = recorded();

        for (const pid of [
          state?.metro?.pid,
          state?.jsLogs?.pid,
          state?.devBuild?.pid,
          fakeState().emulatorPid,
          ...fakeState()
            .listeners.map(listener => listener.pid)
            .filter(pid => pid !== 999_991)
        ]) {
          if (pid) {
            pids.push(pid);
          }
        }

        const calls = readFileSync(logPath, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map(line => JSON.parse(line) as Call);
        done({ status, signal, stdout, stderr, calls });
      });
    });
  }

  const stack = (...args: string[]) => stackIn(root, args);

  // A second worktree of the checkout's repository: it shares the git common dir, so the
  // dev build cache, and the host, so the build lock.
  function worktree() {
    const path = join(dir, 'worktree');
    git(root, 'worktree', 'add', '-q', path);
    fakeExpo(path);

    return path;
  }

  const buildLock = join(home, '.liftlog-device-stack', 'build.lock');

  if (seedBuild) {
    const built = await stack('build');
    expect(built.status).toBe(0);
    const { apk } = JSON.parse(built.stdout);
    const state = fakeState();
    state.installed = readFileSync(apk, 'utf8');
    writeFileSync(statePath, JSON.stringify(state));
    writeFileSync(logPath, '');
    rmSync(join(root, '.device-stack'), { recursive: true });
  }

  const editFake = (edit: (state: FakeState) => void) => {
    const state = fakeState();
    edit(state);
    writeFileSync(statePath, JSON.stringify(state));
  };

  const editRecorded = (edit: (state: Record<string, any>) => void) => {
    const path = join(root, '.device-stack', 'state.json');
    const state = JSON.parse(readFileSync(path, 'utf8'));
    edit(state);
    writeFileSync(path, JSON.stringify(state));
  };

  return {
    root,
    dir,
    port,
    stack,
    stackIn,
    worktree,
    buildLock,
    editFake,
    runningMetro,
    fakeState,
    recorded,
    editRecorded,
    logPath
  };
}

const commands = (calls: Call[]) =>
  calls.map(({ name, args }) => [name, ...args].join(' '));
const allCalls = (logPath: string) =>
  readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as Call);
const target = (session: string) => `--serial ${SERIAL} --session ${session}`;

// Every device call names the harness serial: adb with `-s`, agent-device with `--serial`
// and this run's `--session`. No call names the phone or the maintainer's emulator.
function expectTargeted(calls: Call[], session?: string) {
  for (const { name, args } of calls) {
    const line = [name, ...args].join(' ');
    expect(line).not.toContain(PHONE);
    expect(line).not.toContain(FOREIGN);

    if (name === 'adb') {
      expect(args.slice(0, 2)).toEqual(['-s', SERIAL]);
    }

    if (name === 'agent-device') {
      expect(args.slice(-4)).toEqual([
        '--serial',
        SERIAL,
        '--session',
        session ?? args.at(-1)
      ]);
      expect(args.at(-1)).toMatch(/^liftlog-/);
    }
  }
}

const link = (port: number) =>
  `liftlog://expo-development-client/?url=${encodeURIComponent(`http://10.0.2.2:${port}`)}`;

afterEach(() => {
  for (const pid of pids.splice(0)) {
    for (const target of [-pid, pid]) {
      try {
        process.kill(target, 'SIGKILL');
      } catch {}
    }
  }

  directories.splice(0).forEach(dir => rmSync(dir, { recursive: true }));
});

jest.setTimeout(30_000);

test('start boots the harness emulator beside a phone and a foreign emulator, opens the app on its Metro port and prints its state', async () => {
  const { root, port, stack, logPath } = await harness();

  const { status, stdout, stderr, calls } = await stack('start');

  expect(status).toBe(0);
  const state = JSON.parse(stdout);
  const session = state.session;
  expect(session).toMatch(/^liftlog-/);
  expect(commands(calls)).toEqual(
    expect.arrayContaining([
      'emulator -list-avds',
      `emulator -avd ${AVD} -port 5556 -no-snapshot-save`,
      `adb -s ${SERIAL} emu avd name`,
      `adb -s ${SERIAL} reverse tcp:${port} tcp:${port}`,
      `adb -s ${SERIAL} shell pm path ${PACKAGE}`,
      `pnpm exec expo start --dev-client --port ${port}`,
      `adb -s ${SERIAL} logcat -T 1 -s ReactNativeJS:V`,
      `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} ${target(session)}`,
      `agent-device wait id=workout-start-screen 180000 ${target(session)}`
    ])
  );
  expect(commands(calls)).not.toContain('adb devices');
  expectTargeted(allCalls(logPath), session);
  const order = commands(calls);
  expect(
    order.findIndex(call => call.startsWith('agent-device open'))
  ).toBeGreaterThan(
    order.indexOf(`adb -s ${SERIAL} logcat -T 1 -s ReactNativeJS:V`)
  );
  // Metro starts without CI, so reloads stay on.
  expect(calls.find(call => call.name === 'pnpm')?.ci).toBeNull();
  expect(order).not.toContain(`adb -s ${SERIAL} shell pm clear ${PACKAGE}`);
  // The installed build matches the cached one, so nothing is built or installed.
  expect(order.some(call => call.includes(' install '))).toBe(false);
  expect(calls.map(call => call.name)).not.toContain('gradlew');
  expect(stderr).toContain(`booting ${AVD} as ${SERIAL}`);

  const dir = join(root, '.device-stack');
  expect(state).toMatchObject({
    running: true,
    startScreen: true,
    root,
    port,
    package: PACKAGE,
    emulator: {
      serial: SERIAL,
      avd: AVD,
      started: true,
      process: { markers: ['-avd', AVD, '-port', '5556'] }
    },
    reverse: `tcp:${port}`,
    metro: { started: true, log: join(dir, 'metro.log') },
    jsLogs: { started: true, log: join(dir, 'js.log') }
  });
  expect(state.metro.process).toMatchObject({ pid: state.metro.pid });
  expect(state.metro.process.startTime).toEqual(expect.any(String));
  expect(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'))).toEqual(
    state
  );
  expect(readFileSync(state.metro.log, 'utf8')).toContain(
    'fake metro listening'
  );
  expect(readFileSync(state.jsLogs.log, 'utf8')).toContain('ReactNativeJS');
});

test('start refuses a missing harness AVD and names the template command without booting anything', async () => {
  const { stack } = await harness({ avds: [AUDIT_AVD] });

  const { status, stderr, calls } = await stack('start');

  expect(status).toBe(1);
  expect(stderr).toContain(
    `${AVD} does not exist. Create it with \`pnpm run device:stack template\``
  );
  expect(commands(calls).filter(call => !call.startsWith('lsof'))).toEqual([
    'emulator -list-avds'
  ]);
});

test('template creates the harness AVD once', async () => {
  const { stack, fakeState } = await harness({ avds: [AUDIT_AVD] });

  const created = await stack('template');
  expect(created.status).toBe(0);
  expect(JSON.parse(created.stdout)).toMatchObject({ avd: AVD, created: true });
  expect(
    commands(created.calls).find(call => call.startsWith('avdmanager'))
  ).toMatch(
    new RegExp(
      `^avdmanager create avd --name ${AVD} --package system-images;android-34;google_apis;(arm64-v8a|x86_64) --device pixel_7$`
    )
  );
  expect(fakeState().avds).toEqual([AUDIT_AVD, AVD]);

  const again = await stack('template');
  expect(JSON.parse(again.stdout)).toEqual({ avd: AVD, created: false });
  expect(commands(again.calls.slice(created.calls.length))).toEqual([
    'emulator -list-avds'
  ]);
});

test('start --fresh clears app data and waits for Workout without an onboarding timeout when the overlay is absent', async () => {
  const { stack, logPath } = await harness();

  const { status, calls } = await stack('start', '--fresh');

  expect(status).toBe(0);
  const order = commands(calls);
  const clear = order.indexOf(`adb -s ${SERIAL} shell pm clear ${PACKAGE}`);
  expect(clear).toBeGreaterThan(-1);
  expect(clear).toBeLessThan(
    order.findIndex(call => call.startsWith('agent-device open'))
  );
  expect(
    calls
      .filter(
        call => call.name === 'agent-device' && call.args[0] !== 'snapshot'
      )
      .map(call => call.args[0])
  ).toEqual(['open', 'wait']);
  expectTargeted(allCalls(logPath));
});

test('start --fresh dismisses dev-client onboarding before waiting for Workout', async () => {
  const { stack, logPath } = await harness({ onboarding: true });

  const { status, stdout, calls } = await stack('start', '--fresh');

  expect(status).toBe(0);
  const { session } = JSON.parse(stdout);
  expect(
    commands(calls.filter(call => call.name === 'agent-device')).slice(-3)
  ).toEqual([
    `agent-device press label="Continue" --settle ${target(session)}`,
    `agent-device press label="Close" ${target(session)}`,
    `agent-device wait id=workout-start-screen 180000 ${target(session)}`
  ]);
  expectTargeted(allCalls(logPath), session);
});

test('start fails before opening the app when a foreign server answers Metro status on the port', async () => {
  const { stack, logPath } = await harness({ foreignMetro: true });

  const { status, stderr, calls } = await stack('start');

  expect(status).toBe(1);
  expect(stderr).toMatch(/not the Metro this run started/);
  expect(calls.map(call => call.name)).not.toContain('agent-device');
  expectTargeted(allCalls(logPath));
  await stack('stop');
});

test('start refuses a Metro from another project without stopping it or starting anything', async () => {
  const { root, stack, runningMetro, recorded } = await harness();
  const metro = await runningMetro({ slug: 'other-app' });

  const { status, stderr, calls } = await stack('start');

  expect(status).toBe(1);
  expect(stderr).toMatch(/not this project's Metro.*"other-app"/);
  expect(alive(metro)).toBe(true);
  expect(calls.map(call => call.name)).toEqual(['lsof']);
  expect(recorded()).toBeNull();
  expect(existsSync(join(root, '.device-stack'))).toBe(false);
});

test("start refuses this project's Metro from another checkout without stopping it", async () => {
  const { stack, runningMetro } = await harness();
  const other = realpathSync(mkdtempSync(join(tmpdir(), 'liftlog-worktree-')));
  directories.push(other);
  const metro = await runningMetro({ cwd: other });

  const { status, stderr, calls } = await stack('start');

  expect(status).toBe(1);
  expect(stderr).toContain(
    `Metro from another checkout (pid ${metro} in ${other})`
  );
  expect(alive(metro)).toBe(true);
  expect(new Set(calls.map(call => call.name))).toEqual(new Set(['lsof']));
});

const gradleCalls = (logPath: string) =>
  allCalls(logPath).filter(call => call.name === 'gradlew');

async function waitUntil(check: () => boolean) {
  const deadline = Date.now() + 20_000;

  while (!check()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for the condition.');
    }

    await new Promise(done => setTimeout(done, 100));
  }
}

test.each([
  ['the app is not installed', null],
  ['another build is installed', 'apk:fingerprint-0']
])(
  'a cache hit installs the cached APK once without running Gradle when %s',
  async (_, installed) => {
    const { stack, editFake, fakeState, logPath } = await harness();
    const cached = fakeState().installed;
    editFake(state => (state.installed = installed));

    const { status, stdout, calls } = await stack('start');

    expect(status).toBe(0);
    const state = JSON.parse(stdout);
    expect(state.devBuild).toMatchObject({ built: false, installed: true });
    const order = commands(calls);
    expect(
      order.filter(call => call.startsWith('adb -s ' + SERIAL + ' install'))
    ).toEqual([`adb -s ${SERIAL} install -r -d ${state.devBuild.apk}`]);
    expect(order.findIndex(call => call.includes(' install '))).toBeLessThan(
      order.findIndex(call => call.startsWith('agent-device open'))
    );
    expect(calls.map(call => call.name)).not.toContain('gradlew');
    expect(fakeState().installed).toBe(cached);
    expectTargeted(allCalls(logPath), state.session);
    await stack('stop');
  }
);

test('start --no-build on a miss exits with BUILD_MISSING before building or booting', async () => {
  const { root, stack, recorded, logPath } = await harness(
    {},
    { seedBuild: false }
  );

  const { status, stderr, calls } = await stack('start', '--no-build');

  expect(status).toBe(1);
  expect(stderr).toContain('BUILD_MISSING: no cached dev build for key');
  expect(calls.map(call => call.name).filter(name => name !== 'lsof')).toEqual(
    []
  );
  expect(recorded()).toBeNull();
  expect(existsSync(join(root, '.device-stack', 'build.log'))).toBe(false);
  expect(gradleCalls(logPath)).toEqual([]);
});

test('a cache build regenerates android/ from scratch, so a file planted there never reaches it', async () => {
  const { root, stack } = await harness({}, { seedBuild: false });
  mkdirSync(join(root, 'android'));
  writeFileSync(join(root, 'android', 'planted.gradle'), 'stale');

  const { status, stdout, calls } = await stack('build');

  expect(status).toBe(0);
  expect(commands(calls)).toContain(
    'pnpm exec expo prebuild --platform android --no-install'
  );
  const gradle = calls.filter(call => call.name === 'gradlew');
  expect(gradle).toHaveLength(1);
  expect(gradle[0].args).toEqual([
    'app:assembleDebug',
    expect.stringMatching(/^-PreactNativeArchitectures=(arm64-v8a|x86_64)$/)
  ]);
  expect(gradle[0].files).toEqual(['gradlew']);
  const { apk, built } = JSON.parse(stdout);
  expect(built).toBe(true);
  expect(apk).toContain(join(root, '.git', 'device-stack', 'dev-builds'));
  expect(readFileSync(apk, 'utf8')).toBe('apk:fingerprint-1');
});

test.each([
  ['fails', { gradleFails: true }, 'the dev build failed'],
  [
    'sees the build key change',
    { fingerprintAfterBuild: 'fingerprint-2' },
    'the dev build key changed during the build, so nothing was published'
  ]
])(
  'a build that %s publishes nothing and exits with BUILD_FAILED and its log path',
  async (_, seed, reason) => {
    const { root, stack, buildLock } = await harness(seed, {
      seedBuild: false
    });

    const { status, stderr } = await stack('build');

    expect(status).toBe(1);
    const buildLog = join(root, '.device-stack', 'build.log');
    expect(stderr).toContain(`BUILD_FAILED: ${reason}; see ${buildLog}.`);
    expect(readFileSync(buildLog, 'utf8')).toContain('assembleDebug');
    const cache = join(root, '.git', 'device-stack', 'dev-builds');
    expect(existsSync(cache) ? readdirSync(cache) : []).toEqual([]);
    expect(existsSync(buildLock)).toBe(false);
  }
);

test('two worktrees missing the same key run one build, and the second installs its result', async () => {
  const { dir, stack, stackIn, worktree, editFake, logPath } = await harness(
    {},
    { seedBuild: false }
  );
  const hold = join(dir, 'release-gradle');
  editFake(state => (state.gradleHold = hold));
  const other = worktree();

  const first = stack('build');
  await waitUntil(() => gradleCalls(logPath).length > 0);
  const second = stackIn(other, ['start']);
  await waitUntil(() => existsSync(join(other, '.device-stack', 'state.json')));
  writeFileSync(hold, '');
  const [built, started] = await Promise.all([first, second]);

  expect(built.status).toBe(0);
  expect(started.status).toBe(0);
  const { apk } = JSON.parse(built.stdout);
  const state = JSON.parse(started.stdout);
  expect(state.devBuild).toMatchObject({ built: true, installed: true, apk });
  expect(commands(started.calls)).toContain(
    `adb -s ${SERIAL} install -r -d ${apk}`
  );
  expect(gradleCalls(logPath)).toHaveLength(1);
  expect(gradleCalls(logPath)[0].cwd).not.toContain(other);
  await stackIn(other, ['stop']);
});

test('killing start leaves the build lock with the build process, and the next start installs its APK', async () => {
  const { dir, root, stack, stackIn, buildLock, editFake, fakeState, logPath } =
    await harness({}, { seedBuild: false });
  const hold = join(dir, 'release-gradle');
  editFake(state => (state.gradleHold = hold));
  let starter: ReturnType<typeof spawn> | undefined;

  const first = stackIn(root, ['start'], child => (starter = child));
  await waitUntil(() => gradleCalls(logPath).length > 0);
  const owner = JSON.parse(readFileSync(buildLock, 'utf8'));
  pids.push(owner.pid);
  starter!.kill('SIGTERM');
  const killed = await first;

  expect(killed.signal).toBe('SIGTERM');
  await new Promise(done => setTimeout(done, 300));
  expect(JSON.parse(readFileSync(buildLock, 'utf8'))).toEqual(owner);
  expect(owner.pid).not.toBe(starter!.pid);
  expect(owner.markers).toContain('build-worker');
  expect(alive(owner.pid)).toBe(true);

  writeFileSync(hold, '');
  await waitUntil(() => !existsSync(buildLock));
  await stack('stop');
  const next = await stack('start');

  expect(next.status).toBe(0);
  const state = JSON.parse(next.stdout);
  expect(state.devBuild).toMatchObject({ built: false, installed: true });
  expect(fakeState().installed).toBe('apk:fingerprint-1');
  expect(gradleCalls(logPath)).toHaveLength(1);
  await stack('stop');
});

test('stop leaves an already-running Metro alone and ends the harness emulator it started', async () => {
  const { root, stack, runningMetro, fakeState, logPath } = await harness();
  const metro = await runningMetro();

  const started = await stack('start');
  expect(started.status).toBe(0);
  const state = JSON.parse(started.stdout);
  expect(state).toMatchObject({
    metro: {
      pids: [metro],
      started: false,
      log: null,
      output: 'in the terminal that started this Metro'
    }
  });

  const { status, stdout } = await stack('stop');

  expect(status).toBe(0);
  expect(JSON.parse(stdout)).toEqual({
    running: false,
    stopped: ['session', 'jsLogs', 'emulator']
  });
  expect(alive(metro)).toBe(true);
  expect(fakeState().booted).toBe(false);
  await new Promise(done => setTimeout(done, 200));
  expect(alive(state.jsLogs.pid)).toBe(false);
  expect(existsSync(join(root, '.device-stack', 'state.json'))).toBe(false);
  expectTargeted(allCalls(logPath), state.session);
});

test('stop ends the emulator, Metro and log capture that start started', async () => {
  const { stack, fakeState, logPath } = await harness();
  const started = JSON.parse((await stack('start')).stdout);

  const { status, stdout, calls } = await stack('stop');

  expect(status).toBe(0);
  expect(JSON.parse(stdout)).toEqual({
    running: false,
    stopped: ['session', 'jsLogs', 'metro', 'emulator']
  });
  expect(commands(calls)).toEqual(
    expect.arrayContaining([
      `agent-device close ${target(started.session)}`,
      `adb -s ${SERIAL} emu kill`
    ])
  );
  expect(fakeState().booted).toBe(false);
  await new Promise(done => setTimeout(done, 200));
  expect(alive(started.metro.pid)).toBe(false);
  expect(alive(started.jsLogs.pid)).toBe(false);
  expectTargeted(allCalls(logPath), started.session);
});

test('stop and status distrust a recorded process whose start time no longer matches its PID', async () => {
  const { stack, editRecorded } = await harness();
  const started = JSON.parse((await stack('start')).stdout);
  // The PID now belongs to a different process than the one start recorded.
  editRecorded(state => {
    state.jsLogs.process.startTime = 'Mon Jan  1 00:00:00 2001';
    state.metro.process.markers = ['some-other-command'];
  });

  const observed = JSON.parse((await stack('status')).stdout);
  expect(observed).toMatchObject({
    running: false,
    observed: { emulator: 'running', metro: 'stopped', jsLogs: 'stopped' }
  });

  const { stdout } = await stack('stop');

  expect(JSON.parse(stdout)).toEqual({
    running: false,
    stopped: ['session', 'emulator'],
    untrusted: ['jsLogs', 'metro']
  });
  await new Promise(done => setTimeout(done, 200));
  expect(alive(started.jsLogs.pid)).toBe(true);
  expect(alive(started.metro.pid)).toBe(true);
});

test('status reports observed processes, or that nothing is running', async () => {
  const { stack } = await harness();

  const idle = await stack('status');
  expect(idle.status).toBe(0);
  expect(JSON.parse(idle.stdout)).toEqual({
    running: false,
    message: 'Nothing is running.'
  });

  const started = JSON.parse((await stack('start')).stdout);
  const running = await stack('status');
  expect(running.status).toBe(0);
  expect(JSON.parse(running.stdout)).toEqual({
    ...started,
    observed: { emulator: 'running', metro: 'running', jsLogs: 'running' }
  });
});
