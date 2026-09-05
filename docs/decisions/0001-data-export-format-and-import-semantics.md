# Data export format and import semantics

- **Status**: Accepted
- **Decision**: 0001
- **Date**: 2026-09-05

## Context

LiftLog promises local, offline, no-account data ownership. Users need a manual
way to back up their data, recover from data loss, and move their data between
iOS and Android devices.

The primary store is a live SQLite database configured with WAL journaling.
Copying only the database file can miss WAL state, and restoring a physical
database couples compatibility to SQLite and Drizzle migration history. Durable
preferences also span SQLite and MMKV, while personal records and Health Connect
step rows have different ownership from workout history.

## Decision

### Product contract

Version 1 provides complete manual backup and replace-all restore. It does not
provide scheduled backups, selective export, merge import, encryption, partial
recovery, or a third-party interchange contract.

The feature works offline and across iOS and Android. Exported files use the
name `liftlog-backup-YYYY-MM-DD.json`. Before sharing a file, LiftLog warns that
it contains private, readable workout data.

### Logical backup format

A backup is UTF-8 JSON containing a versioned envelope and logical domain data,
not a SQLite database or generated migration artifact. The envelope starts with:

```json
{
  "format": "liftlog-backup",
  "schemaVersion": 1,
  "createdAt": "2026-09-05T12:00:00.000Z",
  "appVersion": "1.0.0",
  "data": {}
}
```

`schemaVersion` versions the backup contract independently from Drizzle's
migration index. A newer app migrates supported older backup versions in memory
before validation. An older app rejects an unsupported newer version without
changing local state.

The `data` object contains:

- Exercises, including built-in, custom, and archived rows needed to preserve
  stable relationships.
- Workouts, workout exercises, sets, templates, and template exercises.
- The active workout and unexpired persisted workout edits.
- User-owned SQLite preferences from an explicit allowlist.
- The MMKV theme preference.

The backup excludes:

- Health Connect step cache and sync markers. Health Connect remains the
  authority and eligible data is resynced after import.
- Expired historical drafts already eligible for normal cleanup.
- Personal records. They are derived from imported completed sets and rebuilt.
- Seed markers, update check/dismissal metadata, and other operational metadata.
- Runtime rest timers, scheduled notifications, update state, downloaded update
  files, OS permissions, and bundled assets.

The JSON is not signed and carries no authenticity guarantee. Manual editing is
unsupported, but an edited file may import when it passes the same strict
validation as any other backup.

### Export consistency

Export reads a consistent logical snapshot through the app's database owner and
repository layer. It serializes arrays in deterministic dependency and row order
so backups are diagnosable and tests are stable. It never copies an open SQLite
file or its WAL sidecar.

### Import validation

Import is strict and all-or-nothing. Before any persistent write, LiftLog:

1. Checks file size and JSON parseability.
2. Checks the format identifier and supported schema version.
3. Migrates supported older envelopes in memory.
4. Validates every field, enum, timestamp, finite number, and configured length
   or row-count limit.
5. Rejects duplicate identities, dangling relationships, invalid ordering, and
   active normalized exercise-name conflicts.
6. Builds a preview with backup time, source app version, and entity counts.

Validation failures use actionable categories and do not salvage individual
rows. Logs and telemetry never contain backup contents, workout values, notes,
identifiers, or file paths.

### Replacement and rollback

After preview, LiftLog warns that local data will be replaced and requires one
explicit confirmation. If a workout or rest timer is active, the warning calls
out that impact.

Before mutation, LiftLog creates one complete safety backup in private durable
app storage. A failed safety write aborts the import. The new safety backup only
replaces the previous one after the candidate import has passed validation.

User-owned SQLite state is replaced in one repository-owned transaction. The
transaction preserves operational `app_meta` rows, replaces allowlisted user
preferences, clears excluded caches, inserts data in dependency order, rebuilds
personal records, and checks foreign-key integrity. Any failure rolls back the
transaction.

Theme restoration is coordinated outside SQLite. The orchestrator records the
previous MMKV value and applies compensating restoration if a later step fails.
Runtime timers and their scheduled notifications are cancelled only after the
user confirms replacement.

After success, database consumers refresh through a controlled provider and
navigation reset. If a reliable live refresh cannot be guaranteed, LiftLog asks
the user to restart instead of presenting mixed pre-import and imported state.

The private backup enables a conditional `Undo last import` action that survives
an app restart. Undo uses the same preview, confirmation, validation, and atomic
replacement path. It is one-way: after successful undo, the safety backup is
consumed and no redo is offered.

## Consequences

- Backups remain portable across platforms and can evolve independently from
  database migrations.
- Import code must maintain explicit DTOs, validators, and version migrations.
- Replace-all behavior is predictable and testable but does not combine data
  from two devices.
- Plain JSON maximizes recoverability but requires a clear privacy warning and
  careful handling of temporary files.
- SQLite and MMKV cannot share one transaction, so orchestration needs explicit
  compensation and failure tests.
- The safety backup consumes private device storage and disappears if the app is
  uninstalled or its storage is cleared.

## Alternatives considered

### Copy the SQLite database

Rejected because WAL consistency, an open database connection, schema coupling,
and non-SQLite preferences make it unsafe as the public backup contract.

### Merge imported and local data

Deferred because identifier collisions, normalized exercise-name conflicts,
duplicate workouts, templates, and source links need user-visible resolution
rules.

### Encrypted backups

Deferred because passphrase recovery, key derivation, crypto-format evolution,
and cross-platform testing would materially expand version 1.

### Partial recovery

Rejected for version 1 because silently omitting invalid records undermines the
promise of a complete restore and can break domain relationships.
