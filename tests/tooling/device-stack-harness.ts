import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, delimiter, join, resolve } from 'node:path';

const script = resolve('scripts/device-stack.mjs');

export const PACKAGE = 'com.borakaraca94.liftlog';

export const AVD = 'liftlog_harness_34';

export const AUDIT_AVD = 'liftlog_audit_34';

// Online before every start: a physical phone and the maintainer's emulator on 5554/5555.
export const PHONE = 'R5CT3000ABC';

export const FOREIGN = 'emulator-5554';

export const SERIAL = 'emulator-5556';

export const TEMPLATE = {
  snapshot: 'liftlog_template',
  version: '2026-11-25T00:00:00.000Z'
};

// The hardware lines `avdmanager --device pixel_7` writes to the AVD's config.ini.
export const PIXEL_7_CONFIG =
  'hw.lcd.density=420\nhw.lcd.height=2400\nhw.lcd.width=1080\nhw.ramSize=2G\n';

// The AVD folder under the test HOME (the harness unsets ANDROID_AVD_HOME).
export const avdConfigPath = (home: string, avd = AVD) =>
  join(home, '.android', 'avd', `${avd}.avd`, 'config.ini');

export const instanceBoot = (lease: string, port = 5556) =>
  `emulator -avd ${AVD} -port ${port} -read-only -snapshot liftlog_template -no-snapshot-save -no-boot-anim -gpu host -prop debug.liftlog.lease=${lease}`;

// One fake implementation behind every binary the script calls (`adb`, `emulator`, `lsof`,
// `agent-device`, `pnpm`, `avdmanager`, `sbx`, and the `gradlew` the fake prebuild links). Each call
// is logged with its time, agent-device with the AGENT_DEVICE_* variables it received; device and listener state lives in a JSON file the test seeds. Long-running fakes
// (emulator, logcat, Metro) stay alive like the real ones so `stop` has something to end.
// Gradle logs the android/ entries it builds from, waits while \`gradleHold\` names a missing
// file, and writes an APK whose content is the fingerprint at the end of the build.
const fakeImpl = `
const { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, symlinkSync, writeFileSync } = require('node:fs')
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
// The AVD's config.ini under HOME; an emulator boot logs the config it boots with.
const avdConfig = avd => join(require('node:os').homedir(), '.android', 'avd', avd + '.avd', 'config.ini')
const bootAvd = args.includes('-avd') ? args[args.indexOf('-avd') + 1] : null
appendFileSync(process.env.FAKE_LOG, JSON.stringify({
  name, args, at: Date.now(), ci: process.env.CI ?? null, cwd: process.cwd(),
  ...(name === 'gradlew' && { files: readdirSync('.') }),
  ...(name === 'emulator' && bootAvd && existsSync(avdConfig(bootAvd)) && { avdConfig: readFileSync(avdConfig(bootAvd), 'utf8') }),
  ...(name === 'agent-device' && { env: Object.keys(process.env).filter(key => key.startsWith('AGENT_DEVICE_')) })
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
  const avd = args[args.indexOf('--name') + 1]
  mkdirSync(join(avdConfig(avd), '..'), { recursive: true })
  writeFileSync(avdConfig(avd), ${JSON.stringify(PIXEL_7_CONFIG)})
  update(s => { s.avds.push(avd) })
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
  } else if (command === 'shell getprop sys.boot_completed') {
    if (state.bootChecks > 0) update(s => { s.bootChecks -= 1 })
    process.stdout.write(state.bootChecks > 0 ? '0\\n' : '1\\n')
  }
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
  } else if (rest[0] === 'pull') {
    writeFileSync(rest.at(-1), 'png')
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
} else if (name === 'agent-device' && args[0] === 'snapshot' && args.includes('--json')) {
  process.stdout.write(JSON.stringify({ success: true, data: { nodes: state.snapshotNodes ?? [] } }))
} else if (name === 'agent-device' && args[0] === 'snapshot') {
  process.stdout.write(state.redbox
    ? 'Render Error\\nThis error is located at:'
    : state.onboarding
      ? 'This is the developer menu.\\nContinue'
      : 'workout-start-screen')
} else if (name === 'magick') {
  // The width of the control in the screenshot it measures.
  process.stdout.write(String(state.widths[args[0].endsWith('-pressed.png') ? 'pressed' : 'rest']))
} else if (name === 'pnpm' && args.includes('prebuild')) {
  const android = join(process.cwd(), 'android')
  mkdirSync(android, { recursive: true })
  symlinkSync(process.env.FAKE_GRADLEW, join(android, 'gradlew'))
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
  // Boot completed checks that report a device still booting.
  bootChecks?: number;
  foreignMetro?: boolean;
  // The nodes `snapshot -i --json` lists, and the widths the fake magick measures.
  snapshotNodes?: {
    label?: string;
    hittable?: boolean | null;
    rect: { x: number; y: number; width: number; height: number };
  }[];
  widths?: { rest: number; pressed: number };
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
  // Epoch milliseconds when the fake ran.
  at: number;
  ci: string | null;
  cwd: string;
  files?: string[];
  // AGENT_DEVICE_* variables an agent-device call received.
  env?: string[];
  // The AVD config.ini an emulator boot started with.
  avdConfig?: string;
};

export const pids: number[] = [];

export const directories: string[] = [];

export function freePort() {
  return new Promise<number>(done => {
    const server = createServer().listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => done(port));
    });
  });
}

export const alive = (pid: number) => {
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

export const git = (cwd: string, ...args: string[]) =>
  execFileSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args],
    { cwd, stdio: 'ignore' }
  );

// macOS scans each new executable on its first run, for about 300 ms, so the fake binaries
// are written once per test file and every harness runs them from there. They read their
// state, log and paths from the environment.
let fakes: string | undefined;

function sharedFakes() {
  if (fakes) {
    return fakes;
  }

  fakes = realpathSync(mkdtempSync(join(tmpdir(), 'device-stack-fakes-')));
  const bin = join(fakes, 'bin');
  const fake = join(fakes, 'fake.js');

  mkdirSync(bin);
  mkdirSync(join(fakes, 'gradle'));
  mkdirSync(join(fakes, 'magick'));
  writeFileSync(fake, fakeImpl);
  writeFileSync(
    join(bin, 'java'),
    '#!/bin/sh\necho \'openjdk version "17.0.12"\' >&2\n'
  );
  chmodSync(join(bin, 'java'), 0o755);

  // Node itself runs each fake, so a process's argv never changes after it starts.
  for (const path of [
    ...[
      'adb',
      'emulator',
      'lsof',
      'agent-device',
      'pnpm',
      'avdmanager',
      'sbx'
    ].map(name => join(bin, name)),
    join(fakes, 'gradle', 'gradlew'),
    join(fakes, 'magick', 'magick')
  ]) {
    writeFileSync(
      path,
      `#!${process.execPath}\nrequire(${JSON.stringify(fake)})\n`
    );
    chmodSync(path, 0o755);
  }

  return fakes;
}

// The dev build the first seeded harness of a test file built, by fake fingerprint.
const seededBuilds = new Map<string, { name: string; content: string }>();

// `seedBuild` fills the dev build cache and installs that APK, so a test starts from a cache
// hit with the matching build installed and an empty call log. The first harness of a test
// file runs `build`; the next ones copy its cached APK, the same for the same fingerprint.
// `hooks` is the source of a module the script loads to act at its check points, and
// `limit` the host config's emulator limit.
export async function harness(
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
  const fakes = sharedFakes();
  const root = join(dir, 'checkout');
  const home = join(dir, 'home');
  // The Metro port of slot 0 and slot 1.
  const ports = [await freePort(), await freePort()];
  const [port] = ports;

  mkdirSync(root);
  mkdirSync(home);
  copyFileSync(resolve('app.json'), join(root, 'app.json'));
  writeFileSync(join(root, '.gitignore'), 'node_modules\n.device-stack\n');
  git(root, 'init', '-q');
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'checkout');
  fakeExpo(root);
  writeFileSync(join(dir, 'metro.js'), fakeMetro);
  const hostDir = join(home, '.liftlog-device-stack');

  const writeConfig = (
    config: { limit?: number; sandbox?: string; brokerPorts?: number[] } = {}
  ) =>
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
    PATH: [join(fakes, 'bin'), join(fakes, 'magick'), process.env.PATH].join(
      delimiter
    ),
    FAKE_STATE: statePath,
    FAKE_LOG: logPath,
    FAKE_METRO: join(dir, 'metro.js'),
    FAKE_GRADLEW: join(fakes, 'gradle', 'gradlew'),
    HOOK_DIR: dir,
    // Retried checks poll fast; the poll interval test overrides it.
    DEVICE_STACK_POLL_MS: '10',
    ...(hooks && { DEVICE_STACK_HOOKS: join(dir, 'hooks.mjs') })
  };
  const fakeState = (): FakeState =>
    JSON.parse(readFileSync(statePath, 'utf8'));

  // Edits the fake state under the fakes' directory lock and replaces it whole, so a
  // fake still running from an earlier command cannot overwrite the edit.
  function editFake(edit: (state: FakeState) => void) {
    for (;;) {
      try {
        mkdirSync(`${statePath}.lock`);
        break;
      } catch {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      }
    }

    try {
      const state = fakeState();
      edit(state);
      writeFileSync(`${statePath}.harness`, JSON.stringify(state));
      renameSync(`${statePath}.harness`, statePath);
    } finally {
      rmdirSync(`${statePath}.lock`);
    }
  }

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
    editFake(state => state.listeners.push({ pid: child.pid!, cwd, port: on }));

    return child.pid!;
  }

  delete env.JAVA_HOME;
  delete env.ANDROID_AVD_HOME;

  // Runs the script in a checkout; `onSpawn` receives the child, so a test can signal it.
  function stackIn(
    cwd: string,
    args: string[],
    onSpawn?: (child: ReturnType<typeof spawn>) => void,
    // An undefined value leaves the variable out.
    extraEnv: Record<string, string | undefined> = {}
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
    const { fingerprint } = fakeState();
    let seeded = seededBuilds.get(fingerprint);

    if (seeded) {
      const cache = join(root, '.git', 'device-stack', 'dev-builds');
      mkdirSync(cache, { recursive: true });
      writeFileSync(join(cache, seeded.name), seeded.content);
    } else {
      const built = await stack('build');
      expect(built.status).toBe(0);
      const { apk } = JSON.parse(built.stdout);
      seeded = { name: basename(apk), content: readFileSync(apk, 'utf8') };
      seededBuilds.set(fingerprint, seeded);
      writeFileSync(logPath, '');
      rmSync(join(root, '.device-stack'), { recursive: true });
    }

    editFake(state => {
      state.installed = seeded!.content;
    });
  }

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
    home,
    registry,
    editFake,
    runningMetro,
    fakeState,
    recorded,
    editRecorded,
    logPath,
    env,
    fakes
  };
}

export const commands = (calls: Call[]) =>
  calls.map(({ name, args }) => [name, ...args].join(' '));

export const allCalls = (logPath: string) =>
  readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as Call);

export const target = (session: string) =>
  `--serial ${SERIAL} --session ${session}`;

// Every device call names the harness serial: adb with `-s`, agent-device with `--serial`
// and this run's `--session`. No call names the phone or the maintainer's emulator.
export function expectTargeted(calls: Call[], session?: string) {
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

export const link = (port: number) =>
  `liftlog://expo-development-client/?url=${encodeURIComponent(`http://10.0.2.2:${port}`)}`;

// Test files run in parallel, so a recorded PID that has exited may already belong to another
// file's process. Only a process still running this file's fakes, a harness file or the
// script is killed, with its process group.
function ours(pid: number) {
  let command: string;

  try {
    command = execFileSync('ps', ['-o', 'command=', '-p', String(pid)], {
      encoding: 'utf8'
    });
  } catch {
    return false;
  }

  return [fakes, script, ...directories].some(
    path => path && command.includes(path)
  );
}

type Ended = { pid: number; command: string };

// Ends every process still running this file's fakes or harness files: the recorded PIDs with
// their process groups, then any other one, such as a detached child the harness never
// recorded. Returns those others, each by PID and command line.
export function endFakeProcesses(): Ended[] {
  const recorded = new Set([...new Set(pids.splice(0))].filter(ours));
  const paths = [fakes, ...directories].filter(Boolean) as string[];
  const leaked = execFileSync('ps', ['-axo', 'pid=,pgid=,command='], {
    encoding: 'utf8'
  })
    .split('\n')
    .map(line => line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/))
    .filter(match => match !== null)
    .map(([, pid, pgid, command]) => ({
      pid: Number(pid),
      pgid: Number(pgid),
      command
    }))
    .filter(
      ({ pid, pgid, command }) =>
        pid !== process.pid &&
        !recorded.has(pid) &&
        !recorded.has(pgid) &&
        paths.some(path => command.includes(path))
    );

  for (const pid of [...recorded, ...leaked.map(({ pid }) => pid)]) {
    for (const target of [-pid, pid]) {
      try {
        process.kill(target, 'SIGKILL');
      } catch {}
    }
  }

  return leaked.map(({ pid, command }) => ({ pid, command }));
}

const reportLeaks = (ended: Ended[]) => {
  if (ended.length) {
    console.warn(
      `Ended processes the test did not record:\n${ended.map(({ pid, command }) => `${pid} ${command}`).join('\n')}`
    );
  }
};

afterEach(() => {
  reportLeaks(endFakeProcesses());
  directories.splice(0).forEach(dir => rmSync(dir, { recursive: true }));
});

afterAll(() => {
  reportLeaks(endFakeProcesses());

  if (fakes) {
    rmSync(fakes, { recursive: true });
    fakes = undefined;
  }

  seededBuilds.clear();
});

jest.setTimeout(30_000);

export async function waitUntil(check: () => boolean) {
  const deadline = Date.now() + 20_000;

  while (!check()) {
    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for the condition.');
    }

    await new Promise(done => setTimeout(done, 100));
  }
}

// Holds each process at a hook point until `count` processes reached it, so they continue
// from it together.
export const barrier = (point: string, count: number, when = 'true') => `
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
export const testHooks = `
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
// The emulator fake logs its call before it records itself, so once it is recorded its call
// precedes the reassign marker.
async function emulatorRecorded() {
  while (!Object.keys(JSON.parse(readFileSync(process.env.FAKE_STATE, 'utf8')).emulators).length) {
    await new Promise(done => setTimeout(done, 10))
  }
}
export async function emulatorSpawned({ registry, lease }) {
  if (action === 'reassign at spawn') {
    await emulatorRecorded()
    reassign(registry, lease)
  }
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

export const deviceCallsAfterReassign = (calls: Call[]) => {
  const marker = calls.findIndex(call => call.name === 'reassigned');
  expect(marker).toBeGreaterThan(-1);

  return calls.slice(marker).filter(call => DEVICE_CALLS.includes(call.name));
};

// A registry lock generation whose holder no longer exists.
export const deadHolder = {
  pid: 99_999_999,
  startTime: 'Mon Jan  1 00:00:00 2001',
  markers: ['device-stack.mjs'],
  root: '/gone'
};
