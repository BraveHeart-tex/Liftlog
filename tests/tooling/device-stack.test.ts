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
const TEMPLATE = {
  snapshot: 'liftlog_template',
  version: '2026-11-25T00:00:00.000Z'
};
const instanceBoot = (lease: string, port = 5556) =>
  `emulator -avd ${AVD} -port ${port} -read-only -snapshot liftlog_template -no-snapshot-save -no-boot-anim -prop debug.liftlog.lease=${lease}`;

// One fake implementation behind every binary the script calls (`adb`, `emulator`, `lsof`,
// `agent-device`, `pnpm`, `avdmanager`, and the `gradlew` the fake prebuild writes). Each call
// is logged; device and listener state lives in a JSON file the test seeds. Long-running fakes
// (emulator, logcat, Metro) stay alive like the real ones so `stop` has something to end.
// Gradle logs the android/ entries it builds from, waits while \`gradleHold\` names a missing
// file, and writes an APK whose content is the fingerprint at the end of the build.
const fakeImpl = `
const { appendFileSync, chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, writeFileSync } = require('node:fs')
const { spawn } = require('node:child_process')
const { join } = require('node:path')
const name = require('node:path').basename(process.argv[1])
const args = process.argv.slice(2)
const statePath = process.env.FAKE_STATE
const read = () => JSON.parse(readFileSync(statePath, 'utf8'))
// Concurrent fakes edit the state under a directory lock and replace it whole.
const update = edit => {
  for (;;) {
    try { mkdirSync(statePath + '.lock'); break } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5) }
  }
  try {
    const current = read()
    edit(current)
    writeFileSync(statePath + '.' + process.pid, JSON.stringify(current))
    renameSync(statePath + '.' + process.pid, statePath)
  } finally { rmdirSync(statePath + '.lock') }
}
appendFileSync(process.env.FAKE_LOG, JSON.stringify({
  name, args, ci: process.env.CI ?? null, cwd: process.cwd(),
  ...(name === 'gradlew' && { files: readdirSync('.') })
}) + '\\n')
const stayAlive = () => setInterval(() => {}, 1000)
const state = read()
const avdOf = serial =>
  serial === '${FOREIGN}' ? '${AUDIT_AVD}' : state.emulators[serial?.slice('emulator-'.length)]?.avd ?? null
if (name === 'emulator') {
  if (args[0] === '-list-avds') process.stdout.write(state.avds.join('\\n') + '\\n')
  else {
    const port = args[args.indexOf('-port') + 1]
    update(s => { s.emulators[port] = { avd: args[args.indexOf('-avd') + 1], pid: process.pid } })
    stayAlive()
  }
} else if (name === 'avdmanager') {
  update(s => { s.avds.push(args[args.indexOf('--name') + 1]) })
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
  else if (command === 'shell ping -c 1 -W 1 10.0.2.2') process.stdout.write('1 packets transmitted, 1 received, 0% packet loss, time 0ms\\n')
  else if (command.startsWith('shell setprop debug.liftlog.lease ')) {
    update(s => { s.emulators[serial.slice('emulator-'.length)].token = rest.at(-1) })
  } else if (command === 'shell getprop debug.liftlog.lease') {
    process.stdout.write((state.tokenOverride ?? state.emulators[serial.slice('emulator-'.length)]?.token ?? '') + '\\n')
  }
  else if (command === 'shell pm path ${PACKAGE}') {
    if (state.installed === null) process.exit(1)
    process.stdout.write('package:/data/app/~~x/${PACKAGE}-y/base.apk\\n')
  } else if (rest[0] === 'shell' && rest[1] === 'sha256sum') {
    const hash = require('node:crypto').createHash('sha256').update(state.installed).digest('hex')
    process.stdout.write(hash + '  ' + rest[2] + '\\n')
  } else if (rest[0] === 'install') {
    update(s => { s.installed = readFileSync(rest.at(-1), 'utf8') })
  } else if (rest[0] === 'logcat') {
    process.stdout.write('I ReactNativeJS: fake log line\\n'); stayAlive()
  } else if (command === 'emu kill') {
    update(s => {
      const port = serial.slice('emulator-'.length)
      try { process.kill(s.emulators[port].pid) } catch {}
      delete s.emulators[port]
    })
  }
} else if (name === 'lsof') {
  if (args.includes('-sTCP:LISTEN')) {
    const port = Number(args.find(arg => arg.startsWith('-iTCP:')).slice(6))
    // Only live listeners, and the maintainer's emulator, which has no real process.
    const live = l => { try { return l.pid === 999991 || process.kill(l.pid, 0) } catch { return false } }
    process.stdout.write(state.listeners.filter(l => l.port === port && live(l)).map(l => l.pid).join('\\n'))
  } else {
    const pid = Number(args[args.indexOf('-p') + 1])
    const listener = state.listeners.find(l => l.pid === pid)
    if (listener) process.stdout.write('p' + pid + '\\nfcwd\\nn' + listener.cwd + '\\n')
  }
} else if (name === 'agent-device' && args[0] === 'press' && args[1] === 'label="Close"') {
  update(s => { s.onboarding = false })
} else if (name === 'agent-device' && args[0] === 'snapshot') {
  process.stdout.write(state.redbox
    ? 'Render Error\\nThis error is located at:'
    : state.onboarding
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
    if (current.fingerprintAfterBuild) update(s => { s.fingerprint = current.fingerprintAfterBuild })
    const out = join('app', 'build', 'outputs', 'apk', 'debug')
    mkdirSync(out, { recursive: true })
    writeFileSync(join(out, 'app-debug.apk'), 'apk:' + current.fingerprint)
    process.exit(0)
  }
  const wait = () => (!state.gradleHold || existsSync(state.gradleHold) ? finish() : setTimeout(wait, 100))
  wait()
} else if (name === 'pnpm') {
  // The listener lsof reports: this Metro, or another process that took the port first.
  const port = Number(args[args.indexOf('--port') + 1])
  process.env.FAKE_METRO_PORT = String(port)
  if (state.foreignMetro) {
    const foreign = spawn(process.execPath, [process.env.FAKE_METRO], { detached: true, stdio: 'ignore' })
    foreign.unref()
    update(s => { s.listeners.push({ pid: foreign.pid, cwd: '/', port }) })
    stayAlive()
  } else {
    update(s => { s.listeners.push({ pid: process.pid, cwd: process.cwd(), port }) })
    require(process.env.FAKE_METRO)
  }
}
`;

// A fake Metro: answers /status and the manifest with the slug and name it is given, on
// FAKE_METRO_PORT, and logs a bundling error when the fake state asks for one.
const fakeMetro = `
const { createServer } = require('node:http')
const { FAKE_SLUG = 'liftlog', FAKE_NAME = 'Liftlog', FAKE_METRO_PORT, FAKE_STATE } = process.env
createServer((request, response) => {
  if (request.url === '/status') return response.end('packager-status:running')
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({ extra: { expoClient: { slug: FAKE_SLUG, name: FAKE_NAME } } }))
}).listen(Number(FAKE_METRO_PORT), '127.0.0.1', () => {
  console.log('fake metro listening')
  if (JSON.parse(require('node:fs').readFileSync(FAKE_STATE, 'utf8')).bundlingError) {
    console.log('\\x1b[31mAndroid Bundling failed \\x1b[39m12ms index.js (1 module)')
    console.log('SyntaxError: src/app/index.tsx: Unexpected token (3:7)')
  }
})
`;

type Listener = { pid: number; cwd: string; port: number };
type FakeState = {
  avds: string[];
  // Running harness emulators by console port.
  emulators: Record<string, { avd: string; pid: number; token?: string }>;
  // What every device reports as its lease token, whatever was set.
  tokenOverride?: string;
  // Content of the installed APK, null when the app is not installed.
  installed: string | null;
  fingerprint: string;
  fingerprintAfterBuild?: string;
  gradleFails?: boolean;
  gradleHold?: string;
  onboarding?: boolean;
  redbox?: boolean;
  bundlingError?: boolean;
  foreignMetro?: boolean;
  listeners: Listener[];
};
type Lease = {
  id: string;
  slot: number;
  serial: string;
  consolePort: number;
  root: string;
  operation: { kind: string } | null;
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
// `hooks` is the source of a module the script loads to act at its check points, and
// `limit` the host config's emulator limit.
async function harness(
  seed: Partial<FakeState> = {},
  {
    seedBuild = true,
    seedTemplate = true,
    hooks,
    limit
  }: {
    seedBuild?: boolean;
    seedTemplate?: boolean;
    hooks?: string;
    limit?: number;
  } = {}
) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'device-stack-')));
  directories.push(dir);
  const bin = join(dir, 'bin');
  const root = join(dir, 'checkout');
  const home = join(dir, 'home');
  // The Metro port of slot 0 and slot 1.
  const ports = [await freePort(), await freePort()];
  const [port] = ports;

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
  const hostDir = join(home, '.liftlog-device-stack');

  const writeConfig = (config: { limit?: number } = {}) =>
    writeFileSync(
      join(hostDir, 'config.json'),
      JSON.stringify({ metroPorts: ports, ...config })
    );

  mkdirSync(hostDir);
  writeConfig(limit === undefined ? {} : { limit });

  if (seedTemplate) {
    writeFileSync(join(hostDir, 'template.json'), JSON.stringify(TEMPLATE));
  }

  if (hooks) {
    writeFileSync(join(dir, 'hooks.mjs'), hooks);
  }

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
      emulators: {},
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
    FAKE_STATE: statePath,
    FAKE_LOG: logPath,
    FAKE_METRO: join(dir, 'metro.js'),
    HOOK_DIR: dir,
    ...(hooks && { DEVICE_STACK_HOOKS: join(dir, 'hooks.mjs') })
  };
  const fakeState = (): FakeState =>
    JSON.parse(readFileSync(statePath, 'utf8'));
  const recorded = () => {
    const path = join(root, '.device-stack', 'state.json');

    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  };

  // Starts a Metro that `start` did not start, as another process would have.
  async function runningMetro({
    cwd = root,
    slug = 'liftlog',
    on = port
  } = {}) {
    const child = spawn(process.execPath, [join(dir, 'metro.js')], {
      env: { ...env, FAKE_SLUG: slug, FAKE_METRO_PORT: String(on) },
      stdio: ['ignore', 'pipe', 'ignore']
    });
    pids.push(child.pid!);
    await new Promise(done => child.stdout!.once('data', done));
    const state = fakeState();
    state.listeners.push({ pid: child.pid!, cwd, port: on });
    writeFileSync(statePath, JSON.stringify(state));

    return child.pid!;
  }

  delete env.JAVA_HOME;

  // Runs the script in a checkout; `onSpawn` receives the child, so a test can signal it.
  function stackIn(
    cwd: string,
    args: string[],
    onSpawn?: (child: ReturnType<typeof spawn>) => void,
    extraEnv: Record<string, string> = {}
  ) {
    return new Promise<{
      status: number | null;
      signal: NodeJS.Signals | null;
      stdout: string;
      stderr: string;
      calls: Call[];
    }>(done => {
      const child = spawn(process.execPath, [script, ...args], {
        cwd,
        env: { ...env, ...extraEnv }
      });
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
          ...Object.values(fakeState().emulators).map(({ pid }) => pid),
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

  const buildLock = join(hostDir, 'build.lock');
  const registry = () => {
    const path = join(hostDir, 'registry.json');

    return existsSync(path)
      ? (JSON.parse(readFileSync(path, 'utf8')) as { leases: Lease[] })
      : { leases: [] };
  };

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
    ports,
    writeConfig,
    stack,
    stackIn,
    worktree,
    buildLock,
    hostDir,
    registry,
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
      instanceBoot(state.lease.id),
      `adb -s ${SERIAL} shell setprop debug.liftlog.lease ${state.lease.id}`,
      `adb -s ${SERIAL} shell ping -c 1 -W 1 10.0.2.2`,
      `adb -s ${SERIAL} emu avd name`,
      `adb -s ${SERIAL} shell pm path ${PACKAGE}`,
      `pnpm exec expo start --dev-client --port ${port}`,
      `adb -s ${SERIAL} logcat -T 1 -s ReactNativeJS:V`,
      `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} ${target(session)}`,
      `agent-device snapshot --raw --timeout 5000 ${target(session)}`
    ])
  );
  expect(commands(calls)).not.toContain('adb devices');
  // The dev client reaches Metro through 10.0.2.2, not adb reverse.
  expect(commands(calls).some(call => call.includes(' reverse '))).toBe(false);
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
  expect(stderr).toContain(`booting a read-only ${AVD} instance as ${SERIAL}`);

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
      process: {
        markers: [
          '-avd',
          AVD,
          '-port',
          '5556',
          `debug.liftlog.lease=${state.lease.id}`
        ]
      }
    },
    lease: { templateVersion: TEMPLATE.version },
    devBuild: { foundInstalled: true },
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
    `${AVD} or its template snapshot does not exist. Create them with \`pnpm run device:stack template\``
  );
  expect(commands(calls).filter(call => !call.startsWith('lsof'))).toEqual([
    'emulator -list-avds'
  ]);
});

test('template creates the harness AVD and a clean template snapshot once', async () => {
  const { stack, fakeState, editFake, hostDir } = await harness(
    { avds: [AUDIT_AVD] },
    { seedTemplate: false }
  );
  editFake(state => (state.installed = null));

  const created = await stack('template');

  expect(created.status).toBe(0);
  const output = JSON.parse(created.stdout);
  expect(output).toMatchObject({
    avd: AVD,
    created: true,
    template: { snapshot: 'liftlog_template', version: expect.any(String) }
  });
  const order = commands(created.calls).filter(
    call => !call.startsWith('lsof')
  );
  expect(order.find(call => call.startsWith('avdmanager'))).toMatch(
    new RegExp(
      `^avdmanager create avd --name ${AVD} --package system-images;android-34;google_apis;(arm64-v8a|x86_64) --device pixel_7$`
    )
  );
  expect(order).toEqual(
    expect.arrayContaining([
      `emulator -avd ${AVD} -port 5556 -wipe-data -no-snapshot-load -no-boot-anim`,
      `adb -s ${SERIAL} shell settings put global window_animation_scale 0`,
      `adb -s ${SERIAL} shell settings put global transition_animation_scale 0`,
      `adb -s ${SERIAL} shell settings put global animator_duration_scale 0`,
      `adb -s ${SERIAL} shell pm path ${PACKAGE}`,
      `adb -s ${SERIAL} emu avd snapshot save liftlog_template`,
      `adb -s ${SERIAL} emu kill`
    ])
  );
  expect(
    order.indexOf(`adb -s ${SERIAL} emu avd snapshot save liftlog_template`)
  ).toBeGreaterThan(order.indexOf(`adb -s ${SERIAL} shell pm path ${PACKAGE}`));
  expectTargeted(created.calls);
  expect(fakeState().avds).toEqual([AUDIT_AVD, AVD]);
  expect(
    JSON.parse(readFileSync(join(hostDir, 'template.json'), 'utf8'))
  ).toEqual(output.template);

  const again = await stack('template');
  expect(JSON.parse(again.stdout)).toEqual({
    avd: AVD,
    created: false,
    template: output.template
  });
  expect(commands(again.calls.slice(created.calls.length))).toEqual([
    'emulator -list-avds'
  ]);
});

test('template --recreate refuses while any lease is live', async () => {
  const { root, hostDir, stack, logPath } = await harness();
  const { lease } = JSON.parse((await stack('start')).stdout);
  const before = allCalls(logPath).length;

  const { status, stderr } = await stack('template', '--recreate');

  expect(status).toBe(1);
  expect(stderr).toContain(
    `TEMPLATE_BUSY: the template cannot be rebuilt while leases are live: slot 0 by lease ${lease.id} from ${root}.`
  );
  expect(commands(allCalls(logPath).slice(before))).toEqual([
    'emulator -list-avds'
  ]);
  expect(
    JSON.parse(readFileSync(join(hostDir, 'template.json'), 'utf8'))
  ).toEqual(TEMPLATE);
  await stack('stop');
});

test('a new lease starts from the template without clearing data, and start --fresh on a running lease clears it and reopens the app', async () => {
  const { stack, logPath } = await harness();

  const first = await stack('start', '--fresh');

  expect(first.status).toBe(0);
  expect(commands(first.calls)).not.toContain(
    `adb -s ${SERIAL} shell pm clear ${PACKAGE}`
  );
  const { lease, session, port } = JSON.parse(first.stdout);
  const before = allCalls(logPath).length;

  const again = await stack('start', '--fresh');

  expect(again.status).toBe(0);
  expect(JSON.parse(again.stdout).lease).toEqual(lease);
  const order = commands(allCalls(logPath).slice(before)).filter(
    call => !call.startsWith('lsof') && !call.includes(' snapshot ')
  );
  expect(order).toEqual([
    `adb -s ${SERIAL} emu avd name`,
    `adb -s ${SERIAL} shell getprop debug.liftlog.lease`,
    `adb -s ${SERIAL} shell pm clear ${PACKAGE}`,
    `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} ${target(session)}`
  ]);
  expectTargeted(allCalls(logPath), session);
  await stack('stop');
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
    `agent-device snapshot --raw --timeout 5000 ${target(session)}`
  ]);
  expectTargeted(allCalls(logPath), session);
});

test('start fails before opening the app when a foreign server answers Metro status on the port', async () => {
  const { stack, logPath } = await harness({ foreignMetro: true });

  const { status, stderr, calls } = await stack('start');

  expect(status).toBe(1);
  expect(stderr).toMatch(/not the Metro this lease started/);
  expect(calls.map(call => call.name)).not.toContain('agent-device');
  expectTargeted(allCalls(logPath));
  await stack('stop');
});

test('a server this lease did not start on a slot Metro port blocks that slot and is never signaled', async () => {
  const { root, ports, stack, runningMetro, registry, logPath } =
    await harness();
  const other = realpathSync(mkdtempSync(join(tmpdir(), 'liftlog-worktree-')));
  directories.push(other);
  const metro = await runningMetro({ cwd: other });

  const started = await stack('start');

  expect(started.status).toBe(0);
  const state = JSON.parse(started.stdout);
  expect(state).toMatchObject({
    port: ports[1],
    lease: { slot: 1, serial: 'emulator-5558', metroPort: ports[1] }
  });
  expect(commands(started.calls)).toContain(
    `pnpm exec expo start --dev-client --port ${ports[1]}`
  );
  await stack('stop');
  await waitUntil(() => !alive(state.metro.pid));
  const blocker = await runningMetro({ slug: 'other-app', on: ports[1] });
  const before = allCalls(logPath).length;

  const refused = await stack('start');

  expect(refused.status).toBe(1);
  expect(refused.stderr).toContain(
    `CAPACITY: no emulator slot is free: slot 0 ports 5556/5557/${ports[0]} are held by pid ${metro}; slot 1 ports 5558/5559/${ports[1]} are held by pid ${blocker}.`
  );
  expect(
    allCalls(logPath)
      .slice(before)
      .map(call => call.name)
  ).toEqual(['lsof', 'lsof', 'lsof', 'lsof', 'lsof', 'lsof']);
  expect(registry().leases).toEqual([]);
  expect(existsSync(join(root, '.device-stack', 'state.json'))).toBe(false);
  expect(alive(metro)).toBe(true);
  expect(alive(blocker)).toBe(true);
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
  // The second start records the build it waits for.
  const otherState = join(other, '.device-stack', 'state.json');
  await waitUntil(
    () =>
      existsSync(otherState) &&
      readFileSync(otherState, 'utf8').includes('"devBuild"')
  );
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
  expect(fakeState().emulators).toEqual({});
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

// Holds each process at a hook point until `count` processes reached it, so they continue
// from it together.
const barrier = (point: string, count: number, when = 'true') => `
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
export async function ${point}(context) {
  if (!(${when})) return
  const dir = join(process.env.HOOK_DIR, 'barrier-${point}')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, String(process.pid)), '')
  while (readdirSync(dir).length < ${count}) await new Promise(done => setTimeout(done, 20))
}
`;

// HOOK_ACTION picks what happens at a check point: hand the lease's slot to another lease, as
// a reclaiming process would (marking the call log), or SIGKILL the script. Every guarded
// action logs who holds the registry lock between its check and the action.
const testHooks = `
import { appendFileSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const action = process.env.HOOK_ACTION
function reassign(registry, lease) {
  const current = JSON.parse(readFileSync(registry, 'utf8'))
  Object.assign(current.leases.find(entry => entry.id === lease), { id: 'other-lease', root: '/elsewhere', operation: null })
  writeFileSync(registry + '.hook', JSON.stringify(current))
  renameSync(registry + '.hook', registry)
  appendFileSync(process.env.FAKE_LOG, JSON.stringify({ name: 'reassigned', args: [] }) + '\\n')
}
export function emulatorSpawned({ registry, lease }) {
  if (action === 'reassign at spawn') reassign(registry, lease)
  if (action === 'kill at spawn') process.kill(process.pid, 'SIGKILL')
}
export function beforeGuard({ action: guarded, registry, lease }) {
  if (action === 'reassign before ' + guarded) reassign(registry, lease)
}
export function ownershipChecked({ action: guarded, lock }) {
  const top = Math.max(...readdirSync(lock).filter(name => /^\\d+\\.json$/.test(name)).map(name => parseInt(name)))
  const holder = JSON.parse(readFileSync(join(lock, top + '.json'), 'utf8')).pid
  appendFileSync(join(process.env.HOOK_DIR, 'held.log'), JSON.stringify({ action: guarded, holder, pid: process.pid }) + '\\n')
}
`;

const DEVICE_CALLS = ['adb', 'agent-device', 'emulator'];
const deviceCallsAfterReassign = (calls: Call[]) => {
  const marker = calls.findIndex(call => call.name === 'reassigned');
  expect(marker).toBeGreaterThan(-1);

  return calls.slice(marker).filter(call => DEVICE_CALLS.includes(call.name));
};

// A registry lock generation whose holder no longer exists.
const deadHolder = {
  pid: 99_999_999,
  startTime: 'Mon Jan  1 00:00:00 2001',
  markers: ['device-stack.mjs'],
  root: '/gone'
};

test('with a limit of two, worktrees starting at the same moment lease different slots, and a repeated start or stop changes nothing', async () => {
  const { root, stack, stackIn, worktree, registry, logPath } = await harness(
    {},
    { limit: 2, hooks: barrier('beforeAcquire', 2) }
  );
  const other = worktree();

  // Two starts in one worktree and one in another, all at once.
  const runs = await Promise.all([
    stack('start'),
    stack('start'),
    stackIn(other, ['start'])
  ]);

  runs.forEach(run => expect(run.status).toBe(0));
  const [first, repeated, second] = runs.map(run => JSON.parse(run.stdout));
  expect(repeated.lease).toEqual(first.lease);
  expect(second.lease.id).not.toBe(first.lease.id);
  expect(new Set([first.lease.slot, second.lease.slot])).toEqual(
    new Set([0, 1])
  );
  expect(new Set([first.emulator.serial, second.emulator.serial])).toEqual(
    new Set(['emulator-5556', 'emulator-5558'])
  );
  expect(first.lease.consolePort).not.toBe(second.lease.consolePort);
  expect(
    registry()
      .leases.map(lease => [lease.id, lease.root])
      .sort()
  ).toEqual(
    [
      [first.lease.id, root],
      [second.lease.id, other]
    ].sort()
  );
  const calls = allCalls(logPath);
  // One boot per lease: the repeated start booted nothing.
  expect(
    commands(calls).filter(call => call.startsWith('emulator -avd'))
  ).toHaveLength(2);

  for (const { name, args } of calls) {
    expect(args.join(' ')).not.toMatch(new RegExp(`${PHONE}|${FOREIGN}`));

    if (name === 'adb') {
      expect([first.emulator.serial, second.emulator.serial]).toContain(
        args[1]
      );
    }
  }

  const stopped = await stack('stop');
  expect(stopped.status).toBe(0);
  expect(JSON.parse(stopped.stdout).stopped).toContain('emulator');
  const before = allCalls(logPath).length;
  const again = await stack('stop');
  expect(again.status).toBe(0);
  expect(JSON.parse(again.stdout)).toEqual({
    running: false,
    message: 'Nothing is running.'
  });
  expect(allCalls(logPath).slice(before)).toEqual([]);
  expect(registry().leases.map(lease => lease.id)).toEqual([second.lease.id]);
  await stackIn(other, ['stop']);
});

test('at the default limit a second worktree exits with CAPACITY naming the holder, and an environment limit above the host config has no effect', async () => {
  const { root, writeConfig, stack, stackIn, worktree, registry, logPath } =
    await harness();
  const holder = JSON.parse((await stack('start')).stdout);
  const other = worktree();

  for (const [config, env] of [
    [null, {}],
    [null, { DEVICE_STACK_LIMIT: '2' }],
    [2, { DEVICE_STACK_LIMIT: '1' }]
  ] as const) {
    if (config) {
      writeConfig({ limit: config });
    }

    const before = allCalls(logPath).length;
    const { status, stderr } = await stackIn(other, ['start'], undefined, env);

    expect(status).toBe(1);
    expect(stderr).toContain(
      `CAPACITY: the emulator limit is 1 and every slot is leased: slot 0 by lease ${holder.lease.id} from ${root}.`
    );
    expect(allCalls(logPath).slice(before)).toEqual([]);
    expect(existsSync(join(other, '.device-stack', 'state.json'))).toBe(false);
  }

  expect(registry().leases.map(lease => lease.id)).toEqual([holder.lease.id]);
  await stack('stop');
});

test('a start whose lease was replaced in the registry mid-start exits with LEASE_LOST without signaling or calling a device', async () => {
  const { root, stackIn, fakeState, registry } = await harness(
    {},
    { hooks: testHooks }
  );

  const { status, stderr, calls } = await stackIn(root, ['start'], undefined, {
    HOOK_ACTION: 'reassign at spawn'
  });

  expect(status).toBe(1);
  expect(stderr).toMatch(
    /LEASE_LOST: lease \S+ no longer holds its slot, so nothing was signaled or called/
  );
  expect(deviceCallsAfterReassign(calls)).toEqual([]);
  expect(commands(calls)).not.toContain(`adb -s ${SERIAL} emu kill`);
  await waitUntil(() => Boolean(fakeState().emulators['5556']));
  expect(alive(fakeState().emulators['5556'].pid)).toBe(true);
  expect(registry().leases.map(lease => lease.id)).toEqual(['other-lease']);
});

test.each([
  ['signal', 'stop', 'signal jsLogs'],
  ['kill', 'stop', 'kill emulator'],
  ['install', 'start', 'install'],
  ['data clear', 'start --fresh', 'clear data']
])(
  'a %s does not run when the slot is reassigned after its ownership check',
  async (_, command, action) => {
    const { root, stack, stackIn, fakeState, editFake } = await harness(
      {},
      { hooks: testHooks }
    );
    editFake(state => (state.installed = null));
    // Data clear runs only on a running lease.
    const started =
      command === 'stop' || action === 'clear data'
        ? JSON.parse((await stack('start')).stdout)
        : null;

    const { status, stderr, calls } = await stackIn(
      root,
      command.split(' '),
      undefined,
      { HOOK_ACTION: `reassign before ${action}` }
    );

    expect(status).toBe(1);
    expect(stderr).toContain('LEASE_LOST: lease');
    expect(deviceCallsAfterReassign(calls)).toEqual([]);
    expect(alive(fakeState().emulators['5556'].pid)).toBe(true);

    if (action === 'install') {
      expect(fakeState().installed).toBeNull();
    }

    if (action === 'signal jsLogs') {
      await new Promise(done => setTimeout(done, 200));
      expect(alive(started.jsLogs.pid)).toBe(true);
    }
  }
);

test('every guarded signal and kill runs while its own process holds the registry lock it took for the ownership check', async () => {
  const { dir, root, stack, stackIn } = await harness({}, { hooks: testHooks });
  await stack('start');
  let stopper: number | undefined;

  const { status } = await stackIn(
    root,
    ['stop'],
    child => (stopper = child.pid)
  );

  expect(status).toBe(0);
  const held = readFileSync(join(dir, 'held.log'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
  expect(held).toEqual(
    ['signal jsLogs', 'signal metro', 'kill emulator'].map(action => ({
      action,
      holder: stopper,
      pid: stopper
    }))
  );
});

test.each(['start', 'stop'])(
  'after a start killed with SIGKILL mid-boot, the next %s completes or rolls back the lease',
  async command => {
    const { root, stack, stackIn, fakeState, registry, recorded, logPath } =
      await harness({}, { hooks: testHooks });

    const killed = await stackIn(root, ['start'], undefined, {
      HOOK_ACTION: 'kill at spawn'
    });

    expect(killed.signal).toBe('SIGKILL');
    const { lease } = recorded();
    expect(registry().leases).toMatchObject([
      { id: lease.id, operation: { kind: 'acquire' } }
    ]);
    await waitUntil(() => Boolean(fakeState().emulators['5556']));
    const orphan = fakeState().emulators['5556'].pid;
    const before = allCalls(logPath).length;

    const next = await stack(command);

    expect(next.status).toBe(0);
    const calls = commands(allCalls(logPath).slice(before));
    // The orphan never set its lease token, so its verified process is signalled.
    expect(calls).not.toContain(`adb -s ${SERIAL} emu kill`);
    await waitUntil(() => !alive(orphan));

    if (command === 'start') {
      expect(JSON.parse(next.stdout)).toMatchObject({
        running: true,
        lease: { id: lease.id }
      });
      expect(registry().leases).toMatchObject([
        { id: lease.id, operation: null }
      ]);
      expect(
        calls.filter(call => call.startsWith('emulator -avd'))
      ).toHaveLength(1);
      await stack('stop');
    } else {
      expect(JSON.parse(next.stdout)).toEqual({
        running: false,
        stopped: ['metro', 'emulator']
      });
      expect(registry().leases).toEqual([]);
      expect(recorded()).toBeNull();
    }
  }
);

test('a registry lock whose holder is dead is broken by exactly one of two waiters', async () => {
  const { hostDir, stack, stackIn, worktree, registry } = await harness(
    {},
    {
      limit: 2,
      hooks: barrier(
        'lockChecked',
        2,
        "context.stale && context.lock.endsWith('registry.lock')"
      )
    }
  );
  const lock = join(hostDir, 'registry.lock');
  mkdirSync(lock);
  writeFileSync(join(lock, '1.json'), JSON.stringify(deadHolder));
  const other = worktree();

  // Both waiters pass the staleness check before either breaks the lock.
  const [first, second] = await Promise.all([
    stack('start'),
    stackIn(other, ['start'])
  ]);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(
    `${first.stderr}${second.stderr}`.match(
      new RegExp(`broke the stale registry lock of pid ${deadHolder.pid}`, 'g')
    )
  ).toHaveLength(1);
  expect(registry().leases).toHaveLength(2);
  await stack('stop');
  await stackIn(other, ['stop']);
});

test('a registry lock another process replaced after the staleness check is left intact', async () => {
  const { dir, root, hostDir, stack, stackIn, registry } = await harness(
    {},
    {
      hooks: `
import { linkSync } from 'node:fs'
import { join } from 'node:path'
export function lockChecked({ lock, generation, stale }) {
  if (stale && lock.endsWith('registry.lock')) linkSync(join(process.env.HOOK_DIR, 'replacement.json'), join(lock, (generation + 1) + '.json'))
}
`
    }
  );
  // A live device stack process that broke the stale lock first and now holds it.
  const replacer = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1000)', 'device-stack.mjs'],
    { stdio: 'ignore' }
  );
  pids.push(replacer.pid!);
  const replacement = {
    pid: replacer.pid,
    startTime: execFileSync(
      'ps',
      ['-o', 'lstart=', '-p', String(replacer.pid)],
      {
        encoding: 'utf8'
      }
    ).trim(),
    markers: ['device-stack.mjs'],
    root: '/other'
  };
  writeFileSync(join(dir, 'replacement.json'), JSON.stringify(replacement));
  const lock = join(hostDir, 'registry.lock');
  mkdirSync(lock);
  writeFileSync(join(lock, '1.json'), JSON.stringify(deadHolder));
  let stderr = '';

  const started = stackIn(root, ['start'], child =>
    child.stderr!.on('data', chunk => (stderr += chunk))
  );
  await waitUntil(() =>
    stderr.includes(`waiting for the registry lock held by pid ${replacer.pid}`)
  );

  expect(JSON.parse(readFileSync(join(lock, '2.json'), 'utf8'))).toEqual(
    replacement
  );
  expect(stderr).not.toContain('broke the stale registry lock');
  // The replacing process releases the lock.
  writeFileSync(join(lock, '3.json'), JSON.stringify({ free: true }));
  const { status } = await started;
  expect(status).toBe(0);
  expect(registry().leases).toHaveLength(1);
  await stack('stop');
});

test('two leases each serve their own worktree on their own slot Metro port', async () => {
  const { root, ports, stack, stackIn, worktree, fakeState, logPath } =
    await harness({}, { limit: 2 });
  const other = worktree();

  const first = await stack('start');
  const second = await stackIn(other, ['start']);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  const leases = [
    { root, ...JSON.parse(first.stdout) },
    { root: other, ...JSON.parse(second.stdout) }
  ];
  const calls = allCalls(logPath);

  leases.forEach(({ root: cwd, port, emulator, session }, slot) => {
    expect(port).toBe(ports[slot]);
    expect(
      calls
        .filter(call => call.name === 'pnpm' && call.args.includes('start'))
        .find(call => call.cwd === cwd)?.args
    ).toEqual([
      'exec',
      'expo',
      'start',
      '--dev-client',
      '--port',
      String(port)
    ]);
    expect(
      commands(calls).filter(
        call =>
          call.startsWith('agent-device open') && call.includes(emulator.serial)
      )
    ).toEqual([
      `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} --serial ${emulator.serial} --session ${session}`
    ]);
    expect(
      fakeState().listeners.find(listener => listener.port === port)?.cwd
    ).toBe(cwd);
  });
  await stack('stop');
  await stackIn(other, ['stop']);
});

test('Metro starts before the emulator finishes booting', async () => {
  const { stack } = await harness();

  const { status, calls } = await stack('start');

  expect(status).toBe(0);
  const order = commands(calls);
  expect(
    order.findIndex(call => call.startsWith('pnpm exec expo start'))
  ).toBeLessThan(
    order.indexOf(`adb -s ${SERIAL} shell getprop sys.boot_completed`)
  );
  await stack('stop');
});

test.each([
  [
    'a bundling error',
    { bundlingError: true },
    'Metro failed to bundle the app'
  ],
  ['a redbox', { redbox: true }, 'The app shows a redbox (Render Error)']
])(
  '%s fails start within seconds and prints the last Metro log lines',
  async (_, seed, reason) => {
    const { root, stack } = await harness(seed);
    const startedAt = Date.now();

    const { status, stderr } = await stack('start');

    expect(status).toBe(1);
    expect(Date.now() - startedAt).toBeLessThan(15_000);
    expect(stderr).toContain(
      `${reason}; last lines of ${join(root, '.device-stack', 'metro.log')}:\nfake metro listening`
    );

    if ('bundlingError' in seed) {
      expect(stderr).toContain(
        'Android Bundling failed 12ms index.js (1 module)\nSyntaxError: src/app/index.tsx: Unexpected token (3:7)'
      );
    }

    await stack('stop');
  }
);

test.each([
  ['install', 'start'],
  ['data clear', 'start --fresh'],
  ['kill', 'stop']
])(
  'a %s does not run when the device lease token does not match the lease',
  async (action, command) => {
    const { root, stack, stackIn, editFake, fakeState, logPath } =
      await harness();

    if (action === 'install') {
      editFake(state => {
        state.installed = null;
        state.tokenOverride = 'other-lease';
      });
    } else {
      await stack('start');
      editFake(state => (state.tokenOverride = 'other-lease'));
    }

    const before = allCalls(logPath).length;

    const run = await stackIn(root, command.split(' '));

    const order = commands(allCalls(logPath).slice(before));
    expect(order.some(call => call.includes(' install '))).toBe(false);
    expect(order).not.toContain(`adb -s ${SERIAL} shell pm clear ${PACKAGE}`);
    expect(order).not.toContain(`adb -s ${SERIAL} emu kill`);
    await new Promise(done => setTimeout(done, 200));
    expect(alive(fakeState().emulators['5556'].pid)).toBe(true);

    if (action === 'kill') {
      expect(JSON.parse(run.stdout)).toMatchObject({ untrusted: ['emulator'] });
    } else {
      expect(run.status).toBe(1);
      expect(run.stderr).toContain(
        `${SERIAL} no longer passes its identity check, so ${action === 'data clear' ? 'clear data' : action} did not run.`
      );
      editFake(state => delete state.tokenOverride);
      await stack('stop');
    }
  }
);
