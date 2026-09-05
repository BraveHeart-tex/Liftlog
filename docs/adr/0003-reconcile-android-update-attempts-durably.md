# ADR-0003: Reconcile Android update attempts durably

- Status: Accepted
- Date: 2026-09-06

## Context

Committing an Android package-installer session does not complete an update. The
system may require confirmation, cancel or reject installation, or replace the
application process. A process-local lock or JavaScript promise cannot protect an
active workout across those transitions.

## Decision

- Persist update exclusion from user confirmation until installation success,
  system cancellation, or terminal failure. Reconcile it after process restart
  before permitting a new active workout.
- When install-source permission is missing, explain it and open the system page
  scoped to LiftLog. Continue after returning with permission; otherwise cancel
  the attempt and release exclusion. Recheck before installer commit.
- Cancel a foreground download when LiftLog is ordinarily backgrounded, delete its
  partial file, release exclusion, and expose an interrupted result with Retry.
  Treat permission settings and the system installer as expected lifecycle
  transitions rather than interrupted downloads.
- Commit an installer request only while LiftLog is active. If verification
  completes while inactive, wait for foreground and recheck the installed version
  and workout state first.
- Launch Android's confirmation immediately when requested. Cover the narrow
  commit-to-callback background race with a local continuation notification and a
  safe foreground recovery path. Never create a duplicate installer session to
  recover blindly.
- Use a dedicated updater notification channel for that continuation. If
  notifications are unavailable, recover on the next foreground without creating
  a duplicate installer session.
- Treat installer commit as installation requested. Report success only when
  native reconciliation finds the requested or a higher installed version code.
- Keep automatic-check failures quiet. Show actionable, specific outcomes for
  manual checks and update attempts.
- Validate the installer lifecycle on API 26, API 31, API 35 or newer, and the
  personal physical device. Do not claim installation validation from JavaScript
  tests alone.
- Block confirmation of an update while a workout editor has transient input.
  Require the user to commit or discard that input first. Do not block solely
  because a persisted historical draft exists.
- Allow user cancellation through download and before installer commit. Remove the
  app-owned Cancel action once Android owns the committed installer request.
- Keep the update-details surface visible and non-dismissible through download and
  verification. Close it when Android takes over. Mirror current status and
  recovery actions in Settings.

## Consequences

- Installer session identity, intended version, exclusion, and terminal outcome
  need durable native ownership. JavaScript state mirrors rather than owns them.
- Native state also owns the verified file and pending confirmation. SQLite owns
  check caching and dismissal. Zustand and React own presentation only.
- A restarted attempt that never committed becomes interrupted and releases its
  resources. A committed installer request stays excluded until native
  reconciliation reaches a terminal outcome.
- App foreground transitions need stage-aware handling so deliberate system
  handoffs are not mistaken for interrupted downloads.
- Success can become visible only after Android has completed replacement and the
  app has reconciled its installed package metadata.
- Workout editors need a shared way to publish transient-edit state to the update
  guard without moving database ownership into UI components.
