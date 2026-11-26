import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual
} from 'node:crypto';
import {
  chmodSync,
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
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Puts the Android test environment into a known state for a device check
// (docs/verification.md "Device checks"; docs/adr/0008-device-stack-architecture.md).
// `template [--recreate]` creates the harness AVD once and its clean template snapshot.
// `start [--fresh]` leases an emulator slot from the host registry (repeating it returns the
// same lease; `--fresh` then clears its app data), starts this lease's Metro on the slot's
// Metro port while it boots a read-only template instance on the slot's ports, installs the dev
// build matching this checkout's dev build key from the dev build cache (building it on a miss
// unless `--no-build`), captures JS logs, opens the app through the dev-client link on
// 10.0.2.2 and waits for the start screen, failing at once on a bundling error or redbox.
// `build` fills the dev build cache for this checkout.
// It never calls another emulator or a physical device: every adb call names the harness
// serial and every agent-device call names it and this run's session. `status` reports which
// recorded processes still pass their identity check; `stop` stops only what `start` started
// and still passes that check, then releases the lease. `device <command> [args]` runs an
// allowlisted agent-device command on this worktree's ready lease only; `open <path>` opens a
// liftlog:// deep link there, `adb` runs an allowlisted adb subcommand on its serial, `sql`
// queries a read-only copy of its app database and `logs` prints a bounded tail of its JS or
// Metro log. `gc [--dry-run] [--idle <minutes>]` reclaims leases whose owners are provably gone, and `list` shows every slot read-only.
// `build-key` prints the dev build key of this checkout and the hash of each input behind it.
// The lease pointer, run state, logs and operation lock live in .device-stack/ at the checkout
// root (the working directory); the dev build cache lives in the git common dir; the lease
// registry, its lock, the host config and the build lock live in the host directory.
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
const OPERATION_LOCK = join(DIR, 'operation.lock');
const REGISTRY = join(HOST_DIR, 'registry.json');
const REGISTRY_LOCK = join(HOST_DIR, 'registry.lock');
// `{ "limit": 2 }` raises the emulator limit up to MAX_LIMIT; DEVICE_STACK_LIMIT can only lower
// it. `metroPorts` and `brokerPorts` replace the Metro and lease broker port of each slot, and
// `sandbox` names the Docker Sandbox a lease broker serves.
const HOST_CONFIG = join(HOST_DIR, 'config.json');
const DEFAULT_LIMIT = 1;
const MAX_LIMIT = 2;
// Argv marker of a device stack process holding a lock or running a lease operation.
const SELF_MARKERS = ['device-stack.mjs'];
const HARNESS_AVD = 'liftlog_harness_34';
// docs/adr/0008-device-stack-architecture.md "Emulator instances": the clean boot snapshot
// every leased instance boots from, and its version.
const TEMPLATE_SNAPSHOT = 'liftlog_template';
const TEMPLATE = join(HOST_DIR, 'template.json');
// The harness AVD's hardware, written to its config.ini before the template boot: 4 GB RAM
// and 720x1600 at 280 dpi, about 411 dp wide.
const HARNESS_HARDWARE = {
  'hw.ramSize': '4096',
  'hw.lcd.width': '720',
  'hw.lcd.height': '1600',
  'hw.lcd.density': '280'
};
// Host GPU rendering on every boot. Left on auto, the emulator falls back to software
// rendering under host memory pressure, and a snapshot saved in one mode fails to load in
// the other, so the instance cold boots.
const GPU_ARGS = ['-gpu', 'host'];
// Device property and argv marker carrying a leased instance's lease ID. `-prop` values are
// lost on snapshot boot, so the property is set with `setprop` once the device connects.
const LEASE_PROP = 'debug.liftlog.lease';
const ANIMATION_SCALES = [
  'window_animation_scale',
  'transition_animation_scale',
  'animator_duration_scale'
];
const HARNESS_ABI = process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64';
const HARNESS_IMAGE = `system-images;android-34;google_apis;${HARNESS_ABI}`;
const DEV_BUILD_VARIANT = 'debug';
// Environment variables the generated Gradle build reads; ORG_GRADLE_PROJECT_* variables
// also set Gradle properties.
const BUILD_ENV = ['EXPO_USE_COMMUNITY_AUTOLINKING'];
// Slot n fixes the emulator console port 5556 + 2n and the adb port above it, and its Metro
// port; 5554 and 8081 stay free for the maintainer's emulator and Metro.
const DEFAULT_METRO_PORTS = [8090, 8091];
// The lease broker port of each slot, on host 127.0.0.1.
const DEFAULT_BROKER_PORTS = [8092, 8093];
const slotPorts = slot => ({
  consolePort: 5556 + slot * 2,
  adbPort: 5557 + slot * 2,
  metroPort: metroPorts()[slot]
});
// LogBox inspector titles of the errors that open a redbox.
const REDBOX_TITLES = ['Uncaught Error', 'Syntax Error', 'Render Error'];
const METRO_TAIL_LINES = 20;
// The logcat tags the JS log keeps: JS output and native crashes.
const JS_LOG_FILTER = ['ReactNativeJS:V', 'AndroidRuntime:E'];
const DEFAULT_LOG_LINES = 50;
const MAX_LOG_LINES = 500;
// Deep links opened closer together drop the app to the dev launcher.
const OPEN_INTERVAL_MS = 3000;
// testID on the Workout start screen heading (WorkoutStartScreen).
const START_SCREEN_ID = 'workout-start-screen';
const BOOT_TIMEOUT_MS = 180_000;
const METRO_TIMEOUT_MS = 120_000;
const OPEN_TIMEOUT_MS = 180_000;
// How long a reclaim waits for the processes it signalled to exit.
const RECLAIM_TIMEOUT_MS = 30_000;
const COMPONENTS = ['emulator', 'metro', 'jsLogs'];
// Gap between retried checks in `waitFor` and the build lock wait; tooling tests shorten it.
const POLL_MS = Number(process.env.DEVICE_STACK_POLL_MS) || 500;

// Tooling tests inject a module here to act between a check and the action it guards.
const hooks = process.env.DEVICE_STACK_HOOKS
  ? await import(pathToFileURL(process.env.DEVICE_STACK_HOOKS).href)
  : {};
const hook = async (point, context) => hooks[point]?.(context);

const { expo } = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
const PACKAGE = expo.android.package;
// 10.0.2.2 is the host's loopback seen from the emulator, so no adb reverse is needed.
const devClientLink = port =>
  `${expo.scheme}://expo-development-client/?url=${encodeURIComponent(`http://10.0.2.2:${port}`)}`;

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

    await sleep(POLL_MS);
  }

  throw new Error(`Timed out after ${timeoutMs / 1000} s waiting for ${what}.`);
}

// Starts a long-running process in its own process group, writing to a log file, so it
// outlives this command and `stop` can end it with its children.
function startDetached(command, args, logFile, env = process.env) {
  assertLease();
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

const adb = (serial, ...args) => {
  assertLease();

  return run('adb', ['-s', serial, ...args]);
};

const tryAdb = (serial, ...args) => {
  assertLease();

  return tryRun('adb', ['-s', serial, ...args]);
};

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

function createAvd() {
  if (listAvds().includes(HARNESS_AVD)) {
    return false;
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

  return true;
}

// Sets HARNESS_HARDWARE in the harness AVD's config.ini, replacing each key in place and
// appending missing ones. A change invalidates any saved snapshot, so only `template` calls it.
function applyHarnessHardware() {
  const config = join(
    process.env.ANDROID_AVD_HOME || join(homedir(), '.android', 'avd'),
    `${HARNESS_AVD}.avd`,
    'config.ini'
  );

  if (!existsSync(config)) {
    throw new Error(
      `${config} does not exist. Delete ${HARNESS_AVD} with \`avdmanager delete avd --name ${HARNESS_AVD}\`, then rerun.`
    );
  }

  const lines = readFileSync(config, 'utf8').split('\n');
  const missing = new Set(Object.keys(HARNESS_HARDWARE));
  const updated = lines.map(line => {
    const key = line.slice(0, line.indexOf('=')).trim();

    if (!line.includes('=') || !(key in HARNESS_HARDWARE)) {
      return line;
    }

    missing.delete(key);

    return `${key}=${HARNESS_HARDWARE[key]}`;
  });

  if (updated.at(-1) === '') {
    updated.pop();
  }

  for (const key of missing) {
    updated.push(`${key}=${HARNESS_HARDWARE[key]}`);
  }

  writeFileSync(config, `${updated.join('\n')}\n`);
}

// Applies the harness hardware, boots the harness AVD writable from wiped data, turns animations off, checks no app is
// installed and saves the template snapshot. It holds the registry lock throughout and
// refuses while any lease is live, so no instance runs from the AVD meanwhile.
async function template({ recreate }) {
  const created = createAvd();
  const current = readJson(TEMPLATE);

  if (current && !recreate) {
    process.stdout.write(
      `${JSON.stringify({ avd: HARNESS_AVD, created, template: current }, null, 2)}\n`
    );

    return;
  }

  mkdirSync(HOST_DIR, { recursive: true });
  const snapshot = await withRegistry(async registry => {
    if (registry.leases.length) {
      throw new Error(
        `TEMPLATE_BUSY: the template cannot be rebuilt while leases are live: ${registry.leases
          .map(
            lease =>
              `slot ${lease.slot} by lease ${lease.id} from ${lease.root}`
          )
          .join('; ')}.`
      );
    }

    applyHarnessHardware();

    return snapshotTemplate();
  });

  process.stdout.write(
    `${JSON.stringify({ avd: HARNESS_AVD, image: HARNESS_IMAGE, created, template: snapshot }, null, 2)}\n`
  );
}

async function snapshotTemplate() {
  const { consolePort, adbPort } = slotPorts(0);
  const serial = `emulator-${consolePort}`;
  const holders = [...listeningPids(consolePort), ...listeningPids(adbPort)];

  if (holders.length) {
    throw new Error(
      `Ports ${consolePort}/${adbPort} are held by pid ${holders.join(', ')}; the template boots there.`
    );
  }

  const args = [
    '-avd',
    HARNESS_AVD,
    '-port',
    String(consolePort),
    '-wipe-data',
    '-no-snapshot-load',
    '-no-boot-anim',
    ...GPU_ARGS
  ];

  log(`booting ${HARNESS_AVD} writable as ${serial} to snapshot the template`);
  const emulator = processIdentity(
    startDetached('emulator', args, join(HOST_DIR, 'template.log')),
    args
  );

  try {
    await waitFor('the template emulator to boot', BOOT_TIMEOUT_MS, () => {
      if (!isSameProcess(emulator)) {
        throw new Error(
          `The template emulator exited; see ${join(HOST_DIR, 'template.log')}.`
        );
      }

      return (
        avdName(serial) === HARNESS_AVD &&
        tryAdb(serial, 'shell', 'getprop', 'sys.boot_completed').trim() === '1'
      );
    });

    for (const scale of ANIMATION_SCALES) {
      adb(serial, 'shell', 'settings', 'put', 'global', scale, '0');
    }

    if (tryAdb(serial, 'shell', 'pm', 'path', PACKAGE).trim()) {
      throw new Error(`${PACKAGE} is installed on the wiped template.`);
    }

    adb(serial, 'emu', 'avd', 'snapshot', 'save', TEMPLATE_SNAPSHOT);
  } finally {
    if (isSameProcess(emulator) && avdName(serial) === HARNESS_AVD) {
      tryAdb(serial, 'emu', 'kill');
    }
  }

  await waitFor(
    'the template emulator to exit',
    BOOT_TIMEOUT_MS,
    () => !isSameProcess(emulator)
  );
  const snapshot = {
    snapshot: TEMPLATE_SNAPSHOT,
    version: new Date().toISOString()
  };

  writeFileSync(TEMPLATE, `${JSON.stringify(snapshot, null, 2)}\n`);

  return snapshot;
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

      await sleep(POLL_MS);
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

// docs/adr/0008-device-stack-architecture.md "Lease protocol". A lock is a directory of
// numbered generation files, each linked into place whole and never rewritten: the highest
// holds its holder's identity, or `free` once released. Taking a free lock and breaking a
// stale one both link the next generation, so exactly one waiter wins, and a generation
// another process linked in the meantime is never removed.
const generations = dir =>
  readdirSync(dir)
    .map(name => /^(\d+)\.json$/.exec(name)?.[1])
    .filter(Boolean)
    .map(Number)
    .sort((a, b) => a - b);

function linkGeneration(dir, generation, content) {
  const candidate = join(dir, `.${process.pid}.${randomUUID()}`);

  writeFileSync(candidate, JSON.stringify(content));

  try {
    linkSync(candidate, join(dir, `${generation}.json`));

    return true;
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }

    return false;
  } finally {
    rmSync(candidate, { force: true });
  }
}

let selfIdentity;
const self = () =>
  (selfIdentity ??= processIdentity(process.pid, SELF_MARKERS));

// Returns the generation this process now holds. A holder that fails its identity check is
// provably dead, so its lock is stale.
async function acquireLock(dir, what) {
  mkdirSync(dir, { recursive: true });
  const owner = { ...self(), root: ROOT };
  let waitingOn = null;

  for (;;) {
    const top = generations(dir).at(-1) ?? 0;
    const holder = top ? readJson(join(dir, `${top}.json`)) : { free: true };

    if (!holder) {
      // Pruned after a newer generation was linked.
      continue;
    }

    const stale = !holder.free && !isSameProcess(holder);

    if (holder.free || stale) {
      await hook('lockChecked', { lock: dir, generation: top, stale });
      const next = top + 1;

      if (linkGeneration(dir, next, owner)) {
        // A generation pruned while this process waited can be linked again; only the
        // highest one holds the lock.
        if (generations(dir).at(-1) === next) {
          if (stale) {
            log(`broke the stale ${what} of pid ${holder.pid}`);
          }

          generations(dir)
            .filter(generation => generation < next)
            .forEach(generation =>
              rmSync(join(dir, `${generation}.json`), { force: true })
            );

          return next;
        }

        rmSync(join(dir, `${next}.json`), { force: true });
      }

      continue;
    }

    if (waitingOn !== holder.pid) {
      log(`waiting for the ${what} held by pid ${holder.pid}`);
      waitingOn = holder.pid;
    }

    await sleep(100);
  }
}

function releaseLock(dir, generation) {
  if (!linkGeneration(dir, generation + 1, { free: true })) {
    log(`${dir} was taken over before this process released it`);
  }
}

// The limit is one emulator unless the host config raises it, at most to MAX_LIMIT; the
// environment can only lower it. `source` names what set the effective limit.
function effectiveLimit() {
  const set = readJson(HOST_CONFIG)?.limit;
  const configured = set ?? DEFAULT_LIMIT;

  if (
    !Number.isInteger(configured) ||
    configured < 1 ||
    configured > MAX_LIMIT
  ) {
    throw new Error(
      `${HOST_CONFIG}: limit must be an integer from 1 to ${MAX_LIMIT}.`
    );
  }

  const source = set === undefined ? 'default' : 'host config';
  const lowered = process.env.DEVICE_STACK_LIMIT;

  if (!lowered) {
    return { limit: configured, source };
  }

  if (!/^[1-9]\d*$/.test(lowered)) {
    throw new Error('DEVICE_STACK_LIMIT must be a positive integer.');
  }

  return Number(lowered) < configured
    ? { limit: Number(lowered), source: 'DEVICE_STACK_LIMIT' }
    : { limit: configured, source };
}

const emulatorLimit = () => effectiveLimit().limit;

// `limit <n>` merges the limit into the host config, replaced whole and keeping every other
// key; `limit` alone prints the effective limit and its source.
function limit(args) {
  if (args.length === 0) {
    process.stdout.write(`${JSON.stringify(effectiveLimit(), null, 2)}\n`);

    return;
  }

  const [value] = args;

  if (
    args.length > 1 ||
    !/^[1-9]\d*$/.test(value) ||
    Number(value) > MAX_LIMIT
  ) {
    throw new Error(
      `Usage: pnpm run device:stack limit [<n>], n an integer from 1 to ${MAX_LIMIT}`
    );
  }

  const config = existsSync(HOST_CONFIG) ? readJson(HOST_CONFIG) : {};

  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${HOST_CONFIG} is not a JSON object; fix it by hand.`);
  }

  mkdirSync(HOST_DIR, { recursive: true });
  const partial = `${HOST_CONFIG}.${process.pid}`;

  writeFileSync(
    partial,
    `${JSON.stringify({ ...config, limit: Number(value) }, null, 2)}\n`
  );
  renameSync(partial, HOST_CONFIG);
  process.stdout.write(`${JSON.stringify(effectiveLimit(), null, 2)}\n`);
}

function slotPortList(key, defaults) {
  const ports = readJson(HOST_CONFIG)?.[key] ?? defaults;

  if (
    !Array.isArray(ports) ||
    ports.length !== MAX_LIMIT ||
    new Set(ports).size !== MAX_LIMIT ||
    !ports.every(port => Number.isInteger(port) && port > 1023 && port < 65536)
  ) {
    throw new Error(
      `${HOST_CONFIG}: ${key} must list ${MAX_LIMIT} distinct ports from 1024 to 65535.`
    );
  }

  return ports;
}

const metroPorts = () => slotPortList('metroPorts', DEFAULT_METRO_PORTS);
const brokerPorts = () => slotPortList('brokerPorts', DEFAULT_BROKER_PORTS);

const readRegistry = () => readJson(REGISTRY) ?? { leases: [] };

// Replaced whole, so a reader without the lock sees one complete version.
function writeRegistry(registry) {
  const partial = `${REGISTRY}.${process.pid}`;

  writeFileSync(partial, `${JSON.stringify(registry, null, 2)}\n`);
  renameSync(partial, REGISTRY);
}

const findLease = (registry, id) =>
  registry.leases.find(lease => lease.id === id) ?? null;

async function withRegistry(change) {
  mkdirSync(HOST_DIR, { recursive: true });
  const generation = await acquireLock(REGISTRY_LOCK, 'registry lock');

  try {
    return await change(readRegistry());
  } finally {
    releaseLock(REGISTRY_LOCK, generation);
  }
}

const leaseLost = (
  id,
  next = "run `pnpm run device:stack stop` to clear this worktree's record"
) =>
  new Error(
    `LEASE_LOST: lease ${id} no longer holds its slot, so nothing was signaled or called; ${next}.`
  );

// The lease this run acts for; every device call and spawn first checks it still holds its
// slot.
let activeLease = null;

function assertLease() {
  if (activeLease && !findLease(readRegistry(), activeLease)) {
    throw leaseLost(activeLease);
  }
}

// The operation record precedes every spawn, so a lease is never reclaimed mid-operation.
const operation = kind => ({ kind, process: self() });
const ownOperation = lease =>
  lease.operation?.process?.pid === process.pid &&
  lease.operation.process.startTime === self().startTime;

// Compare-and-swap on the lease ID under the registry lock.
const updateLease = (id, edit) =>
  withRegistry(registry => {
    const lease = findLease(registry, id);

    if (!lease) {
      throw leaseLost(id);
    }

    edit(lease);
    writeRegistry(registry);

    return lease;
  });

// Takes over the lease's operation record unless a live process still runs it.
const claimOperation = (id, kind) =>
  updateLease(id, lease => {
    const current = lease.operation;

    if (current && !ownOperation(lease) && isSameProcess(current.process)) {
      throw new Error(
        `Lease ${id} is busy: pid ${current.process.pid} is running its ${current.kind}.`
      );
    }

    lease.operation = operation(kind);
  });

// A full registry first reaps the leases whose owners are provably gone, then fails with
// CAPACITY only if no slot came free.
async function acquireLease(id) {
  const limit = emulatorLimit();
  const gitCommonDir =
    tryRun('git', [
      'rev-parse',
      '--path-format=absolute',
      '--git-common-dir'
    ]).trim() || null;

  await hook('beforeAcquire', { root: ROOT });

  return withRegistry(async registry => {
    try {
      return allocateSlot(registry, id, limit, gitCommonDir);
    } catch (error) {
      if (!error.message.startsWith('CAPACITY')) {
        throw error;
      }

      const decisions = await reap(registry);

      if (!decisions.some(({ decision }) => decision === 'reclaim')) {
        throw error;
      }

      return allocateSlot(registry, id, limit, gitCommonDir);
    }
  });
}

function allocateSlot(registry, id, limit, gitCommonDir) {
  const holders = registry.leases.map(
    lease => `slot ${lease.slot} by lease ${lease.id} from ${lease.root}`
  );

  if (registry.leases.length >= limit) {
    throw new Error(
      `CAPACITY: the emulator limit is ${limit} and every slot is leased: ${holders.join('; ')}.`
    );
  }

  const blocked = [];

  for (let slot = 0; slot < MAX_LIMIT; slot += 1) {
    if (registry.leases.some(lease => lease.slot === slot)) {
      continue;
    }

    const ports = slotPorts(slot);
    // A server this lease did not start blocks the slot and is left alone.
    const listeners = [
      ...new Set([
        ...listeningPids(ports.consolePort),
        ...listeningPids(ports.adbPort),
        ...listeningPids(ports.metroPort)
      ])
    ];

    if (listeners.length) {
      blocked.push(
        `slot ${slot} ports ${ports.consolePort}/${ports.adbPort}/${ports.metroPort} are held by pid ${listeners.join(', ')}`
      );
      continue;
    }

    const lease = {
      id,
      slot,
      ...ports,
      serial: `emulator-${ports.consolePort}`,
      root: ROOT,
      gitCommonDir,
      acquiredAt: new Date().toISOString(),
      operation: operation('acquire')
    };

    registry.leases.push(lease);
    writeRegistry(registry);

    return lease;
  }

  throw new Error(
    `CAPACITY: no emulator slot is free: ${[...holders, ...blocked].join('; ')}.`
  );
}

// docs/adr/0008-device-stack-architecture.md "Reclaiming leases".
const realOrSame = path => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

// Whether the lease's worktree is on disk and in its repository's worktree list; `listed` is
// null when the list cannot be read.
function worktreeEvidence(lease) {
  const exists = existsSync(lease.root);
  const list =
    lease.gitCommonDir && existsSync(lease.gitCommonDir)
      ? tryRun('git', [
          '--git-dir',
          lease.gitCommonDir,
          'worktree',
          'list',
          '--porcelain'
        ])
      : '';
  const listed = list
    ? list
        .split('\n')
        .filter(line => line.startsWith('worktree '))
        .some(line => realOrSame(line.slice('worktree '.length)) === lease.root)
    : lease.gitCommonDir
      ? false
      : null;

  return { path: lease.root, exists, listed };
}

const recordedProcesses = lease =>
  Object.fromEntries(
    COMPONENTS.filter(name => lease.processes?.[name]).map(name => [
      name,
      isSameProcess(lease.processes[name]) ? 'running' : 'stopped'
    ])
  );

const operationEvidence = ({ operation: current }) =>
  current && {
    kind: current.kind,
    pid: current.process?.pid ?? null,
    running: isSameProcess(current.process)
  };

// Decides one lease from evidence alone: keep, reclaim, or conflict when its ownership
// cannot be established.
function judgeLease(lease, idleMinutes) {
  const evidence = { operation: operationEvidence(lease) };
  const keep = reason => ({ decision: 'keep', reason, evidence });

  if (evidence.operation?.running) {
    return keep(
      `its ${evidence.operation.kind} is still running in pid ${evidence.operation.pid}`
    );
  }

  evidence.worktree = worktreeEvidence(lease);
  evidence.processes = recordedProcesses(lease);
  const usedAt = lease.usedAt ?? lease.acquiredAt;
  evidence.idleMinutes = Math.floor((Date.now() - Date.parse(usedAt)) / 60_000);
  const { exists, listed } = evidence.worktree;
  let reason;

  if (!exists) {
    reason = `its worktree ${lease.root} is missing from disk`;
  } else if (listed === false) {
    reason = `its worktree ${lease.root} is not in its repository's worktree list`;
  } else if (!Object.values(evidence.processes).includes('running')) {
    reason = 'none of its processes is alive';
  } else if (idleMinutes !== null && evidence.idleMinutes >= idleMinutes) {
    reason = `it has been idle for ${evidence.idleMinutes} minutes`;
  } else {
    return keep('its worktree exists and a verified process is alive');
  }

  // Every listener on the slot's ports and the device must be provably this lease's.
  const verified = COMPONENTS.filter(
    name => evidence.processes[name] === 'running'
  ).map(name => lease.processes[name].pid);
  const conflicts = [];

  evidence.listeners = [lease.consolePort, lease.adbPort, lease.metroPort]
    .flatMap(port => listeningPids(port).map(pid => ({ port, pid })))
    .map(listener => ({
      ...listener,
      owned:
        verified.includes(listener.pid) ||
        verified.includes(processGroup(listener.pid))
    }));

  for (const { port, pid, owned } of evidence.listeners) {
    if (!owned) {
      conflicts.push(
        `pid ${pid} on port ${port} is not a verified process of this lease`
      );
    }
  }

  if (evidence.processes.emulator === 'running') {
    const device = {
      serial: lease.serial,
      avd: avdName(lease.serial),
      token: leaseToken(lease.serial)
    };

    evidence.device = device;

    // An empty token is a start that died before setting it; its verified process is ours.
    if (
      device.token &&
      (device.token !== lease.id || device.avd !== HARNESS_AVD)
    ) {
      conflicts.push(
        `${lease.serial} reports AVD ${JSON.stringify(device.avd)} and lease token ${JSON.stringify(device.token)}`
      );
    }
  }

  return conflicts.length
    ? {
        decision: 'conflict',
        reason: `${reason}, but ${conflicts.join('; ')}`,
        evidence
      }
    : { decision: 'reclaim', reason, evidence };
}

// Stops the lease's verified processes, rechecking each identity just before its signal, and
// waits for them to exit.
async function reclaimProcesses(lease, evidence) {
  const stopped = [];

  for (const name of ['jsLogs', 'metro']) {
    if (
      evidence.processes[name] === 'running' &&
      isSameProcess(lease.processes[name])
    ) {
      stopGroup(lease.processes[name].pid);
      stopped.push(name);
    }
  }

  const emulator = lease.processes?.emulator;

  if (evidence.processes.emulator === 'running' && isSameProcess(emulator)) {
    if (evidence.device.token === lease.id) {
      tryRun('agent-device', [
        'close',
        '--serial',
        lease.serial,
        '--session',
        `liftlog-${lease.id}`
      ]);
      tryRun('adb', ['-s', lease.serial, 'emu', 'kill']);
    } else {
      stopGroup(emulator.pid);
    }

    stopped.push('emulator');
  }

  await waitFor('the reclaimed processes to exit', RECLAIM_TIMEOUT_MS, () =>
    stopped.every(name => !isSameProcess(lease.processes[name]))
  );

  return stopped;
}

// Judges every lease of a registry held under its lock and, unless a dry run, reclaims the
// reclaimable ones; conflicts are reported and left untouched.
async function reap(registry, { idleMinutes = null, dryRun = false } = {}) {
  const decisions = [];

  for (const lease of [...registry.leases]) {
    const judged = judgeLease(lease, idleMinutes);
    const decision = {
      lease: lease.id,
      slot: lease.slot,
      root: lease.root,
      ...judged
    };

    if (judged.decision !== 'keep') {
      log(
        `${dryRun ? 'would ' : ''}${judged.decision} lease ${lease.id}: ${judged.reason}`
      );
    }

    if (judged.decision === 'reclaim' && !dryRun) {
      decision.stopped = await reclaimProcesses(lease, judged.evidence);
      registry.leases = registry.leases.filter(entry => entry.id !== lease.id);
      writeRegistry(registry);
    }

    decisions.push(decision);
  }

  return decisions;
}

async function gc(flags) {
  let idleMinutes = null;
  let dryRun = false;

  for (let index = 0; index < flags.length; index += 1) {
    if (flags[index] === '--dry-run') {
      dryRun = true;
    } else if (
      flags[index] === '--idle' &&
      /^\d+$/.test(flags[index + 1] ?? '')
    ) {
      idleMinutes = Number(flags[(index += 1)]);
    } else {
      throw new Error(
        'Usage: pnpm run device:stack gc [--dry-run] [--idle <minutes>]'
      );
    }
  }

  await hook('beforeGc', { registry: REGISTRY });
  // A dry run reads the registry, replaced whole, without the lock and changes nothing.
  const decisions = dryRun
    ? await reap(readRegistry(), { idleMinutes, dryRun })
    : await withRegistry(registry => reap(registry, { idleMinutes }));

  process.stdout.write(`${JSON.stringify({ dryRun, decisions }, null, 2)}\n`);
}

function list() {
  const registry = readRegistry();
  const slots = Array.from({ length: MAX_LIMIT }, (_, slot) => {
    const lease = registry.leases.find(entry => entry.slot === slot);

    if (!lease) {
      return { slot, ...slotPorts(slot), free: true };
    }

    const {
      id,
      root,
      serial,
      consolePort,
      adbPort,
      metroPort,
      acquiredAt,
      usedAt
    } = lease;

    return {
      slot,
      consolePort,
      adbPort,
      metroPort,
      lease: id,
      root,
      serial,
      acquiredAt,
      usedAt: usedAt ?? null,
      operation: operationEvidence(lease),
      processes: recordedProcesses(lease)
    };
  });

  process.stdout.write(
    `${JSON.stringify({ limit: emulatorLimit(), slots }, null, 2)}\n`
  );
}

// Frees the slot; only the lease's own operation may.
const releaseLease = id =>
  withRegistry(registry => {
    const lease = findLease(registry, id);

    if (!lease || !ownOperation(lease)) {
      throw leaseLost(id);
    }

    registry.leases = registry.leases.filter(entry => entry !== lease);
    writeRegistry(registry);
  });

// A signal, install, data clear or kill re-reads its lease and the resource's evidence under
// the registry lock and acts before releasing it, so the slot cannot be reclaimed or
// reassigned between that check and the action. Returns false, without acting, when the
// evidence fails.
async function guarded(state, action, evidence, act) {
  await hook('beforeGuard', {
    action,
    lease: state.lease?.id,
    registry: REGISTRY
  });

  return withRegistry(async registry => {
    if (state.lease) {
      const lease = findLease(registry, state.lease.id);

      if (!lease || !ownOperation(lease)) {
        throw leaseLost(state.lease.id);
      }
    }

    if (!evidence()) {
      return false;
    }

    await hook('ownershipChecked', { action, lock: REGISTRY_LOCK });
    act();

    return true;
  });
}

const leaseToken = serial =>
  tryAdb(serial, 'shell', 'getprop', LEASE_PROP).trim();

// The emulator this lease launched: its process, the AVD its console reports and, for a
// leased instance, the device lease token.
const emulatorOwned = state =>
  isSameProcess(state.emulator?.process) &&
  avdName(state.emulator.serial) === HARNESS_AVD &&
  (!state.lease || leaseToken(state.emulator.serial) === state.lease.id);

// An instance whose start died before it set the token: its process, with the lease's argv
// marker, still passes its identity check and no other lease's token is on the device.
const untokenedEmulator = state =>
  Boolean(state.lease) &&
  isSameProcess(state.emulator?.process) &&
  leaseToken(state.emulator.serial) === '';

async function onOwnedEmulator(state, action, act) {
  if (!(await guarded(state, action, () => emulatorOwned(state), act))) {
    throw new Error(
      `${state.emulator.serial} no longer passes its identity check, so ${action} did not run.`
    );
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
async function installDevBuild(state, apk) {
  const { serial } = state.emulator;

  state.devBuild.foundInstalled = Boolean(
    tryAdb(serial, 'shell', 'pm', 'path', PACKAGE).trim()
  );
  const path = tryAdb(serial, 'shell', 'pm', 'path', PACKAGE).match(
    /^package:(\S*base\.apk)\s*$/m
  )?.[1];
  const installed =
    path && tryAdb(serial, 'shell', 'sha256sum', path).trim().split(/\s+/)[0];

  if (installed === fileHash(apk)) {
    return false;
  }

  log(`installing ${apk} on ${serial}`);
  await onOwnedEmulator(state, 'install', () =>
    adb(serial, 'install', '-r', '-d', apk)
  );

  return true;
}

async function bootEmulator(state) {
  // The serial is fixed by the slot's console port before boot, so no other device is ever
  // listed or called to find it.
  const { consolePort, serial, id } = state.lease;
  // A read-only instance of the template, so leases never share writable data and each
  // starts with fresh app data.
  const marker = `${LEASE_PROP}=${id}`;
  const args = [
    '-avd',
    HARNESS_AVD,
    '-port',
    String(consolePort),
    '-read-only',
    '-snapshot',
    TEMPLATE_SNAPSHOT,
    '-no-snapshot-save',
    '-no-boot-anim',
    ...GPU_ARGS,
    '-prop',
    marker
  ];

  log(`booting a read-only ${HARNESS_AVD} instance as ${serial}`);
  const pid = startDetached('emulator', args, join(DIR, 'emulator.log'));

  state.emulator = {
    serial,
    avd: HARNESS_AVD,
    started: true,
    process: processIdentity(pid, [
      '-avd',
      HARNESS_AVD,
      '-port',
      String(consolePort),
      marker
    ])
  };
  saveState(state);
  await recordProcess(state, 'emulator');
  await hook('emulatorSpawned', { lease: state.lease.id, registry: REGISTRY });
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

  // The device lease token, checked before any install, data clear or kill.
  adb(serial, 'shell', 'setprop', LEASE_PROP, id);

  await waitFor(
    'the emulator to finish booting',
    BOOT_TIMEOUT_MS,
    () =>
      tryAdb(serial, 'shell', 'getprop', 'sys.boot_completed').trim() === '1'
  );
  // A snapshot boot reports boot completed before its network is up, and the dev client
  // gives up on a host it cannot reach.
  await waitFor('the emulator network to reach the host', BOOT_TIMEOUT_MS, () =>
    tryAdb(serial, 'shell', 'ping', '-c', '1', '-W', '1', '10.0.2.2').includes(
      ' 0% packet loss'
    )
  );

  return serial;
}

function listeningPids(port) {
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

async function metroManifest(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
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

async function metroRunning(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/status`, {
      signal: AbortSignal.timeout(5_000)
    });

    return (await response.text()).includes('packager-status:running');
  } catch {
    return false;
  }
}

// Ready only when /status answers, the listener is in the process group this lease started
// and runs in this worktree, and it serves this project, so a foreign server on the port can
// never stand in for this lease's Metro.
async function ownMetroReady(pid, port) {
  const listeners = listeningPids(port);

  if (!listeners.length || !(await metroRunning(port))) {
    return false;
  }

  const own = listeners.find(listener => processGroup(listener) === pid);

  if (!own) {
    throw new Error(
      `Port ${port} answers as Metro from pid ${listeners.join(', ')}, not the Metro this lease started (pid ${pid}).`
    );
  }

  const manifest = await metroManifest(port);
  const cwd = workingDirectory(own);

  if (
    manifest?.slug !== expo.slug ||
    manifest?.name !== expo.name ||
    cwd !== ROOT
  ) {
    throw new Error(
      `The Metro on port ${port} serves ${JSON.stringify(manifest?.slug ?? null)} from ${cwd}, not this worktree's project.`
    );
  }

  return true;
}

// Each lease runs its own Metro, with a fresh log, on its slot's Metro port.
async function startMetro(state) {
  const { port } = state;
  const metroLog = join(DIR, 'metro.log');

  log(`starting Metro on port ${port}`);
  // Without CI, so reloads stay on.
  const env = { ...process.env };

  delete env.CI;
  const args = [
    'exec',
    'expo',
    'start',
    '--dev-client',
    '--port',
    String(port)
  ];

  writeFileSync(metroLog, '');
  const pid = startDetached('pnpm', args, metroLog, env);

  state.metro = {
    pid,
    started: true,
    log: metroLog,
    process: processIdentity(pid, args)
  };
  saveState(state);
  await recordProcess(state, 'metro');

  return waitFor('Metro to start', METRO_TIMEOUT_MS, () =>
    ownMetroReady(pid, port)
  );
}

// A bundling error in this lease's Metro log or a redbox on screen fails start at once.
function failOnAppError(state, snapshot) {
  const output = readFileSync(state.metro.log, 'utf8').replace(
    /\x1b\[[\d;]*m/g,
    ''
  );
  const redbox = REDBOX_TITLES.find(title => snapshot.includes(title));

  if (!redbox && !output.includes('Bundling failed')) {
    return;
  }

  const tail = output.trimEnd().split('\n').slice(-METRO_TAIL_LINES).join('\n');

  throw new Error(
    `${redbox ? `The app shows a redbox (${redbox})` : 'Metro failed to bundle the app'}; last lines of ${state.metro.log}:\n${tail}`
  );
}

// One start or stop runs per worktree at a time.
async function underOperationLock(operation) {
  mkdirSync(DIR, { recursive: true });
  const generation = await acquireLock(
    OPERATION_LOCK,
    'operation lock of this worktree'
  );

  try {
    return await operation();
  } finally {
    releaseLock(OPERATION_LOCK, generation);
  }
}

const start = options => underOperationLock(() => startLease(options));

// A lease no operation holds, whose start finished and whose processes all still run.
const leaseReady = (state, held) =>
  Boolean(held) &&
  !held.operation &&
  Boolean(state.running) &&
  Object.values(observe(state)).every(value => value === 'running');

async function startLease({ fresh, noBuild }) {
  const recorded = readState();

  if (recorded && !recorded.lease) {
    throw new Error(
      'A device stack is already recorded; run `pnpm run device:stack stop` first.'
    );
  }

  const held = recorded && findLease(readRegistry(), recorded.lease.id);

  if (leaseReady(recorded, held)) {
    if (fresh) {
      await freshen(recorded);
    }

    process.stdout.write(`${JSON.stringify(recorded, null, 2)}\n`);

    return;
  }

  let lease;

  if (held) {
    // A start that failed or died left this lease part-way: stop what it left, then start
    // again on the same lease.
    lease = await claimOperation(held.id, 'repair');
    activeLease = lease.id;
    log(`repairing lease ${lease.id}`);
    const { stopped } = await stopComponents(recorded);

    if (stopped.includes('emulator')) {
      await waitFor(
        'the previous emulator to exit',
        BOOT_TIMEOUT_MS,
        () => !isSameProcess(recorded.emulator.process)
      );
    }
  } else {
    if (recorded?.lease.slot !== undefined) {
      throw leaseLost(recorded.lease.id);
    }

    const id = randomUUID();

    // The pointer precedes the registry record, so a start killed between them leaves no
    // lease this worktree cannot find.
    saveState({ lease: { id } });

    try {
      lease = await acquireLease(id);
      await hook('leaseAcquired', { lease: id });
    } catch (error) {
      rmSync(STATE, { force: true });

      throw error;
    }

    activeLease = id;
  }

  const { id, slot, serial, consolePort, adbPort, metroPort } = lease;
  const state = {
    lease: { id, slot, serial, consolePort, adbPort, metroPort },
    root: ROOT,
    port: metroPort,
    package: PACKAGE,
    fresh
  };

  saveState(state);

  try {
    await bringUp(state, { noBuild });
  } catch (error) {
    // Nothing of this lease runs yet, so the slot is freed at once.
    if (
      !state.emulator &&
      !state.metro &&
      !error.message.startsWith('LEASE_LOST')
    ) {
      await releaseLease(id);
      rmSync(STATE, { force: true });
    }

    throw error;
  }
}

async function bringUp(state, { noBuild }) {
  const { key } = await devBuildKey();
  // A miss starts the build now, so it runs while the emulator boots.
  const { done, ...devBuildState } = devBuild(key, { noBuild });

  state.devBuild = devBuildState;
  saveState(state);

  const template = readJson(TEMPLATE);

  if (!listAvds().includes(HARNESS_AVD) || !template) {
    throw new Error(
      `The harness emulator ${HARNESS_AVD} or its template snapshot does not exist. Create them with \`pnpm run device:stack template\`, then rerun.`
    );
  }

  state.lease.templateVersion = template.version;
  await updateLease(state.lease.id, lease => {
    lease.templateVersion = template.version;
  });
  saveState(state);
  // Metro starts while the emulator boots.
  const metroReady = startMetro(state);
  const [serial] = await Promise.all([bootEmulator(state), metroReady]);

  state.devBuild.apk = await done;
  state.devBuild.installed = await installDevBuild(state, state.devBuild.apk);
  saveState(state);

  // A fresh JS log per lease: JS output and native crashes from `start` onward.
  const jsLog = join(DIR, 'js.log');
  const logArgs = ['-s', serial, 'logcat', '-T', '1', '-s', ...JS_LOG_FILTER];

  writeFileSync(jsLog, '');
  const logPid = startDetached('adb', logArgs, jsLog);

  state.jsLogs = {
    pid: logPid,
    started: true,
    log: jsLog,
    process: processIdentity(logPid, logArgs)
  };
  saveState(state);
  await recordProcess(state, 'jsLogs');

  await openApp(state);
  await finishOperation(state);
  state.startScreen = true;
  state.running = true;
  saveState(state);
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
}

const finishOperation = state =>
  updateLease(state.lease.id, lease => {
    if (!ownOperation(lease)) {
      throw leaseLost(lease.id);
    }

    lease.operation = null;
    lease.usedAt = new Date().toISOString();
  });

// The registry keeps the identity of every process a lease spawned, so `gc` can verify and
// stop it after the worktree and its state are gone.
const recordProcess = (state, name) =>
  updateLease(state.lease.id, lease => {
    lease.processes = { ...lease.processes, [name]: state[name].process };
  });

// Opens the app on the lease's Metro through the dev-client link, dismisses the dev-client
// onboarding a fresh install shows, and waits for the Workout start screen.
async function openApp(state) {
  const { serial } = state.emulator;

  log('opening the app on the bundle');
  // One agent-device session per lease.
  state.session ??= `liftlog-${state.lease.id}`;
  saveState(state);
  const { session } = state;
  const device = (...args) => {
    assertLease();

    return run('agent-device', [
      ...args,
      '--serial',
      serial,
      '--session',
      session
    ]);
  };

  const tryDevice = (...args) => {
    assertLease();

    return tryRun('agent-device', [
      ...args,
      '--serial',
      serial,
      '--session',
      session
    ]);
  };

  device(
    'open',
    PACKAGE,
    devClientLink(state.port),
    '--relaunch',
    '--metro-port',
    String(state.port)
  );
  let onboarded = false;

  await waitFor('the Workout start screen', OPEN_TIMEOUT_MS, () => {
    const snapshot = tryDevice('snapshot', '--raw', '--timeout', '5000');

    failOnAppError(state, snapshot);

    if (!onboarded && snapshot.includes('This is the developer menu.')) {
      log('dev-client onboarding appeared; pressing Continue and Close');
      device('press', 'label="Continue"', '--settle');
      device('press', 'label="Close"');
      onboarded = true;

      return false;
    }

    return snapshot.includes(START_SCREEN_ID);
  });
}

// `start --fresh` on a running lease clears its app data and opens the app again.
async function freshen(state) {
  await claimOperation(state.lease.id, 'repair');
  activeLease = state.lease.id;
  log(`clearing app data for ${PACKAGE}`);
  await onOwnedEmulator(state, 'clear data', () =>
    adb(state.emulator.serial, 'shell', 'pm', 'clear', PACKAGE)
  );
  await openApp(state);
  await finishOperation(state);
}

// `motion on|off` sets the animation scales on the lease's emulator and reopens the app on its
// Metro: Reanimated reads a scale of 0 as reduced motion and reads it again only on restart.
async function motion(args) {
  const [mode] = args;

  if (args.length !== 1 || !['on', 'off'].includes(mode)) {
    throw new Error('Usage: pnpm run device:stack motion on|off');
  }

  const state = await readyState();
  const value = mode === 'on' ? '1' : '0';

  await claimOperation(state.lease.id, 'motion');
  activeLease = state.lease.id;
  log(`setting the animation scales to ${value}`);
  await onOwnedEmulator(state, 'set animation scales', () => {
    for (const scale of ANIMATION_SCALES) {
      adb(
        state.emulator.serial,
        'shell',
        'settings',
        'put',
        'global',
        scale,
        value
      );
    }
  });
  await openApp(state);
  await finishOperation(state);
}

// `capture-press <label>` screenshots the one control with that accessibility label at rest
// and while held, before the long press fires, and measures its width in both with
// ImageMagick. The hold is shorter than the 500 ms long press and the screen is captured
// after the press-in animation ends.
const PRESS_HOLD_MS = 300;
const PRESS_CAPTURE_S = '0.22';
const DEVICE_SCREENSHOT = '/data/local/tmp/liftlog-capture-press.png';

async function capturePress(args) {
  const [label] = args;

  if (args.length !== 1 || !label || label.startsWith('-')) {
    throw new Error('Usage: pnpm run device:stack capture-press <label>');
  }

  const magick = findOnPath('magick');

  if (!magick) {
    throw new Error(
      'capture-press measures widths with ImageMagick; install it (`brew install imagemagick`) so `magick` is on PATH.'
    );
  }

  const state = await readyState();
  const { serial } = state.lease;
  const snapshot = run('agent-device', [
    'snapshot',
    '-i',
    '--json',
    '--platform',
    'android',
    '--serial',
    serial,
    '--session',
    state.session
  ]);
  // A control is a hittable node; the text inside a button repeats its label but is not one.
  const matches = JSON.parse(snapshot).data.nodes.filter(
    node => node.hittable === true && node.label === label
  );

  if (matches.length !== 1) {
    throw refused(
      `capture-press needs exactly one control labeled ${JSON.stringify(label)}, and the snapshot has ${matches.length}`
    );
  }

  const { x, y, width, height } = matches[0].rect;
  const centerX = Math.round(x + width / 2);
  const centerY = Math.round(y + height / 2);
  const name = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 48);
  const stamp = Date.now();
  const paths = {
    rest: join(SCREENSHOTS, `press-${name}-${stamp}-rest.png`),
    pressed: join(SCREENSHOTS, `press-${name}-${stamp}-pressed.png`)
  };

  mkdirSync(SCREENSHOTS, { recursive: true });
  const capture = (shell, path) => {
    run('adb', ['-s', serial, 'shell', shell]);
    run('adb', ['-s', serial, 'pull', DEVICE_SCREENSHOT, path]);
  };

  capture(`screencap -p ${DEVICE_SCREENSHOT}`, paths.rest);
  capture(
    `input swipe ${centerX} ${centerY} ${centerX} ${centerY} ${PRESS_HOLD_MS} & sleep ${PRESS_CAPTURE_S}; screencap -p ${DEVICE_SCREENSHOT}; wait`,
    paths.pressed
  );
  // The control's rect cropped and trimmed of its background: the width of what it draws.
  const measure = path =>
    Number(
      run(magick, [
        path,
        '-crop',
        `${Math.round(width)}x${Math.round(height)}+${Math.round(x)}+${Math.round(y)}`,
        '+repage',
        '-fuzz',
        '6%',
        '-trim',
        '-format',
        '%w',
        'info:'
      ]).trim()
    );
  const restWidth = measure(paths.rest);
  const pressedWidth = measure(paths.pressed);

  process.stdout.write(
    `${JSON.stringify(
      {
        label,
        rest: paths.rest,
        pressed: paths.pressed,
        restWidth,
        pressedWidth,
        ratio: Number((pressedWidth / restWidth).toFixed(3))
      },
      null,
      2
    )}\n`
  );
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
    nothingRunning();

    return;
  }

  const observed = observe(state);
  const held =
    !state.lease || Boolean(findLease(readRegistry(), state.lease.id));
  const running =
    Boolean(state.running) &&
    held &&
    Object.values(observed).every(value => value === 'running');

  process.stdout.write(
    `${JSON.stringify({ ...state, running, observed, ...(!held && { leaseLost: true }) }, null, 2)}\n`
  );
}

// Stops what `start` started and still passes its identity check; anything else is reported
// untrusted and left running.
async function stopComponents(state) {
  const stopped = [];
  const untrusted = [];
  const serial = state.emulator?.serial;

  if (state.session && serial) {
    assertLease();
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

    const signalled = await guarded(
      state,
      `signal ${name}`,
      () => isSameProcess(state[name].process),
      () => stopGroup(state[name].pid)
    );

    (signalled ? stopped : untrusted).push(name);
  }

  if (state.emulator?.started) {
    const killed =
      (await guarded(
        state,
        'kill emulator',
        () => emulatorOwned(state),
        () => tryAdb(serial, 'emu', 'kill')
      )) ||
      (await guarded(
        state,
        'signal emulator',
        () => untokenedEmulator(state),
        () => stopGroup(state.emulator.process.pid)
      ));

    (killed ? stopped : untrusted).push('emulator');
  }

  return { stopped, untrusted };
}

const nothingRunning = () =>
  process.stdout.write(
    `${JSON.stringify({ running: false, message: 'Nothing is running.' }, null, 2)}\n`
  );

async function stop() {
  if (!readState()) {
    nothingRunning();

    return;
  }

  await underOperationLock(async () => {
    const state = readState();

    if (!state) {
      nothingRunning();

      return;
    }

    if (state.lease) {
      const held = findLease(readRegistry(), state.lease.id);

      if (!held) {
        rmSync(STATE);

        // A pointer without a slot is an acquisition that never committed.
        if (state.lease.slot === undefined) {
          nothingRunning();

          return;
        }

        throw leaseLost(state.lease.id, "this worktree's record was cleared");
      }

      await claimOperation(held.id, 'release');
      activeLease = held.id;
    }

    const { stopped, untrusted } = await stopComponents(state);

    // Release frees the slot only after the lease's processes are stopped.
    if (state.lease) {
      await releaseLease(state.lease.id);
    }

    rmSync(STATE);
    process.stdout.write(
      `${JSON.stringify({ running: false, stopped, ...(untrusted.length && { untrusted }) }, null, 2)}\n`
    );
  });
}

// `device <command> [args]` runs agent-device on this worktree's lease and nothing else. It
// guards host agents against accidental misuse; it is not a security boundary
// (docs/adr/0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md).
const DEVICE_COMMANDS = new Set([
  'alert',
  'appstate',
  'back',
  'cdp',
  'click',
  'clipboard',
  'close',
  'diff',
  'fill',
  'find',
  'focus',
  'gesture',
  'get',
  'home',
  'is',
  'keyboard',
  'longpress',
  'metro',
  'open',
  'orientation',
  'press',
  'react-devtools',
  'react-native',
  'record',
  'screenshot',
  'scroll',
  'settings',
  'snapshot',
  'swipe',
  'type',
  'wait'
]);
// Every spelling of the agent-device flags that select a device, app, session, Metro,
// config, daemon or remote endpoint; the wrapper passes the lease's own.
const TARGETING_FLAGS = [
  '--platform',
  '--target',
  '--device',
  '--udid',
  '--serial',
  '--ios-simulator-device-set',
  '--android-device-allowlist',
  '--app',
  '--target-app',
  '--activity',
  '--launch-args',
  '--session',
  '--session-lock',
  '--session-isolation',
  '--metro-host',
  '--metro-port',
  '--bundle-url',
  '--launch-url',
  '--url',
  '--config',
  '--remote-config',
  '--state-dir',
  '--daemon-base-url',
  '--daemon-auth-token',
  '--daemon-transport',
  '--daemon-server-mode',
  '--remote',
  '--tenant',
  '--run-id',
  '--lease-id',
  '--lease-backend',
  '--provider',
  '--provider-session',
  '--header'
];
// The only flags `open` takes beside its targets.
const OPEN_FLAGS = [
  '--relaunch',
  '--foreground',
  '--no-record',
  '--test-ime',
  '--no-test-ime',
  '--json',
  '--cost',
  '--debug',
  '--verbose',
  '-v'
];
const OPEN_VALUE_FLAGS = ['--timeout', '--wait', '--level'];

const refused = reason => new Error(`REFUSED: ${reason}; nothing was run.`);
const spells = (arg, flag) => arg === flag || arg.startsWith(`${flag}=`);

// `open` targets the app package or app links; a dev-client link would pick another Metro.
function checkOpen(args) {
  const targets = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (OPEN_VALUE_FLAGS.includes(arg)) {
      index += 1;
    } else if (
      !OPEN_FLAGS.includes(arg) &&
      !OPEN_VALUE_FLAGS.some(flag => arg.startsWith(`${flag}=`))
    ) {
      if (arg.startsWith('-')) {
        throw refused(`open does not take ${arg}`);
      }

      targets.push(arg);
    }
  }

  const appLink = target => {
    const lower = target.toLowerCase();

    return (
      lower.startsWith(`${expo.scheme}://`) &&
      !lower.startsWith(`${expo.scheme}://expo-development-client`)
    );
  };

  const valid =
    targets.length > 0 &&
    targets.length <= 2 &&
    (targets[0] === PACKAGE || appLink(targets[0])) &&
    targets.slice(1).every(appLink);

  if (!valid) {
    throw refused(
      `open takes ${PACKAGE} and ${expo.scheme}:// app links only, not ${JSON.stringify(targets)}`
    );
  }
}

function checkDeviceCommand(command, args) {
  if (!DEVICE_COMMANDS.has(command)) {
    throw refused(
      `${command ? `\`${command}\`` : 'no command'} is not a lease command; the allowed commands are ${[...DEVICE_COMMANDS].join(', ')}`
    );
  }

  for (const arg of args) {
    if (arg === '--') {
      throw refused('`--` is not accepted');
    }

    const flag = TARGETING_FLAGS.find(name => spells(arg, name));

    if (flag) {
      throw refused(`${flag} selects a target, and the lease sets its own`);
    }
  }

  if (command === 'close' && args.some(arg => spells(arg, '--shutdown'))) {
    throw refused(
      'close --shutdown stops the emulator; run `pnpm run device:stack stop`'
    );
  }

  if (command === 'metro' && args[0] !== 'reload') {
    throw refused('metro takes only reload');
  }

  if (command === 'open') {
    checkOpen(args);
  }
}

// The ready lease of this worktree, marked as just used for `gc --idle`.
async function readyState() {
  const state = readState();
  const held = state?.lease && findLease(readRegistry(), state.lease.id);

  if (!state?.session || !leaseReady(state, held)) {
    throw new Error(
      'NO_LEASE: this worktree has no ready lease; run `pnpm run device:stack start` first.'
    );
  }

  await updateLease(state.lease.id, lease => {
    lease.usedAt = new Date().toISOString();
  });

  return state;
}

async function device(command, args) {
  checkDeviceCommand(command, args);
  const state = await readyState();

  // An explicit empty config, so neither the user nor the project config applies.
  const config = join(DIR, 'agent-device.json');

  writeFileSync(config, '{}\n');
  const cdpTarget =
    command === 'cdp' &&
    args[0] === 'target' &&
    ['list', 'select'].includes(args[1]);
  const metro =
    command === 'open' || command === 'metro'
      ? ['--metro-port', String(state.port)]
      : cdpTarget
        ? ['--url', `http://127.0.0.1:${state.port}`]
        : [];
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !name.startsWith('AGENT_DEVICE_')
    )
  );
  // Lease flags precede the command: cdp passes every argument after it to its helper.
  const { status, error } = spawnSync(
    'agent-device',
    [
      '--platform',
      'android',
      '--serial',
      state.lease.serial,
      '--session',
      state.session,
      '--config',
      config,
      command,
      ...args,
      ...metro
    ],
    { stdio: 'inherit', env }
  );

  if (error) {
    throw error;
  }

  process.exitCode = status ?? 1;
}

// `open <path>` opens a liftlog:// deep link on the lease's emulator, waits for its activity
// and spaces consecutive links by OPEN_INTERVAL_MS. The adb shell runs the command through
// the device shell, so the link is single-quoted and a path with a quote or space refused.
const LAST_OPEN = join(DIR, 'last-open');

async function openLink(args) {
  const [path] = args;

  if (
    args.length !== 1 ||
    /[\s'\\]/.test(path) ||
    /^[a-z][a-z0-9+.-]*:/i.test(path) ||
    path.replace(/^\/+/, '').startsWith('expo-development-client')
  ) {
    throw refused(
      `open takes a route map path such as workout/active, not ${JSON.stringify(path ?? '')}`
    );
  }

  const state = await readyState();
  const link = `${expo.scheme}:///${path.replace(/^\/+/, '')}`;
  const last = Number(existsSync(LAST_OPEN) && readFileSync(LAST_OPEN, 'utf8'));
  const wait = last + OPEN_INTERVAL_MS - Date.now();

  if (wait > 0) {
    await sleep(wait);
  }

  const output = run('adb', [
    '-s',
    state.lease.serial,
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    `'${link}'`,
    PACKAGE
  ]);

  // The next link waits from the moment this one finished opening.
  writeFileSync(LAST_OPEN, String(Date.now()));

  if (/^Error/m.test(output)) {
    throw new Error(`opening ${link} failed: ${output.trim()}`);
  }

  log(`opened ${link}`);
}

// `adb <subcommand> [args]` runs adb on the lease's serial for reading the device only. It is
// host-only and, like `device`, guards against misuse rather than being a security boundary.
const ADB_COMMANDS = ['shell', 'exec-out', 'pull'];
// Device commands that change what the lease is, run through shell or exec-out.
const REFUSED_SHELL = [
  /^reboot\b/,
  /^su\b/,
  /^setprop\b/,
  /^svc\s+power\b/,
  /^(pm|cmd\s+package)\s+(install|uninstall)/
];

function checkAdb(args) {
  const [subcommand, ...rest] = args;

  if (!ADB_COMMANDS.includes(subcommand)) {
    throw refused(
      `adb ${subcommand ?? ''} is not allowed; the allowed subcommands are ${ADB_COMMANDS.join(', ')}, and the lease selects the device`
    );
  }

  if (subcommand === 'pull') {
    return;
  }

  const shellCommands = rest
    .join(' ')
    .split(/;|&&|\|\||\||&|\n/)
    .map(part => part.trim());
  const blocked = shellCommands.find(part =>
    REFUSED_SHELL.some(pattern => pattern.test(part))
  );

  if (blocked) {
    throw refused(`adb ${subcommand} ${blocked} changes the lease's device`);
  }
}

async function adbCommand(args) {
  checkAdb(args);
  const state = await readyState();
  const { status, error } = spawnSync(
    'adb',
    ['-s', state.lease.serial, ...args],
    { stdio: 'inherit' }
  );

  if (error) {
    throw error;
  }

  process.exitCode = status ?? 1;
}

// `sql "<query>"` pulls the app database, its WAL and shared-memory file from the lease's
// emulator into .device-stack/db/ and runs the query read-only there. It is host-only, like
// `adb`. Only the files present are pulled: the app may have checkpointed the WAL away.
const DB_FILES = ['workout.db', 'workout.db-wal', 'workout.db-shm'];

async function sql(args) {
  if (args.length !== 1 || !args[0].trim()) {
    throw new Error('Usage: pnpm run device:stack sql "<query>"');
  }

  const state = await readyState();
  const { serial } = state.lease;
  const present = adb(
    serial,
    'shell',
    'run-as',
    PACKAGE,
    'ls',
    'files/SQLite'
  ).split(/\s+/);
  const dir = join(DIR, 'db');

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  for (const file of DB_FILES.filter(name => present.includes(name))) {
    assertLease();
    writeFileSync(
      join(dir, file),
      execFileSync(
        'adb',
        [
          '-s',
          serial,
          'exec-out',
          'run-as',
          PACKAGE,
          'cat',
          `files/SQLite/${file}`
        ],
        { maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'pipe'] }
      )
    );
  }

  if (!existsSync(join(dir, DB_FILES[0]))) {
    throw new Error(
      `the lease's app has no ${DB_FILES[0]} yet; open the app and retry.`
    );
  }

  const { status, error } = spawnSync(
    'sqlite3',
    ['-readonly', join(dir, DB_FILES[0]), args[0]],
    { stdio: 'inherit' }
  );

  if (error) {
    throw error;
  }

  process.exitCode = status ?? 1;
}

// `logs [js|metro] [--lines N] [--grep re]` prints the last N matching lines of a lease log.
function logs(args) {
  let name = 'js';
  let lines = DEFAULT_LOG_LINES;
  let grep = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === 'js' || arg === 'metro') {
      name = arg;
    } else if (arg === '--lines') {
      lines = Number(args[(index += 1)]);
    } else if (arg === '--grep') {
      grep = new RegExp(args[(index += 1)] ?? '');
    } else {
      throw new Error(
        'Usage: pnpm run device:stack logs [js|metro] [--lines N] [--grep re]'
      );
    }
  }

  if (!Number.isInteger(lines) || lines < 1 || lines > MAX_LOG_LINES) {
    throw new Error(`--lines takes a whole number from 1 to ${MAX_LOG_LINES}.`);
  }

  const state = readState();
  const path = state?.[name === 'js' ? 'jsLogs' : 'metro']?.log;

  if (!state?.lease || !path) {
    throw new Error(
      'NO_LEASE: this worktree has no lease logs; run `pnpm run device:stack start` first.'
    );
  }

  const matching = (existsSync(path) ? readFileSync(path, 'utf8') : '')
    .split('\n')
    .filter(Boolean)
    .filter(line => !grep || grep.test(line));

  for (const line of matching.slice(-lines)) {
    process.stdout.write(`${line}\n`);
  }
}

// docs/adr/0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md: `broker` serves
// one lease to the sandbox the host config names. The lease credential and the broker port
// reach the sandbox only through this file; the broker records its own identity in it too.
const BROKER = join(DIR, 'broker.json');
const MAX_REQUEST_BYTES = 16_384;
// Per-command argument patterns. No pattern admits a leading `-`, so no argument is a flag.
const REF = /^@e\d{1,5}$/;
const ROUTE =
  /^[a-z][a-z0-9-]*(\/[A-Za-z0-9_-]+)*(\?[A-Za-z]+=[A-Za-z0-9_-]+)?$/;
const TEXT = /^[\p{L}\p{N}][\p{L}\p{N} .,:!?'()+-]{0,99}$/u;
const SCREENSHOT_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SCREENSHOTS = join(DIR, 'screenshots');
// Every broker command and the fixed device:stack argv it runs; `min` is the number of
// required arguments when some are optional.
const BROKER_COMMANDS = {
  start: { args: [], argv: () => ['start'] },
  fresh: { args: [], argv: () => ['start', '--fresh'] },
  stop: { args: [], argv: () => ['stop'] },
  status: { args: [], argv: () => ['status'] },
  logs: {
    args: [/^(js|metro)$/, /^[1-9]\d{0,2}$/],
    min: 0,
    argv: ([name = 'js', lines = String(DEFAULT_LOG_LINES)]) => [
      'logs',
      name,
      '--lines',
      lines
    ]
  },
  open: { args: [ROUTE], argv: ([path]) => ['open', path] },
  snapshot: { args: [], argv: () => ['device', 'snapshot', '-i'] },
  press: { args: [REF], argv: ([ref]) => ['device', 'press', ref] },
  longpress: { args: [REF], argv: ([ref]) => ['device', 'longpress', ref] },
  fill: {
    args: [REF, TEXT],
    argv: ([ref, text]) => ['device', 'fill', ref, text]
  },
  type: { args: [TEXT], argv: ([text]) => ['device', 'type', text] },
  wait: { args: [TEXT], argv: ([text]) => ['device', 'wait', 'text', text] },
  back: { args: [], argv: () => ['device', 'back'] },
  scroll: {
    args: [/^(up|down|left|right)$/],
    argv: ([direction]) => ['device', 'scroll', direction]
  },
  'metro-reload': { args: [], argv: () => ['device', 'metro', 'reload'] },
  motion: { args: [/^(on|off)$/], argv: ([mode]) => ['motion', mode] },
  screenshot: {
    args: [SCREENSHOT_NAME],
    argv: ([name]) => ['device', 'screenshot', join(SCREENSHOTS, `${name}.png`)]
  }
};

// The device:stack argv for a broker request, or a refusal. A request names a command and
// arguments only; the lease, serial, session, Metro and every path come from the broker.
function brokerArgv(command, args) {
  const spec = Object.hasOwn(BROKER_COMMANDS, command)
    ? BROKER_COMMANDS[command]
    : null;

  if (!spec) {
    throw refused(
      `${JSON.stringify(command)} is not a broker command; the broker commands are ${Object.keys(BROKER_COMMANDS).join(', ')}`
    );
  }

  if (
    !Array.isArray(args) ||
    args.length < (spec.min ?? spec.args.length) ||
    args.length > spec.args.length
  ) {
    throw refused(
      `${command} takes ${spec.args.length} argument${spec.args.length === 1 ? '' : 's'}`
    );
  }

  args.forEach((arg, index) => {
    if (typeof arg !== 'string' || arg.startsWith('-')) {
      throw refused(`${JSON.stringify(arg)} is a flag or not a string`);
    }

    if (/emulator-\d+/.test(arg)) {
      throw refused(`${JSON.stringify(arg)} names a serial`);
    }

    if (/^[/~]|\.\.|\\/.test(arg)) {
      throw refused(`${JSON.stringify(arg)} names a path`);
    }

    if (!spec.args[index].test(arg)) {
      throw refused(
        `${JSON.stringify(arg)} does not match ${spec.args[index]} for ${command}`
      );
    }
  });

  return spec.argv(args);
}

// Runs device:stack in this checkout as a child, so each request gets the CLI's own checks,
// locks and exit code.
function runScript(argv) {
  return new Promise(done => {
    const child = spawn(process.execPath, [SCRIPT, ...argv], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('close', status => done({ status: status ?? 1, stdout, stderr }));
  });
}

function hostSandbox() {
  const sandbox = readJson(HOST_CONFIG)?.sandbox;

  if (typeof sandbox !== 'string' || !/^[A-Za-z0-9][\w.-]*$/.test(sandbox)) {
    throw new Error(
      `NO_SANDBOX: ${HOST_CONFIG} must name the sandbox the broker serves, as "sandbox": "<name>".`
    );
  }

  return sandbox;
}

const allowRule = (sandbox, port) => [
  'policy',
  'allow',
  'network',
  '--no-input',
  '--sandbox',
  sandbox,
  `localhost:${port}`
];
const removeRule = (sandbox, port) => [
  'policy',
  'rm',
  'network',
  '--no-input',
  // Without a terminal, rm refuses to remove a rule unless forced.
  '--force',
  '--sandbox',
  sandbox,
  '--resource',
  `localhost:${port}`
];

async function broker() {
  const sandbox = hostSandbox();
  const commonDir = tryRun('git', [
    'rev-parse',
    '--path-format=absolute',
    '--git-common-dir'
  ]).trim();

  if (realOrSame(commonDir) !== join(ROOT, '.git')) {
    throw new Error(
      `NOT_MAIN_CHECKOUT: run the broker from the main checkout, the workspace of sandbox ${sandbox}.`
    );
  }

  const previous = readJson(BROKER);

  if (previous && isSameProcess(previous.process)) {
    throw new Error(
      `BROKER_RUNNING: pid ${previous.process.pid} already runs this checkout's lease broker.`
    );
  }

  if (previous) {
    // A broker that died left its credential and maybe its policy rule.
    tryRun('sbx', removeRule(previous.sandbox, previous.port));
    rmSync(BROKER, { force: true });
  }

  const started = spawnSync(process.execPath, [SCRIPT, 'start'], {
    cwd: ROOT,
    stdio: 'inherit'
  });

  if (started.status !== 0) {
    throw new Error('the lease did not start, so no broker runs.');
  }

  const { id, slot } = readState().lease;
  const port = brokerPorts()[slot];
  const credential = randomBytes(32).toString('hex');
  const digest = value => createHash('sha256').update(value).digest();
  const expected = digest(credential);
  // Both sides are hashed to one length, so the comparison takes constant time.
  const authorized = header =>
    typeof header === 'string' &&
    header.startsWith('Bearer ') &&
    timingSafeEqual(digest(header.slice('Bearer '.length)), expected);
  let queue = Promise.resolve();
  let closing = false;
  let watch;

  const server = createServer((request, response) => {
    const reply = (code, body) => {
      // Each request is one command, so no connection outlives its reply.
      response.writeHead(code, {
        'content-type': 'application/json',
        connection: 'close'
      });
      response.end(`${JSON.stringify(body)}\n`);
    };

    if (!authorized(request.headers.authorization)) {
      request.resume();
      reply(401, {
        error:
          'UNAUTHORIZED: missing or wrong lease credential; nothing was run.'
      });

      return;
    }

    if (request.method !== 'POST' || request.url !== '/command') {
      request.resume();
      reply(404, { error: 'NOT_FOUND: the broker serves POST /command only.' });

      return;
    }

    let body = '';

    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;

      if (body.length > MAX_REQUEST_BYTES) {
        request.destroy();
      }
    });
    request.on('end', () => {
      let command;
      let argv;

      try {
        ({ command, args: argv } = JSON.parse(body));
        argv = brokerArgv(command, argv ?? []);
      } catch (error) {
        reply(403, { error: error.message });

        return;
      }

      // One command runs at a time, in arrival order.
      queue = queue.then(async () => {
        if (closing) {
          reply(503, { error: 'STOPPING: the lease broker is stopping.' });

          return;
        }

        if (command === 'screenshot') {
          mkdirSync(SCREENSHOTS, { recursive: true });
        }

        reply(200, await runScript(argv));

        if (command === 'stop') {
          shutdown();
        }
      });
    });
  });

  // Stops serving and removes the credential and the policy rule; the lease is released
  // already, or `releaseThenShutdown` releases it first.
  function shutdown() {
    if (closing) {
      return;
    }

    closing = true;
    clearInterval(watch);
    rmSync(BROKER, { force: true });

    try {
      run('sbx', removeRule(sandbox, port));
      log(`removed the policy rule for localhost:${port} from ${sandbox}`);
    } catch (error) {
      log(error.message);
      process.exitCode = 1;
    }

    server.close(() => process.exit());
    server.closeIdleConnections();
  }

  const releaseThenShutdown = () => {
    queue = queue.then(async () => {
      if (!closing) {
        const stopped = await runScript(['stop']);

        process.stderr.write(stopped.stderr);
        shutdown();
      }
    });
  };

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  }).catch(error => {
    spawnSync(process.execPath, [SCRIPT, 'stop'], {
      cwd: ROOT,
      stdio: 'inherit'
    });

    throw new Error(
      `the broker cannot listen on 127.0.0.1:${port} (${error.message}); the lease was stopped.`
    );
  });

  try {
    run('sbx', allowRule(sandbox, port));
  } catch (error) {
    server.close();
    spawnSync(process.execPath, [SCRIPT, 'stop'], {
      cwd: ROOT,
      stdio: 'inherit'
    });

    throw new Error(`${error.message}; the lease was stopped.`);
  }

  chmodSync(DIR, 0o700);
  writeFileSync(
    BROKER,
    `${JSON.stringify({ sandbox, port, credential, lease: id, process: self() }, null, 2)}\n`,
    { mode: 0o600 }
  );

  process.on('SIGINT', releaseThenShutdown);
  process.on('SIGTERM', releaseThenShutdown);
  // A lease released another way, by `stop` on the host or by `gc`, stops the broker too.
  watch = setInterval(() => {
    if (!closing && !findLease(readRegistry(), id)) {
      log(`lease ${id} was released`);
      shutdown();
    }
  }, POLL_MS);

  log(
    `the lease broker serves lease ${id} to sandbox ${sandbox} on 127.0.0.1:${port}; in the sandbox run \`node scripts/lease-broker-client.mjs <command> [args]\`. Ctrl-C stops it and releases the lease.`
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
    await stop();
  } else if (command === 'template') {
    await template({ recreate: flags.includes('--recreate') });
  } else if (command === 'build-key') {
    await buildKey();
  } else if (command === 'build') {
    await build();
  } else if (command === 'device') {
    await device(flags[0], flags.slice(1));
  } else if (command === 'open') {
    await openLink(flags);
  } else if (command === 'adb') {
    await adbCommand(flags);
  } else if (command === 'gc') {
    await gc(flags);
  } else if (command === 'list') {
    list();
  } else if (command === 'limit') {
    limit(flags);
  } else if (command === 'broker') {
    await broker();
  } else if (command === 'sql') {
    await sql(flags);
  } else if (command === 'logs') {
    logs(flags);
  } else if (command === 'motion') {
    await motion(flags);
  } else if (command === 'capture-press') {
    await capturePress(flags);
  } else if (command === BUILD_WORKER) {
    await buildWorker(flags[0]);
  } else {
    throw new Error(
      'Usage: pnpm run device:stack template [--recreate] | start [--fresh] [--no-build] | status | stop | device <command> [args] | open <path> | adb shell|exec-out|pull [args] | sql "<query>" | motion on|off | capture-press <label> | logs [js|metro] [--lines N] [--grep re] | gc [--dry-run] [--idle <minutes>] | list | limit [<n>] | broker | build-key | build'
    );
  }
} catch (error) {
  process.stderr.write(`device-stack: ${error.message}\n`);

  if (command === 'start' && readState()) {
    process.stderr.write(
      'device-stack: run `pnpm run device:stack stop` to stop what was started.\n'
    );
  }

  // Ends waits still running beside the one that failed, such as the emulator boot.
  process.exit(1);
}
