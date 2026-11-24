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
  globals, `pnpm run test`) prove logic, stores and feature services.
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
  database integration tests in `.db.test.ts`; native and tooling tests are
  `tests/native/*.test.ts` and `tests/tooling/*.test.ts`.
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
- **Commands:** `pnpm run test <path>` or `pnpm run test -t <name>` (app project),
  `pnpm run test:native`, `pnpm run test:tooling`, `pnpm run test:kotlin`.
- **Examples:** unit
  [`superset.utils.test.ts`](../tests/features/workouts/shared/superset.utils.test.ts),
  real-SQLite
  [`steps.repository.db.test.ts`](../tests/features/steps/steps.repository.db.test.ts),
  harness
  [`rest-timer-coordinator.test.ts`](../tests/features/rest-timer/rest-timer-coordinator.test.ts).

## Device checks

Run the app on an Android emulator or device with the `android-emulator` or
`agent-device` skill, or `pnpm run android:device`. A device check names the screen,
the steps and what must be visible, and its evidence is a reviewed screenshot or a
short written observation. Native changes need a fresh native build before the check.

A check that needs real hardware, a release build, store or installer behavior, or
account access the agent cannot reach is a `ready-for-human` item: it gets its own
issue assigned to the maintainer, or is listed as an outstanding device check in the
evidence.

## Evidence

Record one evidence comment in the active GitHub issue:

- the pushed commit
- each acceptance criterion with its evidence (existing test, new test, or device check)
- device checks performed, with screenshots attached when they are the evidence
- limitations and outstanding device checks

The assertions are the evidence: link tests and existing evidence rather than copying
output. Record a failed or blocked check explicitly; it keeps the work open.
