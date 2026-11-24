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

- **Unit tests** (`tests/**`, `node:test`) prove logic, stores and feature services.
- **Database integration tests** (`*.db.test.ts`: schema and migrations in `tests/db`,
  repositories beside their feature's tests) prove them against real SQLite through
  `tests/support`, never a faked Drizzle query chain. Each file registers
  `afterEach(closeTestDatabases)`; factories use fixed IDs and timestamps.
- **Native module tests** (`modules/<module>/android/src/test`) prove Kotlin logic that
  does not need a device.
- **[Device checks](#device-checks)** prove what only a running app shows: rendering,
  gestures, sheets, keyboard behavior, notifications, installer and OS integration.

A purely visual change gets a device check with no test.

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
