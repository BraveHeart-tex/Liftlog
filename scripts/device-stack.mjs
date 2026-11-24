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
// `template` creates the harness AVD once. `start [--fresh]` leases an emulator slot from the
// host registry (repeating it returns the same lease), boots the harness emulator on the
// slot's console port, reverses the Metro port, installs the dev build matching this checkout's
// dev build key from the dev build cache (building it on a miss unless `--no-build`), starts
// or reuses this checkout's Metro, captures JS logs, opens the app through the dev-client
// link and waits for the start screen. `build` fills the dev build cache for this checkout.
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
// `{ "limit": 2 }` raises the emulator limit up to MAX_LIMIT; DEVICE_STACK_LIMIT can only lower it.
const HOST_CONFIG = join(HOST_DIR, 'config.json');
const DEFAULT_LIMIT = 1;
const MAX_LIMIT = 2;
// Argv marker of a device stack process holding a lock or running a lease operation.
const SELF_MARKERS = ['device-stack.mjs'];
const PORT = Number(process.env.DEVICE_STACK_PORT ?? 8081);
const HARNESS_AVD = 'liftlog_harness_34';
const HARNESS_ABI = process.arch === 'arm64' ? 'arm64-v8a' : 'x86_64';
const HARNESS_IMAGE = `system-images;android-34;google_apis;${HARNESS_ABI}`;
const DEV_BUILD_VARIANT = 'debug';
// Environment variables the generated Gradle build reads; ORG_GRADLE_PROJECT_* variables
// also set Gradle properties.
const BUILD_ENV = ['EXPO_USE_COMMUNITY_AUTOLINKING'];
// Slot n fixes the emulator console port 5556 + 2n and the adb port above it; 5554 stays free
// for the maintainer's emulator.
const slotPorts = slot => ({
  consolePort: 5556 + slot * 2,
  adbPort: 5557 + slot * 2
});
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
      const listeners = [
        ...new Set([
          ...listeningPids(ports.consolePort),
          ...listeningPids(ports.adbPort)
        ])
      ];

      if (listeners.length) {
        blocked.push(
          `slot ${slot} ports ${ports.consolePort}/${ports.adbPort} are held by pid ${listeners.join(', ')}`
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

const emulatorOwned = state =>
  isSameProcess(state.emulator?.process) &&
  avdName(state.emulator.serial) === HARNESS_AVD;

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
  if (!listAvds().includes(HARNESS_AVD)) {
    throw new Error(
      `The harness emulator ${HARNESS_AVD} does not exist. Create it with \`pnpm run device:stack template\`, then rerun.`
    );
  }

  // The serial is fixed by the slot's console port before boot, so no other device is ever
  // listed or called to find it.
  const { consolePort, serial } = state.lease;
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

  const { id, slot, serial, consolePort, adbPort } = lease;
  const state = {
    lease: { id, slot, serial, consolePort, adbPort },
    root: ROOT,
    port: PORT,
    package: PACKAGE,
    fresh
  };

  saveState(state);

  try {
    await bringUp(state, { fresh, noBuild });
  } catch (error) {
    // Nothing of this lease runs yet, so the slot is freed at once.
    if (!state.emulator && !error.message.startsWith('LEASE_LOST')) {
      await releaseLease(id);
      rmSync(STATE, { force: true });
    }

    throw error;
  }
}

async function bringUp(state, { fresh, noBuild }) {
  const reused = await existingMetro();
  const { key } = await devBuildKey();
  // A miss starts the build now, so it runs while the emulator boots.
  const { done, ...devBuildState } = devBuild(key, { noBuild });

  state.devBuild = devBuildState;
  saveState(state);
  const serial = await bootEmulator(state);

  adb(serial, 'reverse', `tcp:${PORT}`, `tcp:${PORT}`);
  state.reverse = `tcp:${PORT}`;
  saveState(state);

  state.devBuild.apk = await done;
  state.devBuild.installed = await installDevBuild(state, state.devBuild.apk);
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
    await onOwnedEmulator(state, 'clear data', () =>
      adb(serial, 'shell', 'pm', 'clear', PACKAGE)
    );
  }

  log('opening the app on the bundle');
  const session = `liftlog-${process.pid}-${Date.now().toString(36)}`;
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
  await updateLease(state.lease.id, lease => {
    if (!ownOperation(lease)) {
      throw leaseLost(lease.id);
    }

    lease.operation = null;
  });
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
    const killed = await guarded(
      state,
      'kill emulator',
      () => emulatorOwned(state),
      () => tryAdb(serial, 'emu', 'kill')
    );

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
