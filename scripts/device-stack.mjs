import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
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
// and still passes that check, then releases the lease. `build-key` prints the dev build key
// of this checkout and the hash of each input behind it.
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
// it. `metroPorts` replaces the Metro port of each slot.
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
const slotPorts = slot => ({
  consolePort: 5556 + slot * 2,
  adbPort: 5557 + slot * 2,
  metroPort: metroPorts()[slot]
});
// LogBox inspector titles of the errors that open a redbox.
const REDBOX_TITLES = ['Uncaught Error', 'Syntax Error', 'Render Error'];
const METRO_TAIL_LINES = 20;
// testID on the Workout start screen heading (WorkoutStartScreen).
const START_SCREEN_ID = 'workout-start-screen';
const BOOT_TIMEOUT_MS = 180_000;
const METRO_TIMEOUT_MS = 120_000;
const OPEN_TIMEOUT_MS = 180_000;

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

    await sleep(500);
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

// Boots the harness AVD writable from wiped data, turns animations off, checks no app is
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
    '-no-boot-anim'
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
// environment can only lower it.
function emulatorLimit() {
  const configured = readJson(HOST_CONFIG)?.limit ?? DEFAULT_LIMIT;

  if (
    !Number.isInteger(configured) ||
    configured < 1 ||
    configured > MAX_LIMIT
  ) {
    throw new Error(
      `${HOST_CONFIG}: limit must be an integer from 1 to ${MAX_LIMIT}.`
    );
  }

  const lowered = process.env.DEVICE_STACK_LIMIT;

  if (!lowered) {
    return configured;
  }

  if (!/^[1-9]\d*$/.test(lowered)) {
    throw new Error('DEVICE_STACK_LIMIT must be a positive integer.');
  }

  return Math.min(configured, Number(lowered));
}

function metroPorts() {
  const ports = readJson(HOST_CONFIG)?.metroPorts ?? DEFAULT_METRO_PORTS;

  if (
    !Array.isArray(ports) ||
    ports.length !== MAX_LIMIT ||
    new Set(ports).size !== MAX_LIMIT ||
    !ports.every(port => Number.isInteger(port) && port > 1023 && port < 65536)
  ) {
    throw new Error(
      `${HOST_CONFIG}: metroPorts must list ${MAX_LIMIT} distinct ports from 1024 to 65535.`
    );
  }

  return ports;
}

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

async function acquireLease(id) {
  const limit = emulatorLimit();

  await hook('beforeAcquire', { root: ROOT });

  return withRegistry(registry => {
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
  });
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
function startMetro(state) {
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

async function startLease({ fresh, noBuild }) {
  const recorded = readState();

  if (recorded && !recorded.lease) {
    throw new Error(
      'A device stack is already recorded; run `pnpm run device:stack stop` first.'
    );
  }

  const held = recorded && findLease(readRegistry(), recorded.lease.id);

  if (
    held &&
    !held.operation &&
    recorded.running &&
    Object.values(observe(recorded)).every(value => value === 'running')
  ) {
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
  });

// Opens the app on the lease's Metro through the dev-client link, dismisses the dev-client
// onboarding a fresh install shows, and waits for the Workout start screen.
async function openApp(state) {
  const { serial } = state.emulator;

  log('opening the app on the bundle');
  state.session ??= `liftlog-${process.pid}-${Date.now().toString(36)}`;
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
  } else if (command === BUILD_WORKER) {
    await buildWorker(flags[0]);
  } else {
    throw new Error(
      'Usage: pnpm run device:stack template [--recreate] | start [--fresh] [--no-build] | status | stop | build-key | build'
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
