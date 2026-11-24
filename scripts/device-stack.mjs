import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Puts the Android test environment into a known state for a device check
// (docs/verification.md "Device checks"; docs/adr/0008-device-stack-architecture.md).
// `template` creates the harness AVD once. `start [--fresh]` boots the harness emulator on a
// free console port, reverses the Metro port, installs the dev build matching this checkout's
// dev build key from the dev build cache (building it on a miss unless `--no-build`), starts
// or reuses this checkout's Metro, captures JS logs, opens the app through the dev-client
// link and waits for the start screen. `build` fills the dev build cache for this checkout.
// It never calls another emulator or a physical device: every adb call names the harness
// serial and every agent-device call names it and this run's session. `status` reports which recorded processes still pass their identity check;
// `stop` stops only what `start` started and still passes that check. `build-key` prints the
// dev build key of this checkout and the hash of each input behind it.
// State and logs live in .device-stack/ at the checkout root (the working directory); the dev
// build cache lives in the git common dir and the build lock in the host directory.
const ROOT = realpathSync(process.cwd());
const DIR = join(ROOT, '.device-stack');
const SCRIPT = fileURLToPath(import.meta.url);
const HOST_DIR = join(homedir(), '.liftlog-device-stack');
const BUILD_LOCK = join(HOST_DIR, 'build.lock');
const BUILD_WORKER = 'build-worker';
// Build worker exit code when the dev build key changed during the build.
const KEY_CHANGED = 3;
// Cached dev builds kept, most recently used first.
const RETAINED_BUILDS = 3;
const STATE = join(DIR, 'state.json');
const PORT = Number(process.env.DEVICE_STACK_PORT ?? 8081);
const HARNESS_AVD = 'liftlog_harness_34';
const HARNESS_ABI = process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64';
const HARNESS_IMAGE = `system-images;android-34;google_apis;${HARNESS_ABI}`;
const DEV_BUILD_VARIANT = 'debug';
// Environment variables the generated Gradle build reads; ORG_GRADLE_PROJECT_* variables
// also set Gradle properties.
const BUILD_ENV = ['EXPO_USE_COMMUNITY_AUTOLINKING'];
// Emulator console ports; each instance also takes the next port for adb.
const CONSOLE_PORTS = Array.from(
  { length: 16 },
  (_, index) => 5554 + index * 2
);
// testID on the Workout start screen heading (WorkoutStartScreen).
const START_SCREEN_ID = 'workout-start-screen';
const BOOT_TIMEOUT_MS = 180_000;
const METRO_TIMEOUT_MS = 120_000;
const OPEN_TIMEOUT_MS = 180_000;

const { expo } = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
const PACKAGE = expo.android.package;
const DEV_CLIENT_LINK = `${expo.scheme}://expo-development-client/?url=${encodeURIComponent(`http://10.0.2.2:${PORT}`)}`;

function run(command, args, input) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      input,
      maxBuffer: 64 << 20,
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe']
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

// A recorded process is trusted only while its PID, start time and argv markers match, so a
// PID the system reused for another process is never signalled.
function processIdentity(pid, markers) {
  const startTime = tryRun('ps', ['-o', 'lstart=', '-p', String(pid)]).trim();

  return startTime ? { pid, startTime, markers } : null;
}

function isSameProcess(recorded) {
  if (!recorded?.pid || !recorded.startTime) {
    return false;
  }

  const startTime = tryRun('ps', [
    '-o',
    'lstart=',
    '-p',
    String(recorded.pid)
  ]).trim();
  const command = tryRun('ps', ['-o', 'command=', '-p', String(recorded.pid)]);

  return (
    startTime === recorded.startTime &&
    recorded.markers.every(marker => command.includes(marker))
  );
}

function processGroup(pid) {
  return Number(tryRun('ps', ['-o', 'pgid=', '-p', String(pid)]).trim());
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
const tryAdb = (serial, ...args) => tryRun('adb', ['-s', serial, ...args]);
const listAvds = () =>
  run('emulator', ['-list-avds'])
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
// The AVD name the emulator console reports for a serial (`OK` follows it).
const avdName = serial =>
  tryAdb(serial, 'emu', 'avd', 'name').split(/\r?\n/)[0].trim();

function findOnPath(command) {
  const directory = (process.env.PATH ?? '')
    .split(delimiter)
    .find(entry => entry && existsSync(join(entry, command)));

  return directory ? join(directory, command) : null;
}

function avdmanager() {
  const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  const bundled =
    sdk && join(sdk, 'cmdline-tools', 'latest', 'bin', 'avdmanager');

  return (
    findOnPath('avdmanager') ??
    (bundled && existsSync(bundled) ? bundled : 'avdmanager')
  );
}

function template() {
  if (listAvds().includes(HARNESS_AVD)) {
    process.stdout.write(
      `${JSON.stringify({ avd: HARNESS_AVD, created: false }, null, 2)}\n`
    );

    return;
  }

  log(`creating ${HARNESS_AVD} from ${HARNESS_IMAGE}`);
  // `no` answers the custom hardware profile prompt.
  run(
    avdmanager(),
    [
      'create',
      'avd',
      '--name',
      HARNESS_AVD,
      '--package',
      HARNESS_IMAGE,
      '--device',
      'pixel_7'
    ],
    'no\n'
  );
  process.stdout.write(
    `${JSON.stringify({ avd: HARNESS_AVD, image: HARNESS_IMAGE, created: true }, null, 2)}\n`
  );
}

const sha256 = value =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

function jdkVersion() {
  const java = process.env.JAVA_HOME
    ? join(process.env.JAVA_HOME, 'bin', 'java')
    : 'java';
  // `java -version` prints to stderr.
  const result = spawnSync(java, ['-version'], { encoding: 'utf8' });

  if (result.error || result.status !== 0) {
    throw new Error(
      `${java} -version failed: ${String(result.error?.message ?? result.stderr).trim()}`
    );
  }

  return `${result.stdout}${result.stderr}`.trim();
}

function userGradleProperties() {
  const path = join(
    process.env.GRADLE_USER_HOME ?? join(homedir(), '.gradle'),
    'gradle.properties'
  );

  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

// docs/adr/0008-device-stack-architecture.md "Dev build key": every input that changes the
// Android dev build, and nothing JS-only. fingerprint.config.js shapes the fingerprint.
async function devBuildKey() {
  const requireFromExpo = createRequire(
    createRequire(join(ROOT, 'package.json')).resolve('expo/package.json')
  );
  const { createFingerprintAsync } = requireFromExpo('@expo/fingerprint');
  const fingerprint = await createFingerprintAsync(ROOT, {
    platforms: ['android'],
    silent: true
  });
  const environment = Object.fromEntries(
    Object.keys(process.env)
      .filter(name => name.startsWith('ORG_GRADLE_PROJECT_'))
      .concat(BUILD_ENV)
      .sort()
      .map(name => [name, process.env[name] ?? null])
  );
  const inputs = {
    fingerprint: fingerprint.hash,
    variant: sha256(DEV_BUILD_VARIANT),
    abi: sha256(HARNESS_ABI),
    jdk: sha256(jdkVersion()),
    gradleProperties: sha256(userGradleProperties()),
    environment: sha256(environment)
  };

  return { key: sha256(inputs), inputs };
}

async function buildKey() {
  process.stdout.write(`${JSON.stringify(await devBuildKey(), null, 2)}\n`);
}

// docs/adr/0008-device-stack-architecture.md "Dev build cache".
function cacheDir() {
  const common = run('git', [
    'rev-parse',
    '--path-format=absolute',
    '--git-common-dir'
  ]).trim();

  return join(common, 'device-stack', 'dev-builds');
}

// The cached APK for a key, marked as just used, or null on a miss.
function cachedBuild(key) {
  const apk = join(cacheDir(), `${key}.apk`);

  if (!existsSync(apk)) {
    return null;
  }

  const now = new Date();

  utimesSync(apk, now, now);

  return apk;
}

const fileHash = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

// Copies the APK beside its final name, then renames it, so a reader never sees a partial
// file; then keeps only the most recently used builds.
function publishBuild(key, apk) {
  const dir = cacheDir();
  const partial = join(dir, `.${key}.${process.pid}.apk`);

  mkdirSync(dir, { recursive: true });
  copyFileSync(apk, partial);
  renameSync(partial, join(dir, `${key}.apk`));
  readdirSync(dir)
    .filter(name => /^[0-9a-f]{64}\.apk$/.test(name))
    .map(name => ({
      path: join(dir, name),
      used: statSync(join(dir, name)).mtimeMs
    }))
    .sort((a, b) => b.used - a.used)
    .slice(RETAINED_BUILDS)
    .forEach(({ path }) => rmSync(path, { force: true }));
}

const readJson = path => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
};

// The build lock is a file linked into place atomically with its owner's identity. A lock
// whose owner fails its identity check is stale and broken.
async function acquireBuildLock(key) {
  mkdirSync(HOST_DIR, { recursive: true });
  const owner = {
    ...processIdentity(process.pid, [SCRIPT, BUILD_WORKER, key]),
    root: ROOT
  };
  const candidate = `${BUILD_LOCK}.${process.pid}`;

  writeFileSync(candidate, JSON.stringify(owner));

  try {
    for (;;) {
      try {
        linkSync(candidate, BUILD_LOCK);

        return;
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }

      const holder = readJson(BUILD_LOCK);

      if (holder && !isSameProcess(holder)) {
        log(`breaking the stale build lock of pid ${holder.pid}`);
        rmSync(BUILD_LOCK, { force: true });
        continue;
      }

      await sleep(500);
    }
  } finally {
    rmSync(candidate, { force: true });
  }
}

function releaseBuildLock() {
  if (readJson(BUILD_LOCK)?.pid === process.pid) {
    rmSync(BUILD_LOCK, { force: true });
  }
}

function runLogged(command, args, cwd, env = process.env) {
  log(`running ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });

  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.error?.message ?? `exit ${result.status}`}).`
    );
  }
}

// The detached build process: it holds the build lock until it exits, builds only on a miss,
// from a freshly regenerated android/, and publishes only while the key still matches.
async function buildWorker(key) {
  await acquireBuildLock(key);

  try {
    if (cachedBuild(key)) {
      log(`dev build ${key} is already cached`);

      return;
    }

    const android = join(ROOT, 'android');

    log('regenerating android/');
    rmSync(android, { recursive: true, force: true });
    runLogged(
      'pnpm',
      ['exec', 'expo', 'prebuild', '--platform', 'android', '--no-install'],
      ROOT,
      { ...process.env, CI: '1' }
    );
    runLogged(
      join(android, 'gradlew'),
      [
        `app:assemble${DEV_BUILD_VARIANT[0].toUpperCase()}${DEV_BUILD_VARIANT.slice(1)}`,
        `-PreactNativeArchitectures=${HARNESS_ABI}`
      ],
      android
    );

    const { key: after } = await devBuildKey();

    if (after !== key) {
      log(
        `the dev build key changed from ${key} to ${after} during the build; discarding it`
      );
      process.exitCode = KEY_CHANGED;

      return;
    }

    publishBuild(
      key,
      join(
        android,
        'app',
        'build',
        'outputs',
        'apk',
        DEV_BUILD_VARIANT,
        `app-${DEV_BUILD_VARIANT}.apk`
      )
    );
    log(`published dev build ${key}`);
  } finally {
    releaseBuildLock();
  }
}

// Returns the cached APK for a key, or starts the detached build process and returns a
// promise of its APK. The build process is never stopped by this process ending.
function devBuild(key, { noBuild }) {
  const apk = cachedBuild(key);

  if (apk) {
    return { key, built: false, apk, done: Promise.resolve(apk) };
  }

  if (noBuild) {
    throw new Error(
      `BUILD_MISSING: no cached dev build for key ${key}. Run \`pnpm run device:stack build\` or start without --no-build.`
    );
  }

  const buildLog = join(DIR, 'build.log');
  const out = openSync(buildLog, 'a');

  log(`building dev build ${key}; log: ${buildLog}`);
  const child = spawn(process.execPath, [SCRIPT, BUILD_WORKER, key], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, out]
  });

  closeSync(out);
  const done = new Promise(resolve => child.on('exit', resolve)).then(code => {
    const built = cachedBuild(key);

    if (built) {
      return built;
    }

    throw new Error(
      `BUILD_FAILED: ${code === KEY_CHANGED ? 'the dev build key changed during the build, so nothing was published' : 'the dev build failed'}; see ${buildLog}.`
    );
  });

  // Awaited after boot; a failure until then is not unhandled.
  done.catch(() => {});

  return { key, built: true, pid: child.pid, log: buildLog, done };
}

async function build() {
  mkdirSync(DIR, { recursive: true });
  const { key } = await devBuildKey();
  const { built, done } = devBuild(key, { noBuild: false });
  const apk = await done;

  process.stdout.write(`${JSON.stringify({ key, apk, built }, null, 2)}\n`);
}

// Installs the cached APK only when the installed APK differs from it.
function installDevBuild(serial, apk) {
  const path = tryAdb(serial, 'shell', 'pm', 'path', PACKAGE).match(
    /^package:(\S*base\.apk)\s*$/m
  )?.[1];
  const installed =
    path && tryAdb(serial, 'shell', 'sha256sum', path).trim().split(/\s+/)[0];

  if (installed === fileHash(apk)) {
    return false;
  }

  log(`installing ${apk} on ${serial}`);
  adb(serial, 'install', '-r', '-d', apk);

  return true;
}

// The serial is fixed by the console port before boot, so no other device is ever listed
// or called to find it.
function freeConsolePort() {
  const port = CONSOLE_PORTS.find(
    candidate =>
      !listeningPids(candidate).length && !listeningPids(candidate + 1).length
  );

  if (!port) {
    throw new Error('No free emulator console port between 5554 and 5584.');
  }

  return port;
}

async function bootEmulator(state) {
  if (!listAvds().includes(HARNESS_AVD)) {
    throw new Error(
      `The harness emulator ${HARNESS_AVD} does not exist. Create it with \`pnpm run device:stack template\`, then rerun.`
    );
  }

  const consolePort = freeConsolePort();
  const serial = `emulator-${consolePort}`;
  const args = [
    '-avd',
    HARNESS_AVD,
    '-port',
    String(consolePort),
    '-no-snapshot-save'
  ];

  log(`booting ${HARNESS_AVD} as ${serial}`);
  const pid = startDetached('emulator', args, join(DIR, 'emulator.log'));

  state.emulator = {
    serial,
    avd: HARNESS_AVD,
    started: true,
    process: processIdentity(pid, [
      '-avd',
      HARNESS_AVD,
      '-port',
      String(consolePort)
    ])
  };
  saveState(state);
  await waitFor('the emulator to connect', BOOT_TIMEOUT_MS, () => {
    if (!isSameProcess(state.emulator.process)) {
      throw new Error(
        `The ${HARNESS_AVD} emulator exited during boot; see ${join(DIR, 'emulator.log')}.`
      );
    }

    return tryAdb(serial, 'get-state').trim() === 'device';
  });

  const reported = avdName(serial);

  if (reported !== HARNESS_AVD) {
    throw new Error(
      `${serial} reports AVD ${JSON.stringify(reported)}, not ${HARNESS_AVD}; it is left untouched.`
    );
  }

  await waitFor(
    'the emulator to finish booting',
    BOOT_TIMEOUT_MS,
    () =>
      tryAdb(serial, 'shell', 'getprop', 'sys.boot_completed').trim() === '1'
  );

  return serial;
}

function listeningPids(port = PORT) {
  return tryRun('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'])
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

// Ready only when /status answers and the listener is in the process group this run started,
// so a foreign server on the port can never stand in for this run's Metro.
async function ownMetroReady(pid) {
  const listeners = listeningPids();

  if (!listeners.length || !(await metroRunning())) {
    return false;
  }

  if (listeners.some(listener => processGroup(listener) === pid)) {
    return true;
  }

  throw new Error(
    `Port ${PORT} answers as Metro from pid ${listeners.join(', ')}, not the Metro this run started (pid ${pid}).`
  );
}

async function start({ fresh, noBuild }) {
  if (readState()) {
    throw new Error(
      'A device stack is already recorded; run `pnpm run device:stack stop` first.'
    );
  }

  const reused = await existingMetro();

  const { key } = await devBuildKey();

  mkdirSync(DIR, { recursive: true });
  // A miss starts the build now, so it runs while the emulator boots.
  const { done, ...devBuildState } = devBuild(key, { noBuild });
  const state = {
    root: ROOT,
    port: PORT,
    package: PACKAGE,
    fresh,
    devBuild: devBuildState
  };

  saveState(state);
  const serial = await bootEmulator(state);

  adb(serial, 'reverse', `tcp:${PORT}`, `tcp:${PORT}`);
  state.reverse = `tcp:${PORT}`;
  saveState(state);

  state.devBuild.apk = await done;
  state.devBuild.installed = installDevBuild(serial, state.devBuild.apk);
  saveState(state);

  const metroLog = join(DIR, 'metro.log');

  if (reused) {
    // A running process's output cannot be redirected, so a reused Metro has no log file.
    state.metro = {
      pids: reused,
      started: false,
      log: null,
      output: 'in the terminal that started this Metro'
    };
    log(`reusing this checkout's Metro on port ${PORT}`);
  } else {
    log(`starting Metro on port ${PORT}`);
    // Without CI, so reloads stay on.
    const env = { ...process.env };

    delete env.CI;
    const args = [
      'exec',
      'expo',
      'start',
      '--dev-client',
      '--port',
      String(PORT)
    ];
    const pid = startDetached('pnpm', args, metroLog, env);

    state.metro = {
      pid,
      started: true,
      log: metroLog,
      process: processIdentity(pid, args)
    };
    saveState(state);
    await waitFor('Metro to start', METRO_TIMEOUT_MS, () => ownMetroReady(pid));
  }

  const jsLog = join(DIR, 'js.log');
  const logArgs = ['-s', serial, 'logcat', '-T', '1', '-s', 'ReactNativeJS:V'];
  const logPid = startDetached('adb', logArgs, jsLog);

  state.jsLogs = {
    pid: logPid,
    started: true,
    log: jsLog,
    process: processIdentity(logPid, logArgs)
  };
  saveState(state);

  if (fresh) {
    log(`clearing app data for ${PACKAGE}`);
    adb(serial, 'shell', 'pm', 'clear', PACKAGE);
  }

  log('opening the app on the bundle');
  const session = `liftlog-${process.pid}-${Date.now().toString(36)}`;
  const device = (...args) =>
    run('agent-device', [...args, '--serial', serial, '--session', session]);
  const tryDevice = (...args) =>
    tryRun('agent-device', [...args, '--serial', serial, '--session', session]);

  state.session = session;
  saveState(state);
  device(
    'open',
    PACKAGE,
    DEV_CLIENT_LINK,
    '--relaunch',
    '--metro-port',
    String(PORT)
  );

  if (fresh) {
    // The launch can return before either the onboarding or Workout is visible.
    const screen = await waitFor(
      'dev-client onboarding or Workout',
      OPEN_TIMEOUT_MS,
      () => {
        const snapshot = tryDevice('snapshot', '--raw', '--timeout', '5000');

        if (snapshot.includes('This is the developer menu.')) {
          return 'onboarding';
        }

        return snapshot.includes(START_SCREEN_ID) ? 'workout' : null;
      }
    );

    if (screen === 'onboarding') {
      log('dev-client onboarding appeared; pressing Continue and Close');
      device('press', 'label="Continue"', '--settle');
      device('press', 'label="Close"');
      log('dismissed dev-client onboarding');
    }
  }

  device('wait', `id=${START_SCREEN_ID}`, String(OPEN_TIMEOUT_MS));
  state.startScreen = true;
  state.running = true;
  saveState(state);
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
}

// What still runs, judged by identity checks rather than by the record alone.
function observe(state) {
  const observed = {};

  for (const name of ['emulator', 'metro', 'jsLogs']) {
    if (state[name]?.started) {
      observed[name] = isSameProcess(state[name].process)
        ? 'running'
        : 'stopped';
    }
  }

  return observed;
}

function status() {
  const state = readState();

  if (!state) {
    process.stdout.write(
      `${JSON.stringify({ running: false, message: 'Nothing is running.' }, null, 2)}\n`
    );

    return;
  }

  const observed = observe(state);
  const running =
    Boolean(state.running) &&
    Object.values(observed).every(value => value === 'running');

  process.stdout.write(
    `${JSON.stringify({ ...state, running, observed }, null, 2)}\n`
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
  const untrusted = [];
  const serial = state.emulator?.serial;

  if (state.session && serial) {
    tryRun('agent-device', [
      'close',
      '--serial',
      serial,
      '--session',
      state.session
    ]);
    stopped.push('session');
  }

  for (const name of ['jsLogs', 'metro']) {
    if (!state[name]?.started) {
      continue;
    }

    if (isSameProcess(state[name].process)) {
      stopGroup(state[name].pid);
      stopped.push(name);
    } else {
      untrusted.push(name);
    }
  }

  if (state.emulator?.started) {
    if (
      isSameProcess(state.emulator.process) &&
      avdName(serial) === HARNESS_AVD
    ) {
      tryAdb(serial, 'emu', 'kill');
      stopped.push('emulator');
    } else {
      untrusted.push('emulator');
    }
  }

  rmSync(STATE);
  process.stdout.write(
    `${JSON.stringify({ running: false, stopped, ...(untrusted.length && { untrusted }) }, null, 2)}\n`
  );
}

const [command, ...flags] = process.argv.slice(2);

try {
  if (command === 'start') {
    await start({
      fresh: flags.includes('--fresh'),
      noBuild: flags.includes('--no-build')
    });
  } else if (command === 'status') {
    status();
  } else if (command === 'stop') {
    stop();
  } else if (command === 'template') {
    template();
  } else if (command === 'build-key') {
    await buildKey();
  } else if (command === 'build') {
    await build();
  } else if (command === BUILD_WORKER) {
    await buildWorker(flags[0]);
  } else {
    throw new Error(
      'Usage: pnpm run device:stack template | start [--fresh] [--no-build] | status | stop | build-key | build'
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
