# ADR-0006: Reconcile rest timers with native notifications

- Status: Accepted
- Date: 2026-09-11

## Context

Rest timer completion must remain timely when LiftLog is backgrounded, locked, or
restarted without producing duplicate feedback while the app is active. A
JavaScript interval cannot provide background delivery, while a native
notification alone cannot own timer state or guarantee exact Android delivery
without additional system access.

## Decision

- Treat the rest timer deadline as the authority. JavaScript ticks and native
  notifications independently observe that deadline and never define completion.
- Keep timer transitions pure. A dedicated coordinator owns snapshot persistence,
  native scheduling, cancellation, presentation arbitration, and startup
  reconciliation.
- Persist a minimal, versioned runtime snapshot in a dedicated MMKV namespace.
  Restore running and paused timers after process death, expire paused snapshots
  after 24 hours, and exclude runtime snapshots and scheduled notifications from
  backups.
- Use foreground completion feedback only while LiftLog is active. Use one native
  local notification while LiftLog is inactive, backgrounded, locked, or
  terminated.
- Cancel pending delivery for pause, manual cancellation, replacement, invalid
  workout context, workout completion, or confirmed backup import. Natural
  completion clears runtime ownership without cancelling or dismissing a delivered
  notification.
- Store an opt-in rest timer notification preference with user-owned settings and
  include it in backup schema version 2. Migrate version-1 backups with the
  preference disabled. Never back up or restore OS authorization.
- On Android, use a new high-importance channel and request
  `SCHEDULE_EXACT_ALARM` special access when the user enables notifications. Fall
  back to inexact delivery with visible degraded status when access is unavailable.
- On iOS, use Time Sensitive delivery for user-enabled rest timer notifications.
  Use LiftLog's short completion sound on both platforms and leave final delivery
  control to OS notification, Focus, and channel settings.
- Keep at most one pending or visible rest timer notification. Starting a new timer
  dismisses the previous delivered rest alert before scheduling its replacement.

## Consequences

- Timer hydration must finish before timer consumers schedule or present feedback.
- Android requires native configuration and a system-settings handoff for exact
  alarm access. Existing installations require a versioned channel because channel
  importance cannot be raised in place.
- iOS requires the Time Sensitive Notifications capability. Users may still
  suppress delivery through OS settings.
- Permission refusal and exact-alarm refusal do not prevent timers or foreground
  feedback from working.
- Notification and persistence failures require sanitized diagnostics and explicit
  race-condition coverage, plus physical-device validation that JavaScript tests
  cannot provide.
