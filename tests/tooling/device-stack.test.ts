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
const AVD = 'liftlog_harness_34';
const AUDIT_AVD = 'liftlog_audit_34';
// Online before every start: a physical phone and the maintainer's emulator on 5554/5555.
const PHONE = 'R5CT3000ABC';
const FOREIGN = 'emulator-5554';
const SERIAL = 'emulator-5556';

// One fake implementation behind every binary the script calls (`adb`, `emulator`, `lsof`,
// `agent-device`, `pnpm`, `avdmanager`). Each call is logged; device and listener state lives
// in a JSON file the test seeds. Long-running fakes (emulator, logcat, Metro) stay alive like
// the real ones so `stop` has something to end.
const fakeImpl = `
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs')
const { spawn } = require('node:child_process')
const name = require('node:path').basename(process.argv[1])
const args = process.argv.slice(2)
const statePath = process.env.FAKE_STATE
const read = () => JSON.parse(readFileSync(statePath, 'utf8'))
const write = s => writeFileSync(statePath, JSON.stringify(s))
appendFileSync(process.env.FAKE_LOG, JSON.stringify({ name, args, ci: process.env.CI ?? null }) + '\\n')
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
  build: 'dev' | 'release' | null;
  emulatorPid?: number;
  onboarding?: boolean;
  foreignMetro?: boolean;
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
      build: 'dev',
      // The maintainer's emulator holds its console and adb ports.
      listeners: [
        { pid: 999_991, cwd: '/', port: 5554 },
        { pid: 999_991, cwd: '/', port: 5555 }
      ],
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
    state.listeners.push({ pid: child.pid!, cwd, port });
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
        done({ status, stdout, stderr, calls });
      });
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
    port,
    stack,
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
      `adb -s ${SERIAL} shell dumpsys package ${PACKAGE}`,
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

test.each([
  [null, 'The dev build is not installed'],
  ['release', 'The installed build is not a dev build']
] as const)(
  'start refuses build %s and names a build command for the harness emulator only',
  async (build, reason) => {
    const { stack, logPath } = await harness({ build });

    const { status, stderr, calls } = await stack('start');

    expect(status).toBe(1);
    expect(stderr).toContain(
      `${reason} (${PACKAGE} on ${SERIAL}). Build and install it on the harness emulator with ` +
        `\`pnpm exec expo run:android --device ${AVD} --no-bundler\``
    );
    expect(calls.map(call => call.name)).not.toContain('pnpm');
    expect(calls.map(call => call.name)).not.toContain('agent-device');
    expectTargeted(allCalls(logPath));
    await stack('stop');
  }
);

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
