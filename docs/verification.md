# Verification

How to prove a change and record that proof. The required commands live in
[AGENTS.md validation](../AGENTS.md#validation); this doc decides which proof each
acceptance criterion needs.

## When a test is required

Add a test when it catches a credible regression, not one per acceptance criterion.

- **A test is required for:**
  - a bug fix, at the lowest level that fails without the fix
  - new logic: set and volume calculations, personal records, dates, durations,
    rest timer deadlines, parsing, import and export
  - a new persisted state change or recovery path (workouts, drafts, backups,
    update attempts)
  - a schema change or migration: real-SQLite cases for the risks it introduces,
    such as existing rows, backfills and conflicts
  - new native module behavior that a module JVM unit test can reach
- **No new test for:**
  - copy, styling or layout
  - a pure move or rename with no behavior change
  - behavior an existing test already proves; the evidence cites that test instead

Each test names the regression it catches. A shared primitive is tested once; each
feature that uses it proves its wiring with one case.

Every acceptance criterion names its evidence: an existing test, a new test where one
is required, or a [device check](#device-checks). Test-first applies only where a test
is required.

## Cheapest proof

Prove each behavior that needs a test at the cheapest level that can prove it.

- **Unit tests** (`tests/{components,db,features,lib}`, Jest app project with Jest
  globals, `pnpm run test`) prove logic, stores and feature services; component tests
  there render a component with React Native Testing Library and query by visible text
  and accessibility role, never by style.
- **Native configuration tests** (`tests/native`, Jest native project,
  `pnpm run test:native`) prove config plugins, release signing and the Android
  release build and verification scripts in Node.
- **Tooling tests** (`tests/tooling`, Jest tooling project, `pnpm run test:tooling`)
  prove the GitHub ticket scripts against a fake `gh`.
- **Database integration tests** (`*.db.test.ts`: schema and migrations in `tests/db`,
  repositories beside their feature's tests) prove them against real SQLite through
  `tests/support`, never a faked Drizzle query chain. Each file registers
  `afterEach(closeTestDatabases)`; factories use fixed IDs and timestamps.
- **Native module tests** (`modules/<module>/android/src/test`, Gradle JVM unit tests,
  `pnpm run test:kotlin` after `expo prebuild --platform android`) prove Kotlin logic
  that does not need a device.
- **[Device checks](#device-checks)** prove what only a running app shows: rendering,
  gestures, sheets, keyboard behavior, notifications, installer and OS integration.

A purely visual change gets a device check with no test.

CI runs the unit tests on every pull request and push to main, and the native,
tooling and native module tests only when their inputs change, through the `paths`
filters in `.github/workflows/ci-native.yml`, `ci-tooling.yml` and `ci-kotlin.yml`. A
file one of those tests depends on joins its filter. All four run in the reusable
`.github/workflows/test.yml`, which the release preflight calls; the native module job
generates `android/` with a fresh prebuild, never a committed or cached one.

## Writing tests

Conventions for the levels above; read this and the nearest example before writing one.

- **Path and suffix:** a test mirrors its source path under `tests/`
  (`src/features/steps/steps.repository.ts` →
  `tests/features/steps/steps.repository.db.test.ts`). Unit tests end in `.test.ts`,
  component tests in `.test.tsx`, database integration tests in `.db.test.ts`; native
  and tooling tests are `tests/native/*.test.ts` and `tests/tooling/*.test.ts`.
  `tests/compat/<project>` holds library contract tests that no real test covers; each
  names the upgrade it catches.
- **Support helpers:** `tests/support/db.ts` opens migrated real-SQLite databases
  (`createMigratedTestDatabase`, `closeTestDatabases`), `tests/support/factories.ts`
  builds rows with fixed IDs and timestamps, and `tests/support/sqlite-adapter.ts`
  backs them with `node:sqlite`.
- **Mocking:** pass fakes through a module's dependency parameters (a `harness()`
  builder in the test file) when it takes them. Otherwise mock a module with
  `jest.doMock` before a dynamic `import()`; shared native module mocks live in
  `tests/mocks` and load through `moduleNameMapper` in `jest.config.js`. Never fake a
  Drizzle query chain.
- **Assertions:** new or substantially rewritten tests use Jest `expect` and React
  Native Testing Library matchers; migrated tests keep `node:assert/strict` until
  rewritten for another reason.
- **Performance contracts:** assert statement counts, recorded statements or generated
  SQL only in a test named `performance contract: <guarantee>`; otherwise assert
  returned values and stored rows. The test adapter rejects statements over 999
  variables, so a chunked write is proven by a row count over that limit.
- **Time zone:** the app project pins `America/New_York`, which observes daylight
  saving, through `tests/support/time-zone.global-setup.js`. Date tests build
  instants with `Date.UTC` and fix "now" with `jest.useFakeTimers({ now })`.
- **Commands:** `pnpm run test <path>` or `pnpm run test -t <name>` (app project),
  `pnpm run test:native`, `pnpm run test:tooling`, `pnpm run test:kotlin`.
- **Examples:** unit
  [`superset.utils.test.ts`](../tests/features/workouts/shared/superset.utils.test.ts),
  real-SQLite
  [`steps.repository.db.test.ts`](../tests/features/steps/steps.repository.db.test.ts),
  harness
  [`rest-timer-coordinator.test.ts`](../tests/features/rest-timer/rest-timer-coordinator.test.ts),
  component
  [`set-form.test.tsx`](../tests/features/workouts/set-entry/components/set-form/set-form.test.tsx).

## Device checks

Run the app on the harness emulator with the [recipe](#recipe), reaching the device
only through its `pnpm run device:stack` commands. A device check names the screen,
the steps and what must be visible, and its evidence is a reviewed screenshot or a
short written observation. Native changes need a fresh native build before the check.

A check that needs real hardware, a release build, store or installer behavior, or
account access the agent cannot reach is a `ready-for-human` item: it gets its own
issue assigned to the maintainer, or is listed as an outstanding device check in the
evidence.

### Recipe

Reach screens by deep link and act by accessibility label or `@ref`, never by
coordinates read off a screenshot. In order:

1. **Start.** `pnpm run device:stack start` boots the harness emulator
   (`liftlog_harness_34`) while it starts the lease's own Metro, captures JS logs and
   waits for the Workout start screen. Create the harness AVD and its clean template
   snapshot (no app, animations off) once with `pnpm run device:stack template`;
   `template --recreate` rebuilds the snapshot and refuses while any lease is live. Each
   lease boots a read-only instance of the template on its slot's ports, so a new lease
   starts with fresh app data. `start` never calls `liftlog_audit_34`, another
   emulator or a phone, even when one is the only device online
   ([targeting invariants](adr/0008-device-stack-architecture.md#targeting-invariants)).
   Run agent-device through `pnpm run device:stack device <command> [args]`: it adds the
   lease's platform, serial, session and an empty explicit config (plus the slot Metro for
   `open`, `metro reload` and `cdp target list|select`), strips `AGENT_DEVICE_*`
   variables, and refuses commands outside its allowlist, `close --shutdown`, `--`, and
   any flag that selects a device, app, session, Metro, config, daemon or remote
   endpoint, in both `--flag value` and `--flag=value` spellings. `open` takes only the
   app package and `liftlog://` app links, not dev-client links. Without a ready lease it
   exits with `NO_LEASE`. It guards against misuse and is not a security boundary
   ([ADR-0009](adr/0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md)).
   Run adb through `pnpm run device:stack adb <subcommand> [args]`: it runs only `shell`,
   `exec-out` and `pull` on the lease's serial, and refuses device selection, install,
   root, reboot, port forwarding, `emu` and server commands, plus `reboot`, `su`,
   `setprop`, `svc power` and package install or uninstall inside `shell` and `exec-out`.
   It is host-only. A check of press, transition or other motion runs
   `pnpm run device:stack motion on` first: the template turns animations off, which
   Reanimated reads as reduced motion. `motion on|off` sets the three animation scales to
   `1` or `0` on the lease's emulator and reopens the app on the lease's Metro, so the app
   reads the new preference. Never call `adb` or `agent-device` directly; a sandboxed agent
   follows [sandboxed agents](#sandboxed-agents) instead. `start`
   installs the dev build matching the checkout's dev build key from the dev build cache,
   only when the installed build differs; on a miss it builds it first from a freshly
   regenerated `android/` (log: `.device-stack/build.log`), so native changes need no
   separate build. `pnpm run device:stack build` fills the cache without starting;
   `--no-build` fails a miss with `BUILD_MISSING`, and a failed build exits with
   `BUILD_FAILED` and the log path. Never install with `pnpm run android`: it targets the
   first listed device and starts its own Metro. `--fresh` on a running lease clears its
   app data and reopens the app, so the dev seed runs again (new random IDs). `status` reports each
   recorded process `running` only while its PID, start time and argv still match
   ([ownership evidence](adr/0008-device-stack-architecture.md#ownership-evidence)).
   `start` leases an emulator slot first and fails with `CAPACITY`, naming the holders,
   when every slot is taken; the limit is one unless `~/.liftlog-device-stack/config.json`
   sets `{ "limit": 2 }`, and `DEVICE_STACK_LIMIT` can only lower it; the
   [capacity rule](#capacity) decides the default. Repeating `start`
   returns the running lease. After a failed or killed `start`, the next `start` repairs
   the lease and `stop` releases it; `LEASE_LOST` means another holder took the slot, so
   run `stop` to clear the worktree's record. Before failing with `CAPACITY`, `start`
   reaps leases whose owners are provably gone. `pnpm run device:stack list` shows every
   slot read-only; `gc` reclaims abandoned leases, `gc --dry-run` prints each decision
   with its evidence and changes nothing, and `gc --idle <minutes>` also reclaims live
   leases idle that long. A lease whose ownership cannot be proven is reported as a
   conflict and left untouched
   ([reclaiming leases](adr/0008-device-stack-architecture.md#reclaiming-leases)).
   - Coordination between worktrees follows
     [ADR-0008](adr/0008-device-stack-architecture.md):
     [coordination scopes](adr/0008-device-stack-architecture.md#coordination-scopes),
     [lease protocol](adr/0008-device-stack-architecture.md#lease-protocol),
     [reclaiming leases](adr/0008-device-stack-architecture.md#reclaiming-leases),
     [dev build key](adr/0008-device-stack-architecture.md#dev-build-key),
     [dev build cache](adr/0008-device-stack-architecture.md#dev-build-cache) and
     [emulator instances](adr/0008-device-stack-architecture.md#emulator-instances).
   - Each lease runs its own Metro from its worktree on the slot's Metro port (`port` in
     `status`; 8090 for slot 0 and 8091 for slot 1, or `metroPorts` in the host config),
     so 8081 and the maintainer's Metro stay untouched. Its output goes to a fresh
     `.device-stack/metro.log` per lease. The dev client opens on that port through
     `10.0.2.2`, so `start` adds no `adb reverse`. A server the lease did not start on a
     slot's ports blocks that slot and is never signaled. A bundling error or redbox
     fails `start` at once with the last Metro log lines.

2. **Reach the screen** from the [route map](#route-map):
   `pnpm run device:stack open <path>` opens `liftlog:///<path>` on the lease's emulator
   and waits for its activity. It spaces consecutive links at least 3 s apart, since
   rapid links drop the app to the dev launcher, and refuses full URLs, dev-client links,
   quotes and spaces. The route renders shortly after the activity, so confirm the screen
   with `pnpm run device:stack device wait text <title>` or `device snapshot -i`.
3. **Prove style facts** through the React DevTools hook. A reviewed screenshot stays
   the evidence; this read backs it up wherever a style fact is the claim.
   `react-devtools get component` shows props but dehydrates nested `style` (`"{…}"`),
   so read the host `Text` through CDP instead (the wrapper points target discovery at
   the lease's Metro; pick the target where
   `runtime eval --expr '1+1'` answers):

   ```sh
   pnpm run device:stack device cdp target list
   pnpm run device:stack device cdp target select <target-id>
   pnpm run device:stack device cdp runtime eval --expr '(()=>{const T="Workout",h=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__,flat=s=>Array.isArray(s)?Object.assign({},...s.map(flat)):(s||{}),txt=c=>typeof c==="string"?c:Array.isArray(c)?c.filter(x=>typeof x==="string").join(""):"";for(const id of h.renderers.keys())for(const r of h.getFiberRoots(id)){const st=[r.current];while(st.length){const f=st.pop();if(f.type==="RCTText"&&txt(f.memoizedProps.children)===T)return JSON.stringify(flat(f.memoizedProps.style));if(f.sibling)st.push(f.sibling);if(f.child)st.push(f.child)}}return "not found"})()'
   ```

   Set `T` to the visible text; the result includes `fontFamily`
   (`InstrumentSans_700Bold` for the Workout heading).

4. **Read the logs** when an action has no visible effect or the app closes:
   `pnpm run device:stack logs [js|metro] [--lines N] [--grep re]` prints the last N
   matching lines (default 50, at most 500) of the lease's JS log, the default, or its
   Metro log. The JS log holds `ReactNativeJS` output and `AndroidRuntime` native crashes
   from `start` onward; each lease starts both logs empty.
5. **Red proof on the base commit** for a new test, in a throwaway worktree so the
   checkout stays untouched. The worktree has no `node_modules`; link the checkout's
   and skip pnpm's dependency check, which would otherwise try to reinstall:

   ```sh
   wt=$(mktemp -d)/base
   git worktree add --detach "$wt" <base>
   ln -s "$PWD/node_modules" "$wt/node_modules"
   cp <new test file> "$wt/<new test file>"
   (cd "$wt" && pnpm --config.verify-deps-before-run=false run test <new test file>)
   git worktree remove --force "$wt"
   ```

   The test must fail there; `git status` in the checkout is unchanged afterwards.

6. **Stop.** `pnpm run device:stack stop` closes the session and stops only what `start`
   started and still passes its identity check; anything that fails it is listed as
   `untrusted` and left running.

### Sandboxed agents

An agent in the Docker Sandbox the host config names (`"sandbox": "liftlog-dev"` in
`~/.liftlog-device-stack/config.json`, whose workspace is the main checkout) reaches its
lease only through the lease broker
([ADR-0009](adr/0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md)).
Inside the sandbox, never run `pnpm`, `adb`, `agent-device`, the emulator or
`device:stack`, and never install dependencies: host Metro needs the macOS native
packages in the checkout's `node_modules`.

1. **Host.** The maintainer runs `pnpm run device:stack broker` in the main checkout. It
   starts the lease as `start` does, listens on `127.0.0.1` at the slot's broker port
   (8092 for slot 0 and 8093 for slot 1, or `brokerPorts` in the host config), adds the
   sandbox's one policy rule `localhost:<broker port>`, writes a fresh lease credential
   to `.device-stack/broker.json` (owner-only) and stays in the foreground. Ctrl-C,
   `stop` from the sandbox, or a release on the host (`stop`, `gc`) stops the broker and
   removes the credential and the rule. Without `sandbox` in the host config it exits
   with `NO_SANDBOX`; outside the main checkout with `NOT_MAIN_CHECKOUT`; beside a
   running broker with `BROKER_RUNNING`.
2. **Sandbox.** From the checkout root, run
   `node scripts/lease-broker-client.mjs <command> [args]`. It prints the command's output
   and exits with its code; without a broker it exits with `NO_BROKER`. The lease's
   host Metro serves edits made in the sandbox; `metro-reload` reloads the app.

| Command                        | Runs on the lease                                        |
| ------------------------------ | -------------------------------------------------------- |
| `start`                        | `start`: the running lease, or a repair                  |
| `fresh`                        | `start --fresh`                                          |
| `status`                       | `status`                                                 |
| `stop`                         | `stop`, then the broker exits                            |
| `logs [js\|metro] [N]`         | `logs` with `--lines N` (default 50)                     |
| `open <path>`                  | `open <path>`, a [route map](#route-map) path            |
| `snapshot`                     | `device snapshot -i`                                     |
| `press @ref`, `longpress @ref` | `device press @ref`, `device longpress @ref`             |
| `fill @ref <text>`             | `device fill @ref <text>`                                |
| `type <text>`                  | `device type <text>`                                     |
| `wait <text>`                  | `device wait text <text>`                                |
| `back`                         | `device back`                                            |
| `scroll up\|down\|left\|right` | `device scroll <direction>`                              |
| `metro-reload`                 | `device metro reload`                                    |
| `motion on\|off`               | `motion on\|off`                                         |
| `screenshot <name>`            | `device screenshot .device-stack/screenshots/<name>.png` |

A `<text>` starts with a letter or digit and holds up to 100 letters, digits, spaces and
`.,:!?'()+-`; a `<name>` is lowercase letters, digits and `-`. The broker answers
`UNAUTHORIZED` to a missing or wrong credential, and `REFUSED` to any other command or to
an argument that is a flag, names a serial or path, or fails its pattern; neither runs
anything.

### Capacity

The default emulator limit is one. It rises to two only when every threshold holds with
two leases and a native build running together, and only with maintainer approval:

- memory pressure (`kern.memorystatus_vm_pressure_level`) never reaches critical
- swap used grows by less than 512 MB during the run
- `device snapshot -i` p95 stays within 1.5x the one-lease p95

Measure four scenarios on the host, one at a time from no leases: one lease, one lease
with a native build, two leases, and two leases with a native build. Each scenario
times `start --no-build` per lease from a warm dev build cache, then starts the build
(`gradlew app:assembleDebug --rerun-tasks --no-build-cache` from a prebuilt `android/`
in a separate worktree, so no lease's dev build key changes), while an agent per lease
alternates `open <route>` with a timed `device snapshot -i` until the build exits, at
least 30 times. A sampler records memory pressure, swap used, swapouts and per-process
RSS every 2 s.

Results on the maintainer's 16 GB M1 MacBook Air (harness AVD with 4 GB RAM), measured
for [#177](https://github.com/BraveHeart-tex/Liftlog/issues/177):

| Scenario          | Peak pressure | Swap growth | Swapouts | Snapshot median / p95 | `start`    |
| ----------------- | ------------- | ----------- | -------- | --------------------- | ---------- |
| One lease         | normal        | 0 MB        | 0        | 0.57 s / 0.97 s       | 57 s       |
| One lease, build  | warn          | 0 MB        | 0        | 2.79 s / 10.88 s      | 53 s       |
| Two leases        | warn          | 0 MB        | 0        | 0.89 s / 1.43 s       | 52 s, 67 s |
| Two leases, build | warn          | 2562 MB     | 246805   | 2.86 s / 8.54 s       | 46 s, 55 s |

Two leases with a build fail the swap (2562 MB) and latency (8.54 s against 1.46 s)
thresholds, so the default stays at one. Two leases alone fit within the thresholds, so
`{ "limit": 2 }` suits sessions that run no native build; a build makes even one lease's
snapshots slow.

### Route map

Paths from `src/app`; groups such as `(tabs)` drop out of the URL. Read IDs from the
app database:
`pnpm run -s device:stack adb exec-out run-as com.borakaraca94.liftlog cat files/SQLite/<f> > <dir>/<f>`
for `workout.db`, `workout.db-wal` and `workout.db-shm`, then `sqlite3 <dir>/workout.db`.

| Deep link path                                   | Screen                         | Needs                                                    |
| ------------------------------------------------ | ------------------------------ | -------------------------------------------------------- |
| `workout`                                        | Workout start screen           | -                                                        |
| `workout/active`                                 | Active workout                 | active workout                                           |
| `workout/active/edit-exercises`                  | Active workout exercise editor | active workout                                           |
| `workout/exercise/<workoutExerciseId>`           | Active workout exercise        | exercise of the active workout                           |
| `workout/exercise/<workoutExerciseId>/history`   | Exercise history               | exercise of the active workout                           |
| `log`                                            | Log calendar                   | -                                                        |
| `log/steps`                                      | Steps                          | -                                                        |
| `exercises`                                      | Exercises                      | -                                                        |
| `exercises/new`                                  | New exercise                   | -                                                        |
| `exercises/<exerciseId>`                         | Exercise details               | seeded exercise                                          |
| `exercises/edit/<exerciseId>`                    | Edit exercise                  | custom exercise (`is_custom = 1`)                        |
| `settings`                                       | Settings                       | -                                                        |
| `update-details`                                 | Update details                 | -                                                        |
| `workouts/<workoutId>`                           | Workout details                | `completed` workout                                      |
| `workouts/edit/<draftId>?sourceWorkoutId=<id>`   | Edit workout                   | `historical_edit_draft` (Workout actions → Edit workout) |
| `workouts/edit/exercise/<workoutExerciseId>`     | Edit workout exercise          | exercise of the edit draft                               |
| `workouts/backfill/<draftId>`                    | Historical draft               | `historical_draft` (Log → past day → Log workout)        |
| `workouts/backfill/exercise/<workoutExerciseId>` | Historical workout exercise    | exercise of the historical draft                         |
| `workouts/templates`                             | Templates                      | -                                                        |
| `workouts/templates/new`                         | New template                   | -                                                        |
| `workouts/templates/<templateId>`                | Template details               | seeded template                                          |

Sheets have no route; reach them from their entry point by label:

| Sheet      | Entry point                                             | Label                                                                    |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Rest timer | Active workout header button (`rest-timer-trigger.tsx`) | `Rest timer` (idle), `Rest timer <time> remaining` or `paused` (running) |

The dev seed has no active workout: start one with `label="Start Workout"`, then
`label="Start <template> workout"`.

## Evidence

Record one evidence comment in the active GitHub issue:

- the pushed commit
- each acceptance criterion with its evidence (existing test, new test, or device check)
- device checks performed, with screenshots attached when they are the evidence
- limitations and outstanding device checks

The assertions are the evidence: link tests and existing evidence rather than copying
output. Record a failed or blocked check explicitly; it keeps the work open.
