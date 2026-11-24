import { spawn } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
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
const AVD = 'liftlog_audit_34';

// One fake implementation behind every binary the script calls (`adb`, `emulator`, `lsof`,
// `agent-device`, `pnpm`). Each call is logged; device and listener state lives in a JSON
// file the test seeds. Long-running fakes (emulator, logcat, Metro) stay alive like the real
// ones so `stop` has something to end.
const fakeImpl = `
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs')
const [name, ...args] = process.argv.slice(2)
const statePath = process.env.FAKE_STATE
const read = () => JSON.parse(readFileSync(statePath, 'utf8'))
const write = s => writeFileSync(statePath, JSON.stringify(s))
appendFileSync(process.env.FAKE_LOG, JSON.stringify({ name, args, ci: process.env.CI ?? null }) + '\\n')
const stayAlive = () => setInterval(() => {}, 1000)
const state = read()
if (name === 'emulator') {
  if (args[0] === '-list-avds') process.stdout.write(state.avds.join('\\n') + '\\n')
  else { write({ ...state, booted: true, emulatorPid: process.pid }); stayAlive() }
} else if (name === 'adb') {
  const rest = args[0] === '-s' ? args.slice(2) : args
  const command = rest.join(' ')
  if (command === 'devices') {
    process.stdout.write('List of devices attached\\n' + (state.booted ? 'emulator-5554\\tdevice\\n' : '') + '\\n')
  } else if (command === 'shell getprop sys.boot_completed') process.stdout.write('1\\n')
  else if (command.startsWith('shell dumpsys package')) {
    if (!state.build) process.stdout.write('Unable to find package: ${PACKAGE}\\n')
    else process.stdout.write('    pkgFlags=[ ' + (state.build === 'dev' ? 'DEBUGGABLE ' : '') + 'HAS_CODE ALLOW_CLEAR_USER_DATA ]\\n')
  } else if (rest[0] === 'logcat') {
    process.stdout.write('I ReactNativeJS: fake log line\\n'); stayAlive()
  } else if (command === 'emu kill') {
    try { process.kill(state.emulatorPid) } catch {}
    write({ ...state, booted: false })
  }
} else if (name === 'lsof') {
  if (args.includes('-sTCP:LISTEN')) {
    process.stdout.write(state.listeners.map(l => l.pid).join('\\n'))
  } else {
    const pid = Number(args[args.indexOf('-p') + 1])
    const listener = state.listeners.find(l => l.pid === pid)
    if (listener) process.stdout.write('p' + pid + '\\nfcwd\\nn' + listener.cwd + '\\n')
  }
} else if (name === 'pnpm') {
  require(process.env.FAKE_METRO)
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

type Listener = { pid: number; cwd: string };
type FakeState = {
  avds: string[];
  booted: boolean;
  build: 'dev' | 'release' | null;
  emulatorPid?: number;
  listeners: Listener[];
};
type Call = { name: string; args: string[]; ci: string | null };

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

async function harness(seed: Partial<FakeState> = {}) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'device-stack-')));
  directories.push(dir);
  const bin = join(dir, 'bin');
  const root = join(dir, 'checkout');
  const port = await freePort();

  mkdirSync(bin);
  mkdirSync(root);
  copyFileSync(resolve('app.json'), join(root, 'app.json'));
  writeFileSync(join(dir, 'fake.js'), fakeImpl);
  writeFileSync(join(dir, 'metro.js'), fakeMetro);

  for (const name of ['adb', 'emulator', 'lsof', 'agent-device', 'pnpm']) {
    writeFileSync(
      join(bin, name),
      `#!/bin/sh\nexec "${process.execPath}" "${join(dir, 'fake.js')}" ${name} "$@"\n`
    );
    chmodSync(join(bin, name), 0o755);
  }

  const statePath = join(dir, 'fake-state.json');
  const logPath = join(dir, 'calls.log');
  writeFileSync(logPath, '');
  writeFileSync(
    statePath,
    JSON.stringify({
      avds: [AVD],
      booted: false,
      build: 'dev',
      listeners: [],
      ...seed
    })
  );
  const env = {
    ...process.env,
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
    state.listeners.push({ pid: child.pid!, cwd });
    writeFileSync(statePath, JSON.stringify(state));

    return child.pid!;
  }

  function stack(...args: string[]) {
    return new Promise<{
      status: number | null;
      stdout: string;
      stderr: string;
      calls: Call[];
    }>(done => {
      const child = spawn(process.execPath, [script, ...args], {
        cwd: root,
        env
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => (stdout += chunk));
      child.stderr.on('data', chunk => (stderr += chunk));
      child.on('close', status => {
        const state = recorded();

        for (const pid of [
          state?.metro?.pid,
          state?.jsLogs?.pid,
          fakeState().emulatorPid
        ]) {
          if (pid) {
            pids.push(pid);
          }
        }

        const calls = readFileSync(logPath, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map(line => JSON.parse(line) as Call);
        done({ status, stdout, stderr, calls });
      });
    });
  }

  return { root, port, stack, runningMetro, fakeState, recorded };
}

const commands = (calls: Call[]) =>
  calls.map(({ name, args }) => [name, ...args].join(' '));
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

test('start boots the emulator, reverses the port, starts Metro and log capture, opens the app and prints its state', async () => {
  const { root, port, stack } = await harness();

  const { status, stdout, calls } = await stack('start');

  expect(status).toBe(0);
  const serial = 'emulator-5554';
  expect(commands(calls)).toEqual(
    expect.arrayContaining([
      'emulator -list-avds',
      `emulator -avd ${AVD} -no-snapshot-save`,
      `adb -s ${serial} reverse tcp:${port} tcp:${port}`,
      `adb -s ${serial} shell dumpsys package ${PACKAGE}`,
      `pnpm exec expo start --dev-client --port ${port}`,
      `adb -s ${serial} logcat -T 1 -s ReactNativeJS:V`,
      `agent-device open ${PACKAGE} ${link(port)} --relaunch`,
      'agent-device wait id=workout-start-screen 180000'
    ])
  );
  const order = commands(calls);
  expect(
    order.indexOf(`agent-device open ${PACKAGE} ${link(port)} --relaunch`)
  ).toBeGreaterThan(
    order.indexOf(`adb -s ${serial} logcat -T 1 -s ReactNativeJS:V`)
  );
  // Metro starts without CI, so reloads stay on.
  expect(calls.find(call => call.name === 'pnpm')?.ci).toBeNull();
  expect(order).not.toContain(`adb -s ${serial} shell pm clear ${PACKAGE}`);

  const state = JSON.parse(stdout);
  const dir = join(root, '.device-stack');
  expect(state).toMatchObject({
    running: true,
    startScreen: true,
    root,
    port,
    package: PACKAGE,
    emulator: { serial, avd: AVD, started: true },
    reverse: `tcp:${port}`,
    metro: { started: true, log: join(dir, 'metro.log') },
    jsLogs: { started: true, log: join(dir, 'js.log') }
  });
  expect(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'))).toEqual(
    state
  );
  expect(readFileSync(state.metro.log, 'utf8')).toContain(
    'fake metro listening'
  );
  expect(readFileSync(state.jsLogs.log, 'utf8')).toContain('ReactNativeJS');
});

test('start --fresh clears app data before opening the app', async () => {
  const { port, stack } = await harness();

  const { status, calls } = await stack('start', '--fresh');

  expect(status).toBe(0);
  const order = commands(calls);
  const clear = order.indexOf(`adb -s emulator-5554 shell pm clear ${PACKAGE}`);
  expect(clear).toBeGreaterThan(-1);
  expect(clear).toBeLessThan(
    order.indexOf(`agent-device open ${PACKAGE} ${link(port)} --relaunch`)
  );
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

test.each([
  [null, 'The dev build is not installed'],
  ['release', 'The installed build is not a dev build']
] as const)(
  'start refuses build %s and names pnpm run android',
  async (build, reason) => {
    const { stack } = await harness({ build });

    const { status, stderr, calls } = await stack('start');

    expect(status).toBe(1);
    expect(stderr).toContain(
      `${reason} (${PACKAGE} on emulator-5554). Build and install it with \`pnpm run android\``
    );
    expect(calls.map(call => call.name)).not.toContain('pnpm');
    expect(calls.map(call => call.name)).not.toContain('agent-device');
  }
);

test('stop leaves an already-running Metro and emulator alone', async () => {
  const { root, stack, runningMetro, fakeState } = await harness({
    booted: true
  });
  const metro = await runningMetro();

  const started = await stack('start');
  expect(started.status).toBe(0);
  expect(JSON.parse(started.stdout)).toMatchObject({
    emulator: { serial: 'emulator-5554', started: false },
    metro: {
      pids: [metro],
      started: false,
      log: null,
      output: 'in the terminal that started this Metro'
    }
  });
  const logPid = JSON.parse(started.stdout).jsLogs.pid;

  const { status, stdout, calls } = await stack('stop');

  expect(status).toBe(0);
  expect(JSON.parse(stdout)).toEqual({
    running: false,
    stopped: ['session', 'jsLogs']
  });
  expect(alive(metro)).toBe(true);
  expect(fakeState().booted).toBe(true);
  expect(commands(calls)).not.toContain('adb -s emulator-5554 emu kill');
  expect(commands(calls)).not.toContain(
    expect.stringMatching(/^emulator -avd/)
  );
  await new Promise(done => setTimeout(done, 200));
  expect(alive(logPid)).toBe(false);
  expect(existsSync(join(root, '.device-stack', 'state.json'))).toBe(false);
});

test('stop ends the emulator, Metro and log capture that start started', async () => {
  const { stack, fakeState } = await harness();
  const started = JSON.parse((await stack('start')).stdout);

  const { status, stdout, calls } = await stack('stop');

  expect(status).toBe(0);
  expect(JSON.parse(stdout)).toEqual({
    running: false,
    stopped: ['session', 'jsLogs', 'metro', 'emulator']
  });
  expect(commands(calls)).toEqual(
    expect.arrayContaining([
      'agent-device close',
      'adb -s emulator-5554 emu kill'
    ])
  );
  expect(fakeState().booted).toBe(false);
  await new Promise(done => setTimeout(done, 200));
  expect(alive(started.metro.pid)).toBe(false);
  expect(alive(started.jsLogs.pid)).toBe(false);
});

test('status prints the recorded state, or reports that nothing is running', async () => {
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
  expect(JSON.parse(running.stdout)).toEqual(started);
});
