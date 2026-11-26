# ADR-0008: Run device checks only on emulators the device stack owns

- Status: Accepted
- Date: 2026-11-24

## Context

Agents verify Android changes from separate git worktrees on one macOS host, with
`pnpm run device:stack` ([device checks](../verification.md#device-checks)). The stack
used to reuse the first `adb devices` entry, phones included, or boot the first AVD
writable, which was the maintainer's `liftlog_audit_34`. adb and agent-device calls named
no device, so with two devices online a call could land on either. `stop` signalled
recorded PIDs without checking that they still belonged to the processes `start`
launched. Several agents running at once need exclusive emulators, Metro servers,
sessions and dev builds, and must never touch a physical device or the maintainer's
emulator.

## Decision

The device stack runs device checks only on emulator instances it started from its own
harness AVD, and touches a resource only with evidence that it owns it.

### Coordination scopes

- **Host-wide:** the harness AVD and its template snapshot, the lease registry and its
  lock, the emulator limit, the dev build cache and the build lock. They live outside any
  worktree, because every worktree on the host shares them.
- **Worktree:** `.device-stack/` at the checkout root holds a pointer to the worktree's
  lease, its logs and its per-worktree operation lock. It never holds host-wide state.
- **Run:** one `start` owns its agent-device session, the processes it spawned and the
  identity records of those processes.

### Lease protocol

- `start` takes an exclusive emulator slot from the host registry before it touches a
  device. Each acquisition gets a unique lease ID; the slot fixes the emulator's console,
  adb and Metro ports.
- Every registry change is a compare-and-swap on the lease ID under a short registry lock.
  A lock whose holder process no longer passes its identity check is stale and may be
  broken.
- An operation record (acquire, repair or release, with its lease ID) is written before
  the operation spawns any process, so a lease is never reclaimed mid-operation.
- Release frees the slot only after the lease's processes are stopped. A full registry
  fails with `CAPACITY` and names the holders; a lease taken over by another holder fails
  with `LEASE_LOST`.
- The limit is one emulator by default and can be raised to two in the host config. An
  environment variable can only lower it.

### Reclaiming leases

- The registry records each lease's worktree, its repository's git common dir, its last
  use and the identity of every process it spawned, so a lease is judged after its
  worktree and `.device-stack/` are gone.
- A lease whose acquire, repair or release still runs in a live process is never
  reclaimed. Otherwise it is reclaimable when its worktree is missing from disk or from
  its repository's worktree list, or when none of its processes passes its identity
  check. A live lease in an existing worktree is reclaimed only by `gc --idle <minutes>`.
- Reclaiming needs every listener on the slot's ports to be, or belong to the process
  group of, a verified process of the lease, and a live emulator to report the harness
  AVD and the lease's token (or no token yet). It stops only processes that still pass
  their identity check, waits for them to exit, then frees the slot.
- Failed ownership evidence makes the lease a conflict: it is reported and nothing of it
  is touched. `gc` judges and reclaims under one registry lock hold, so concurrent runs
  reclaim a lease once, and a lease acquired meanwhile has a live operation.
- `start` reaps reclaimable leases before it fails with `CAPACITY`.

### Ownership evidence

The stack acts on a resource only while its evidence holds:

- **Process:** PID, start time (`ps -o lstart`) and argv markers recorded when `start`
  spawned it. A reused PID fails the start time or argv check and is never signalled.
  `status` reports a process `running` only while the check passes.
- **Emulator:** the process check of the emulator it launched, plus the AVD name its
  console reports (`adb -s <serial> emu avd name`). Leased instances add the lease ID as a
  device property and an argv marker, checked before any install, data clear or kill.
- **Metro:** the listener on the port belongs to the process group this run started; a
  server that merely answers `/status` is not this run's Metro.
- **Lease:** the registry record carries the lease ID, and destructive operations re-read
  it before acting.

Missing or failed evidence means the resource is left untouched and reported, never
stopped.

### Targeting invariants

- The stack never boots, adopts, calls or modifies `liftlog_audit_34`, any other AVD's
  emulator or a physical device, even when it is the only device online.
- The harness emulator's serial is fixed before boot by its console port
  (`emulator-<port>`), chosen from ports with no listener, so no other device is listed or
  called to find it.
- Every adb call passes `-s <harness serial>`. Every agent-device call passes
  `--serial <harness serial>` and the run's `--session`; the app opens with
  `--metro-port`.
- Commands printed for agents, such as the dev build install command, target only the
  harness emulator.
- Agents run agent-device through `device:stack device`, which passes the lease's
  serial, session (`liftlog-<lease ID>`) and Metro and refuses flags that select another
  target. It prevents accidental misuse, not a hostile caller.

### Dev build key

The dev build key identifies an Android dev build: equal keys mean an installed or cached
build is interchangeable. It covers every input that changes the native build:

- the Expo fingerprint, with plugin-copied native files such as
  `plugins/android/*.gradle` added and `package.json` scripts removed
  (`fingerprint.config.js`);
- the build variant and ABI;
- the JDK version;
- user Gradle properties;
- build-affecting environment variables, such as `EXPO_USE_COMMUNITY_AUTOLINKING`.

JS-only changes leave the key unchanged, so worktrees that differ only in JS share one dev
build. `device:stack build-key` prints the key and its inputs.

### Dev build cache

- APKs are cached by dev build key in the repository's git common dir, so every worktree
  of the repository shares them.
- A miss builds once from a freshly regenerated `android/` directory, so stale generated
  native files never reach a cached build. The key is recomputed before publishing, and a
  changed key discards the result. Publishing is atomic.
- One native build runs on the host at a time. The detached build process holds the
  host-wide build lock until it exits, so an interrupted `start` neither stops the build
  nor frees the lock.
- A hit installs the cached APK only when the installed build differs. `--no-build` turns
  a miss into `BUILD_MISSING`; a failed or discarded build exits with `BUILD_FAILED` and
  its log path.
- The cache keeps the three most recently used APKs.

### Emulator instances

- `pnpm run device:stack template` creates the harness AVD, `liftlog_harness_34`, once
  from the Android 34 Google APIs image for the host ABI.
- The harness AVD has 4 GB RAM and a 720x1600 screen at 280 dpi, about 411 dp wide.
  `template` writes these settings to the AVD's `config.ini` (in `$ANDROID_AVD_HOME`,
  else `~/.android/avd`) before it saves the snapshot, so `--recreate` applies them to an
  existing AVD. A hand edit is overwritten, and a change needs `--recreate`.
- The template snapshot is a clean boot with no app installed and animations off. Its
  version is recorded per lease; `--recreate` rebuilds it and refuses while any lease is
  live.
- Leased emulators boot as `-read-only` instances of the harness AVD on the slot's ports,
  so leases never share writable data. A new lease starts with fresh app data.
- The template boot and every lease boot pass `-gpu host`. On auto the emulator drops to
  software rendering under host memory pressure, and a snapshot saved in one renderer
  fails to load in the other, so the lease cold boots.
- Until leases exist, the harness boots its AVD writable, one instance at a time.

## Consequences

- The maintainer's emulator and phones stay usable during agent device checks, and a
  failed or stale run cannot kill them.
- A host without the harness AVD runs `device:stack template` once before `start`.
- Tooling tests drive the stack with fake binaries and assert these invariants over every
  recorded call; they run in `validate:changed` and in tooling CI when device stack
  scripts change.
- Sandboxed agents reach device stacks only through a lease broker
  ([ADR-0009](0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md)).
