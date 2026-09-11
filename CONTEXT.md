# Domain context

## Workout timing

- **Rest timer**: A countdown representing a recovery period between workout
  efforts.
- **Rest timer deadline**: The absolute moment at which a rest timer completes.
  It remains authoritative regardless of when observers react to it.
- **Rest timer completion**: A rest timer naturally reaching its deadline. It is
  distinct from pausing or cancelling the timer.
- **Paused rest timer**: A rest timer whose remaining recovery time is preserved
  without advancing toward a deadline or producing a notification.
- **Rest timer cancellation**: Ending a rest timer before its deadline without
  producing completion feedback.
- **Rest timer notification**: The system-level alert for a rest timer completion
  while LiftLog is not in the foreground. Foreground completion feedback is not
  a rest timer notification.
- **Rest timer notification acknowledgement**: The user handling a delivered rest
  timer notification by opening or replacing it. Acknowledgement is neither rest
  timer completion nor rest timer cancellation.
- **Rest timer notification preference**: The user's choice to allow rest timer
  notifications. It is distinct from notification authorization controlled by
  the operating system.
- **Foreground completion feedback**: The in-app sound, haptics, and message used
  when a rest timer completes while LiftLog is active.

## Application updates

- **Full APK update**: An Android application-binary update. LiftLog downloads a
  signed APK and asks Android's package installer to replace the installed app.
  This is distinct from an Expo or JavaScript OTA update.
- **Direct-distribution build**: An Android build installed outside an app store
  and updated from LiftLog's public GitHub Releases channel.
- **Update release**: A published, stable GitHub Release containing the APK and
  its machine-readable release metadata. Drafts and prereleases are not update
  releases.
- **Update manifest**: The `update.json` asset in an update release. It identifies
  the exact APK and describes its version, byte size, and checksum. It never
  supplies an arbitrary download URL.
- **Update exclusion**: The mutual-exclusion rule preventing an application
  update and an active workout from starting or executing at the same time.
- **Active workout**: A persisted workout whose status is `in_progress`. A
  historical workout draft is not an active workout.
- **Update attempt**: The user-initiated permission, download, verification, and
  installer-commit lifecycle protected by update exclusion.
- **Update failure diagnostic**: A sanitized, durable account of an unexpected
  failure in an update attempt. Exception-based and Android-owned failures have
  distinct reporting ownership so one failure is not reported twice.
- **Diagnostic backlog**: The bounded collection of update failure diagnostics
  that the local error reporter has not yet accepted. It never prevents an update
  attempt from proceeding.
- **Diagnostic acknowledgement**: Confirmation that an update failure diagnostic
  was accepted by the local error reporter. It does not guarantee delivery to the
  remote observability service.
- **Installer request**: A committed Android package-installer session. It is not
  proof that the update succeeded; success requires reconciliation against the
  installed native version.
- **Transient workout edit**: Workout input currently held only by a mounted editor
  and not yet committed to SQLite. Unlike a persisted historical draft, it must be
  resolved before an update attempt can begin.
