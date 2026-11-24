# Glossary

Shared terms for LiftLog's product, persistence, workout timing, application
updates, and data backup behavior. Use these terms verbatim in code, docs, and
GitHub issues.

## Workouts

**Active workout**:
A persisted workout whose status is `in_progress`, currently being logged. A
historical draft is not an active workout. It is user-owned data and is included
in a complete backup; runtime timers and notifications associated with it are
transient and are not included.

**Historical draft**:
A persisted temporary workout used while creating or editing historical data.
Unexpired drafts may preserve current work; drafts already eligible for normal
cleanup are excluded from backups.

**Transient workout edit**:
Workout input currently held only by a mounted editor and not yet committed to
SQLite. Unlike a persisted historical draft, it must be resolved before an update
attempt can begin.

**Source snapshot**:
Persisted workout JSON used by existing workout editing and provenance behavior.
It is domain content inside a workout row, not the top-level backup envelope.

## Workout timing

**Rest timer**:
A countdown representing a recovery period between workout efforts.

**Rest timer deadline**:
The absolute moment at which a rest timer completes. It remains authoritative
regardless of when observers react to it.

**Rest timer completion**:
A rest timer naturally reaching its deadline. It is distinct from pausing or
cancelling the timer.

**Paused rest timer**:
A rest timer whose remaining recovery time is preserved without advancing toward
a deadline or producing a notification.

**Rest timer cancellation**:
Ending a rest timer before its deadline without producing completion feedback.

**Rest timer notification**:
The Android system-level alert for a rest timer completion while LiftLog is not
in the foreground. Foreground completion feedback is not a rest timer
notification.

**Rest timer notification acknowledgement**:
The user handling a delivered rest timer notification by opening or replacing it.
Acknowledgement is neither rest timer completion nor rest timer cancellation.

**Rest timer notification preference**:
The Android user's choice to allow rest timer notifications. It is distinct from
notification authorization controlled by the operating system.

**Foreground completion feedback**:
The in-app sound, haptics, and message used when a rest timer completes while
LiftLog is active.

## Application updates

**Full APK update**:
An Android application-binary update. LiftLog downloads a signed APK and asks
Android's package installer to replace the installed app. This is distinct from
an Expo or JavaScript OTA update.

**Direct-distribution build**:
An Android build installed outside an app store and updated from LiftLog's public
GitHub Releases channel.

**Update release**:
A published, stable GitHub Release containing the APK and its machine-readable
release metadata. Drafts and prereleases are not update releases.

**Update manifest**:
The `update.json` asset in an update release. It identifies the exact APK and
describes its version, byte size, and checksum. It never supplies an arbitrary
download URL.

**Update exclusion**:
The mutual-exclusion rule preventing an application update and an active workout
from starting or executing at the same time.

**Update attempt**:
The user-initiated permission, download, verification, and installer-commit
lifecycle protected by update exclusion.

**Installer request**:
A committed Android package-installer session. It is not proof that the update
succeeded; success requires reconciliation against the installed native version.

**Update failure diagnostic**:
A sanitized, durable account of an unexpected failure in an update attempt.
Exception-based and Android-owned failures have distinct reporting ownership so
one failure is not reported twice.

**Diagnostic backlog**:
The bounded collection of update failure diagnostics that the local error
reporter has not yet accepted. It never prevents an update attempt from
proceeding.

**Diagnostic acknowledgement**:
Confirmation that an update failure diagnostic was accepted by the local error
reporter. It does not guarantee delivery to the remote observability service.

## Data ownership

**User-owned data**:
Portable state created or intentionally configured by the user, including
training history, exercises, templates, active work, notes, and allowlisted
preferences. Caches, derived rows, operational metadata, OS permissions, and
runtime state are not user-owned backup data.

**Cache data**:
Locally stored data copied or derived from another authority and safe to rebuild
or resync. Health Connect step rows are cache data and are excluded from backups.

**Derived data**:
Data that can be deterministically rebuilt from authoritative user-owned data.
Personal records are derived from imported workouts and sets and are rebuilt
after import rather than exported.

**Operational metadata**:
Device or app-lifecycle state that is not portable user content, such as seed
markers, update-check timestamps, dismissed update versions, and sync markers.
Import preserves or regenerates this metadata instead of taking it from a file.

## Backup and import

**Backup**:
A complete, logical snapshot of portable user-owned LiftLog data represented by a
versioned JSON envelope. A backup is not a copy of the SQLite database file.

**Backup envelope**:
The top-level JSON object that identifies a LiftLog backup, its backup schema
version, creation time, source app version, and domain data payload.

**Backup schema version**:
The version of the public JSON backup contract. It is independent from the app
version, SQLite schema version, and Drizzle migration index.

**Complete backup**:
A backup containing all portable user-owned state required to restore LiftLog's
supported training experience. Version 1 does not offer selective backups.

**Import**:
The validated operation that restores a LiftLog backup by replacing portable
user-owned state. Import does not merge the backup with current state.

**Replace-all import**:
Import semantics where the backup becomes the complete portable user-owned state
after one atomic operation. Current data is not retained or deduplicated into the
imported data.

**Safety backup**:
The single private backup LiftLog creates after candidate validation and before
replacement. It supports one-way undo and is never exposed as a public backup
unless the user separately exports it.

**Undo import**:
A one-way restore of the safety backup through the normal validated replacement
pipeline. A successful undo consumes the safety backup and does not create redo.

## Automatic backups

**Backup snapshot**:
An immutable recovery point containing LiftLog's user-owned backup data at a
particular moment. It is not a synchronized or live copy of application state.

**Automatic backup**:
An opt-in backup snapshot stored remotely after LiftLog determines that a backup
is due and the backup data has changed.

**Manual backup**:
A user-requested backup check that can connect or reauthenticate in the
foreground. It does not require automatic backups to be enabled and does not
create a duplicate unchanged snapshot.

**Backup stream**:
The ordered history of automatic backup snapshots produced by one LiftLog
installation. Installations using the same remote account have separate backup
streams.

**Backup check**:
An inexact opportunity for LiftLog to determine whether an automatic backup is
due. A successful check does not imply that a new backup snapshot was created.

**Backup retention**:
The rule that preserves the seven newest successful snapshots in each backup
stream. Maintenance failures do not invalidate an otherwise successful backup.

**Connected backup account**:
The remote account currently authorized to store and retrieve automatic backups
for this LiftLog installation. Disconnecting it does not delete its existing
backup snapshots.

**Fresh installation**:
A LiftLog installation whose one-time recovery choice has not yet been completed
or dismissed. Seeded exercise data does not make an installation non-fresh.

**Cloud restore**:
A full replacement of user-owned backup data from a remotely stored backup
snapshot. It has the same validation, migration, confirmation, rollback, and undo
guarantees as a file import.

**Installation label**:
A non-account identifier that distinguishes the source installation of a backup
stream. It is remote snapshot metadata, not backup data.
