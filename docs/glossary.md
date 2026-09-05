# Glossary

Shared terms for LiftLog's product, persistence, and data backup behavior.

## Active workout

The persisted workout currently being logged. It is user-owned data and is
included in a complete backup. Runtime timers and notifications associated with
it are transient and are not included.

## Backup

A complete, logical snapshot of portable user-owned LiftLog data represented by
a versioned JSON envelope. A backup is not a copy of the SQLite database file.

## Backup envelope

The top-level JSON object that identifies a LiftLog backup, its backup schema
version, creation time, source app version, and domain data payload.

## Backup schema version

The version of the public JSON backup contract. It is independent from the app
version, SQLite schema version, and Drizzle migration index.

## Cache data

Locally stored data copied or derived from another authority and safe to rebuild
or resync. Health Connect step rows are cache data and are excluded from backups.

## Complete backup

A backup containing all portable user-owned state required to restore LiftLog's
supported training experience. Version 1 does not offer selective backups.

## Derived data

Data that can be deterministically rebuilt from authoritative user-owned data.
Personal records are derived from imported workouts and sets and are rebuilt
after import rather than exported.

## Historical draft

A persisted temporary workout used while creating or editing historical data.
Unexpired drafts may preserve current work; drafts already eligible for normal
cleanup are excluded from backups.

## Import

The validated operation that restores a LiftLog backup by replacing portable
user-owned state. Import does not merge the backup with current state.

## Operational metadata

Device or app-lifecycle state that is not portable user content, such as seed
markers, update-check timestamps, dismissed update versions, and sync markers.
Import preserves or regenerates this metadata instead of taking it from a file.

## Replace-all import

Import semantics where the backup becomes the complete portable user-owned state
after one atomic operation. Current data is not retained or deduplicated into
the imported data.

## Safety backup

The single private backup LiftLog creates after candidate validation and before
replacement. It supports one-way undo and is never exposed as a public backup
unless the user separately exports it.

## Source snapshot

Persisted workout JSON used by existing workout editing and provenance behavior.
It is domain content inside a workout row, not the top-level backup envelope.

## Undo import

A one-way restore of the safety backup through the normal validated replacement
pipeline. A successful undo consumes the safety backup and does not create redo.

## User-owned data

Portable state created or intentionally configured by the user, including
training history, exercises, templates, active work, notes, and allowlisted
preferences. Caches, derived rows, operational metadata, OS permissions, and
runtime state are not user-owned backup data.
