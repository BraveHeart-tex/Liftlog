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

Run the app on the harness emulator with the [recipe](#recipe) and the
`android-emulator` or `agent-device` skill. A device check names the screen,
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
   (`liftlog_harness_34`), starts or reuses this checkout's Metro, captures JS logs and
   waits for the Workout start screen. Create the harness AVD once with
   `pnpm run device:stack template`. `start` never calls `liftlog_audit_34`, another
   emulator or a phone, even when one is the only device online
   ([targeting invariants](adr/0008-device-stack-architecture.md#targeting-invariants)).
   Target every command you run at the serial and session that `status` prints:
   `adb -s <serial>`, `agent-device ... --serial <serial> --session <session>`. `start`
   installs the dev build matching the checkout's dev build key from the dev build cache,
   only when the installed build differs; on a miss it builds it first from a freshly
   regenerated `android/` (log: `.device-stack/build.log`), so native changes need no
   separate build. `pnpm run device:stack build` fills the cache without starting;
   `--no-build` fails a miss with `BUILD_MISSING`, and a failed build exits with
   `BUILD_FAILED` and the log path. Never install with `pnpm run android`: it targets the
   first listed device and starts its own Metro. `--fresh`
   clears app data so the dev seed runs again (new random IDs). `status` reports each
   recorded process `running` only while its PID, start time and argv still match
   ([ownership evidence](adr/0008-device-stack-architecture.md#ownership-evidence)); a
   failed `start` leaves its state recorded, so run `stop` before retrying.
   - Coordination between worktrees follows
     [ADR-0008](adr/0008-device-stack-architecture.md):
     [coordination scopes](adr/0008-device-stack-architecture.md#coordination-scopes),
     [lease protocol](adr/0008-device-stack-architecture.md#lease-protocol),
     [dev build key](adr/0008-device-stack-architecture.md#dev-build-key),
     [dev build cache](adr/0008-device-stack-architecture.md#dev-build-cache) and
     [emulator instances](adr/0008-device-stack-architecture.md#emulator-instances).
   - A reused Metro (state shows `metro.log: null`, usually the maintainer's terminal)
     has no log. When you need Metro's output, do not stop it; run on another port.
     `DEVICE_STACK_PORT` sets the adb reverse port and dev-client link, so `start`
     launches its own Metro and writes `.device-stack/metro.log`:

     ```sh
     pnpm run device:stack stop
     DEVICE_STACK_PORT=8082 pnpm run device:stack start
     ```

2. **Reach the screen** from the [route map](#route-map):
   `adb -s <serial> shell am start -W -a android.intent.action.VIEW -d 'liftlog:///<path>' com.borakaraca94.liftlog`.
   Pace links a few seconds apart; rapid `agent-device open <url>` calls drop the app to
   the dev launcher. Confirm the screen with `agent-device snapshot -i`.
3. **Prove style facts** through the React DevTools hook. A reviewed screenshot stays
   the evidence; this read backs it up wherever a style fact is the claim.
   `agent-device react-devtools get component` shows props but dehydrates nested
   `style` (`"{…}"`), so read the host `Text` through CDP instead (see
   `agent-device help cdp`; `<port>` is the stack port from `status`; pick the target where `runtime eval --expr '1+1'` answers):

   ```sh
   agent-device cdp target list --url http://127.0.0.1:<port>
   agent-device cdp target select <target-id> --url http://127.0.0.1:<port>
   agent-device cdp runtime eval --expr '(()=>{const T="Workout",h=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__,flat=s=>Array.isArray(s)?Object.assign({},...s.map(flat)):(s||{}),txt=c=>typeof c==="string"?c:Array.isArray(c)?c.filter(x=>typeof x==="string").join(""):"";for(const id of h.renderers.keys())for(const r of h.getFiberRoots(id)){const st=[r.current];while(st.length){const f=st.pop();if(f.type==="RCTText"&&txt(f.memoizedProps.children)===T)return JSON.stringify(flat(f.memoizedProps.style));if(f.sibling)st.push(f.sibling);if(f.child)st.push(f.child)}}return "not found"})()'
   ```

   Set `T` to the visible text; the result includes `fontFamily`
   (`InstrumentSans_700Bold` for the Workout heading).

4. **Read the JS log** when an action has no visible effect: `.device-stack/js.log`
   holds `ReactNativeJS` logcat output from `start` onward; read its tail for the
   error or warning.
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

### Route map

Paths from `src/app`; groups such as `(tabs)` drop out of the URL. Read IDs from the
app database: `adb exec-out run-as com.borakaraca94.liftlog cat files/SQLite/<f>` for
`workout.db`, `workout.db-wal` and `workout.db-shm` into one directory, then `sqlite3`.

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
