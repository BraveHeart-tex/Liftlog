import { execFileSync, spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';

// Puts the Android test environment into a known state for a device check
// (docs/verification.md "Device checks"). `start [--fresh]` boots the emulator if needed,
// reverses the Metro port, refuses a missing dev build, starts or reuses this checkout's
// Metro, captures JS logs, opens the app through the dev-client link and waits for the start
// screen. `status` prints the recorded state; `stop` stops only what `start` recorded.
// State and logs live in .device-stack/ at the checkout root (the working directory).
const ROOT = realpathSync(process.cwd());
const DIR = join(ROOT, '.device-stack');
const STATE = join(DIR, 'state.json');
const PORT = Number(process.env.DEVICE_STACK_PORT ?? 8081);
const START_SCREEN_TEXT = 'Exercises';
const BOOT_TIMEOUT_MS = 180_000;
const METRO_TIMEOUT_MS = 120_000;
const OPEN_TIMEOUT_MS = 180_000;

const { expo } = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
const PACKAGE = expo.android.package;
const DEV_CLIENT_LINK = `${expo.scheme}://expo-development-client/?url=${encodeURIComponent(`http://10.0.2.2:${PORT}`)}`;

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      maxBuffer: 64 << 20,
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    throw new Error(
      `${command} ${args.join(' ')} failed: ${String(error.stderr ?? error.message).trim()}`
    );
  }
}

function tryRun(command, args) {
  try {
    return run(command, args);
  } catch {
    return '';
  }
}

const log = message => process.stderr.write(`device-stack: ${message}\n`);
const sleep = ms => new Promise(done => setTimeout(done, ms));

async function waitFor(what, timeoutMs, check) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await check();

    if (value) {
      return value;
    }

    await sleep(500);
  }

  throw new Error(`Timed out after ${timeoutMs / 1000} s waiting for ${what}.`);
}

// Starts a long-running process in its own process group, writing to a log file, so it
// outlives this command and `stop` can end it with its children.
function startDetached(command, args, logFile, env = process.env) {
  const out = openSync(logFile, 'a');
  const child = spawn(command, args, {
    cwd: ROOT,
    detached: true,
    env,
    stdio: ['ignore', out, out]
  });

  child.unref();

  return child.pid;
}

function stopGroup(pid) {
  try {
    process.kill(-pid, 'SIGTERM');
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

const readState = () =>
  existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : null;
const saveState = state =>
  writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`);

const adb = (serial, ...args) => run('adb', ['-s', serial, ...args]);

function onlineDevices() {
  return tryRun('adb', ['devices'])
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(([serial, status]) => serial && status === 'device')
    .map(([serial]) => serial);
}

async function bootEmulator(state) {
  const [running] = onlineDevices();

  if (running) {
    state.emulator = { serial: running, started: false };
    log(`reusing device ${running}`);

    return running;
  }

  const [avd] = run('emulator', ['-list-avds']).split('\n').filter(Boolean);

  if (!avd) {
    throw new Error('No Android Virtual Device found (`emulator -list-avds`).');
  }

  log(`booting emulator ${avd}`);
  startDetached(
    'emulator',
    ['-avd', avd, '-no-snapshot-save'],
    join(DIR, 'emulator.log')
  );
  const serial = await waitFor('the emulator to connect', BOOT_TIMEOUT_MS, () =>
    onlineDevices().find(id => id.startsWith('emulator-'))
  );

  state.emulator = { serial, avd, started: true };
  saveState(state);
  await waitFor(
    'the emulator to finish booting',
    BOOT_TIMEOUT_MS,
    () =>
      tryRun('adb', [
        '-s',
        serial,
        'shell',
        'getprop',
        'sys.boot_completed'
      ]).trim() === '1'
  );

  return serial;
}

function listeningPids() {
  return tryRun('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t'])
    .split('\n')
    .filter(Boolean)
    .map(Number);
}

function workingDirectory(pid) {
  const line = tryRun('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'])
    .split('\n')
    .find(entry => entry.startsWith('n'));

  if (!line) {
    return null;
  }

  try {
    return realpathSync(line.slice(1));
  } catch {
    return line.slice(1);
  }
}

async function metroManifest() {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/`, {
      headers: {
        accept: 'application/expo+json,application/json',
        'expo-platform': 'android'
      },
      signal: AbortSignal.timeout(10_000)
    });
    const manifest = await response.json();

    return manifest.extra?.expoClient ?? manifest;
  } catch {
    return null;
  }
}

// Returns the listening Metro's pids when it provably belongs to this checkout, null when
// nothing listens, and refuses anything else without touching it.
async function existingMetro() {
  const pids = listeningPids();

  if (!pids.length) {
    return null;
  }

  const manifest = await metroManifest();

  if (manifest?.slug !== expo.slug || manifest?.name !== expo.name) {
    throw new Error(
      `Port ${PORT} is held by a server that is not this project's Metro (pid ${pids.join(', ')}, ` +
        `slug ${JSON.stringify(manifest?.slug ?? null)}). Stop it yourself, then rerun.`
    );
  }

  const foreign = pids
    .map(pid => ({ pid, cwd: workingDirectory(pid) }))
    .filter(({ cwd }) => cwd !== ROOT);

  if (foreign.length) {
    throw new Error(
      `Port ${PORT} is held by Metro from another checkout ` +
        `(${foreign.map(({ pid, cwd }) => `pid ${pid} in ${cwd}`).join(', ')}). ` +
        'Stop it yourself, then rerun.'
    );
  }

  return pids;
}

async function metroRunning() {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/status`, {
      signal: AbortSignal.timeout(5_000)
    });

    return (await response.text()).includes('packager-status:running');
  } catch {
    return false;
  }
}

async function start({ fresh }) {
  if (readState()) {
    throw new Error(
      'A device stack is already recorded; run `pnpm run device:stack stop` first.'
    );
  }

  const reused = await existingMetro();

  mkdirSync(DIR, { recursive: true });
  const state = { root: ROOT, port: PORT, package: PACKAGE, fresh };

  saveState(state);
  const serial = await bootEmulator(state);

  adb(serial, 'reverse', `tcp:${PORT}`, `tcp:${PORT}`);
  state.reverse = `tcp:${PORT}`;
  saveState(state);

  // A dev build is debuggable; a release build of the same package runs its embedded
  // bundle and never reaches Metro.
  const packageFlags = adb(
    serial,
    'shell',
    'dumpsys',
    'package',
    PACKAGE
  ).match(/pkgFlags=\[([^\]]*)\]/);

  if (!packageFlags?.[1].split(/\s+/).includes('DEBUGGABLE')) {
    throw new Error(
      `${packageFlags ? 'The installed build is not a dev build' : 'The dev build is not installed'} ` +
        `(${PACKAGE} on ${serial}). Build and install it with \`pnpm run android\`, then rerun.`
    );
  }

  const metroLog = join(DIR, 'metro.log');

  if (reused) {
    state.metro = { pids: reused, started: false };
    log(`reusing this checkout's Metro on port ${PORT}`);
  } else {
    log(`starting Metro on port ${PORT}`);
    // Without CI, so reloads stay on.
    const env = { ...process.env };

    delete env.CI;
    const pid = startDetached(
      'pnpm',
      ['exec', 'expo', 'start', '--dev-client', '--port', String(PORT)],
      metroLog,
      env
    );

    state.metro = { pid, started: true, log: metroLog };
    saveState(state);
    await waitFor('Metro to start', METRO_TIMEOUT_MS, metroRunning);
  }

  const jsLog = join(DIR, 'js.log');
  const logPid = startDetached(
    'adb',
    ['-s', serial, 'logcat', '-T', '1', '-s', 'ReactNativeJS:V'],
    jsLog
  );

  state.jsLogs = { pid: logPid, started: true, log: jsLog };
  saveState(state);

  if (fresh) {
    log(`clearing app data for ${PACKAGE}`);
    adb(serial, 'shell', 'pm', 'clear', PACKAGE);
  }

  log('opening the app on the bundle');
  state.session = true;
  saveState(state);
  run('agent-device', ['open', PACKAGE, DEV_CLIENT_LINK, '--relaunch']);
  run('agent-device', [
    'wait',
    'text',
    START_SCREEN_TEXT,
    String(OPEN_TIMEOUT_MS)
  ]);
  state.startScreen = true;
  state.running = true;
  saveState(state);
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
}

function status() {
  const state = readState();

  process.stdout.write(
    `${JSON.stringify(state ?? { running: false, message: 'Nothing is running.' }, null, 2)}\n`
  );
}

function stop() {
  const state = readState();

  if (!state) {
    process.stdout.write(
      `${JSON.stringify({ running: false, message: 'Nothing is running.' }, null, 2)}\n`
    );

    return;
  }

  const stopped = [];

  if (state.session) {
    tryRun('agent-device', ['close']);
    stopped.push('session');
  }

  if (state.jsLogs?.started) {
    stopGroup(state.jsLogs.pid);
    stopped.push('jsLogs');
  }

  if (state.metro?.started) {
    stopGroup(state.metro.pid);
    stopped.push('metro');
  }

  if (state.emulator?.started) {
    tryRun('adb', ['-s', state.emulator.serial, 'emu', 'kill']);
    stopped.push('emulator');
  }

  rmSync(STATE);
  process.stdout.write(
    `${JSON.stringify({ running: false, stopped }, null, 2)}\n`
  );
}

const [command, ...flags] = process.argv.slice(2);

try {
  if (command === 'start') {
    await start({ fresh: flags.includes('--fresh') });
  } else if (command === 'status') {
    status();
  } else if (command === 'stop') {
    stop();
  } else {
    throw new Error(
      'Usage: pnpm run device:stack start [--fresh] | status | stop'
    );
  }
} catch (error) {
  process.stderr.write(`device-stack: ${error.message}\n`);

  if (command === 'start' && readState()) {
    process.stderr.write(
      'device-stack: run `pnpm run device:stack stop` to stop what was started.\n'
    );
  }

  process.exitCode = 1;
}
