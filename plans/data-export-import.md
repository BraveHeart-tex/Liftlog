# 006 - Data export and import

- **Status**: TODO
- **Severity**: HIGH
- **Category**: Data ownership and recovery
- **Estimated scope**: Versioned domain codec, transactional replacement, native file flows, settings UI, and integration tests
- **Decision**: [`ADR 0001`](../docs/decisions/0001-data-export-format-and-import-semantics.md)

## Problem

LiftLog stores all training data locally but has no supported way to back it up,
recover it, or move it to another device. Copying `workout.db` is not a safe
solution: SQLite uses WAL journaling, the connection is provider-owned, schema
compatibility follows internal migrations, and the theme preference lives in
MMKV rather than SQLite.

The feature must uphold the offline and privacy-first product promise while
protecting current data from corrupt, incompatible, partial, or interrupted
imports.

## Target

Add a `Data & Backup` settings section that supports:

- Exporting one complete, human-readable JSON backup through native sharing.
- Importing a backup selected through the native document picker.
- Previewing and confirming a strict replace-all restore.
- Recovering through one private, persistent `Undo last import` backup.

The public contract and replacement semantics are fixed by
[`ADR 0001`](../docs/decisions/0001-data-export-format-and-import-semantics.md).

## Domain inventory

### Exported SQLite data

- `exercises`
- `workouts`, including the active workout and unexpired persisted edits
- `workout_exercises`
- `sets`
- `workout_templates`
- `workout_template_exercises`
- Allowlisted user preferences from `app_meta`

### Exported non-SQLite data

- `settings.theme_preference` from the `liftlog.settings` MMKV instance

### Rebuilt, cleared, or preserved data

- Rebuild `personal_records` from imported completed sets.
- Clear `health_step_days`, then let the existing Health Connect flow resync if
  imported settings enable it and the device grants access.
- Preserve local seed and update lifecycle metadata rather than importing it.
- Exclude expired historical drafts, runtime timers, notifications, OS
  permissions, downloaded updates, and bundled assets.

## Proposed contract

Create a persistence-independent DTO owned by a new backup domain module. Keep
the wire names explicit and stable; do not serialize Drizzle row objects by
reflection.

```ts
type LiftLogBackupV1 = {
  format: 'liftlog-backup';
  schemaVersion: 1;
  createdAt: string;
  appVersion: string;
  data: {
    exercises: BackupExerciseV1[];
    workouts: BackupWorkoutV1[];
    workoutExercises: BackupWorkoutExerciseV1[];
    sets: BackupSetV1[];
    workoutTemplates: BackupWorkoutTemplateV1[];
    workoutTemplateExercises: BackupWorkoutTemplateExerciseV1[];
    settings: BackupSettingsV1;
    themePreference: BackupThemePreferenceV1;
  };
};
```

Use a discriminated parser at the envelope boundary:

```ts
parseBackupEnvelope(unknownValue): ParsedSupportedBackup
migrateBackupToCurrent(parsedBackup): LiftLogBackupCurrent
validateBackupGraph(currentBackup): ValidatedLiftLogBackup
```

Parsing establishes field validity. Graph validation establishes cross-row
invariants. Only `ValidatedLiftLogBackup` may reach replacement code.

## Import lifecycle

```text
pick file
  -> enforce byte limit and parse envelope
  -> migrate supported version in memory
  -> validate fields and relationship graph
  -> show metadata, counts, active-workout impact, and privacy warning
  -> user confirms
  -> write private safety backup atomically
  -> cancel runtime timer and scheduled notification
  -> replace SQLite user data in one transaction
  -> rebuild personal records and check foreign keys
  -> apply theme with compensating rollback protection
  -> refresh providers and reset navigation, or require restart
  -> expose one-way Undo last import
```

No persistent data changes before confirmation. Cancellation at the picker,
preview, warning, or share sheet is a normal outcome rather than an error.

## Steps

### Phase 0 - Resolve implementation prerequisites

- [ ] Confirm the Expo SDK-compatible native document picker and file-sharing
      approach on both platforms.
- [ ] Prefer existing platform capabilities when they provide reliable file URI
      access and sharing. If `expo-document-picker` or `expo-sharing` is needed,
      obtain explicit approval before adding production dependencies.
- [ ] Define conservative maximum file bytes, entity counts, string lengths, and
      nested JSON limits from realistic database sizes and mobile memory budgets.
- [ ] Decide the exact unexpired historical-draft filter by reusing the current
      cleanup policy rather than duplicating a new age constant.
- [ ] Decide whether controlled provider remount passes live-state tests; adopt
      restart-required completion if any consumer can retain stale state.

### Phase 1 - Add the versioned backup codec

- [ ] Add explicit V1 DTOs for every exported table and allowlisted preference.
- [ ] Add the envelope parser, supported-version dispatch, and a no-op V1-to-
      current migration boundary so later versions have a stable extension point.
- [ ] Validate required keys, enums, ISO timestamps, nullable fields, finite
      numbers, JSON substructures, string lengths, and configured collection
      limits without coercion.
- [ ] Reject duplicate primary IDs, dangling foreign/source references, invalid
      parent-child ownership, conflicting order values where the domain requires
      uniqueness, and active normalized exercise-name conflicts.
- [ ] Return stable user-facing error categories: unreadable file, invalid JSON,
      unrelated file, unsupported version, invalid backup, and limit exceeded.
- [ ] Keep detailed validation paths available for development diagnostics while
      excluding values, IDs, notes, and file paths from production telemetry.

### Phase 2 - Implement consistent export reads

- [ ] Add repository-owned snapshot queries using the existing database instance;
      do not open a second app database lifecycle.
- [ ] Read one consistent snapshot and sort every collection deterministically by
      identity or domain order before serialization.
- [ ] Export all exercise rows required to preserve relationship IDs, including
      built-in and archived exercises.
- [ ] Whitelist portable settings. Never dump `app_meta` wholesale.
- [ ] Read theme preference through its existing owner and compose it into the
      envelope at the feature orchestration boundary.
- [ ] Serialize UTF-8 JSON to a temporary private file, complete the write, then
      atomically promote it before opening the share sheet.
- [ ] Remove temporary public-export files after sharing completes or is cancelled.

### Phase 3 - Implement transactional replacement

- [ ] Add one repository transaction that receives only validated current-format
      data and owns replacement ordering and invariants.
- [ ] Delete existing dependent user rows child-first while preserving operational
      `app_meta` rows.
- [ ] Clear `health_step_days` and `personal_records` as non-imported state.
- [ ] Insert exercises, workouts, templates, join rows, and sets parent-first.
- [ ] Replace only allowlisted user preference keys.
- [ ] Rebuild personal records inside the replacement boundary using the existing
      deterministic repository logic.
- [ ] Run `foreign_key_check` before commit and treat any result as a failure.
- [ ] Wrap the complete transaction in one database span with safe metadata only.

### Phase 4 - Add safety backup and undo orchestration

- [ ] Store one safety backup in durable private app storage, not cache storage.
- [ ] Use a temporary file plus atomic promotion so interruption cannot replace a
      valid safety backup with a partial file.
- [ ] Never start mutation if the safety backup cannot be written and revalidated.
- [ ] Preserve the previous theme value and compensate both SQLite and theme state
      if cross-store orchestration fails.
- [ ] Cancel the active rest timer and scheduled notification after confirmation,
      immediately before replacement.
- [ ] Persist only a minimal non-sensitive undo-availability marker; derive
      preview metadata from the safety envelope itself.
- [ ] Route undo through the same parser, validator, preview, confirmation, and
      replacement services without creating another safety backup; consume the
      existing safety backup after success and do not create redo.
- [ ] Ensure failed import or failed undo leaves the prior undo option intact.

### Phase 5 - Add native file flows and state refresh

- [ ] Use the native picker with JSON MIME/type hints while still validating file
      content rather than trusting names or MIME metadata.
- [ ] Copy picker-provided content URIs into controlled private temporary storage
      before parsing when required by platform lifetime rules.
- [ ] Share `liftlog-backup-YYYY-MM-DD.json` through the native share sheet after a
      readable-data privacy warning.
- [ ] Treat picker/share cancellation distinctly from operational failure.
- [ ] After replacement, refresh database-backed providers and imported settings,
      reset navigation to a stable settings or home route, and trigger eligible
      Health Connect resync.
- [ ] Fall back to a clear restart-required success state if the provider refresh
      cannot guarantee that every live query and store discarded old data.

### Phase 6 - Build the settings experience

- [ ] Add a `Data & Backup` section matching existing settings section and row
      conventions.
- [ ] Add `Export backup`, `Import backup`, and conditional `Undo last import`
      actions with accessible labels and disabled/loading states.
- [ ] Add the readable-data warning before export.
- [ ] Add an import preview with created time, source app version, collection
      counts, active-workout impact, and replace-all warning.
- [ ] Use one explicit destructive confirmation without a typed phrase.
- [ ] Add concise success, cancellation, unsupported-version, invalid-file,
      safety-backup, replacement, and restart-required states.
- [ ] Prevent double submission across export, import, confirmation, and undo.
- [ ] Respect reduced-motion rules for every transition or loading indicator.

### Phase 7 - Test failure and recovery paths

- [ ] Unit-test V1 parsing, graph validation, limits, error categories, and future-
      version rejection.
- [ ] Round-trip a representative database with every tracking type, nullable
      field, notes, source link, superset, archived/custom exercise, template,
      preference, active workout, and unexpired draft.
- [ ] Verify deterministic export ordering and Unicode normalized-name conflicts.
- [ ] Verify newer-code migration dispatch with a synthetic older fixture.
- [ ] Verify malformed JSON, unrelated JSON, truncation, missing parents, duplicate
      IDs, invalid enums/numbers, oversized input, and newer-version files perform
      zero persistent writes.
- [ ] Inject failures during safety-file promotion, each transaction stage, record
      rebuild, foreign-key checking, theme application, provider refresh, and undo.
- [ ] Prove transaction rollback, theme compensation, safety-backup retention, and
      one-way undo across an app restart.
- [ ] Verify Health Connect cache is excluded and cleared without changing OS
      permissions, and resync only runs when eligible.
- [ ] Exercise iOS and Android picker/share cancellation and content-URI behavior.
- [ ] Verify no backup content or sensitive metadata reaches logs or spans.

### Phase 8 - Document and verify

- [ ] Update the ADR and glossary if implementation discoveries change terminology
      or consequences; require a new decision before changing accepted semantics.
- [ ] Document supported backup versions and recovery-facing error behavior near
      the codec.
- [ ] Run `./node_modules/.bin/tsc --noEmit --project ./tsconfig.json`.
- [ ] Run `./node_modules/.bin/eslint <changed-files>`.
- [ ] Run `./node_modules/.bin/prettier --check <changed-files>`.
- [ ] Run the narrow backup/import tests, then `pnpm run test`.
- [ ] Run existing database integration checks, including cascade, unique-name,
      and settings fallback coverage.
- [ ] Complete a manual device matrix: iOS export/import/undo, Android export/
      import/undo, iOS-to-Android, Android-to-iOS, cancellation, active workout,
      offline operation, app restart, and large valid backup.

## Boundaries

- Do not copy, replace, or expose the live SQLite database or WAL files.
- Do not couple backup versions to Drizzle migrations or hand-edit generated
  migrations, snapshots, journals, or SQL.
- Do not import `app_meta` wholesale.
- Do not merge, deduplicate, or partially salvage backup rows in version 1.
- Do not add encryption, scheduled/cloud backup, selective export, or third-party
  interchange behavior.
- Do not restore Health Connect permissions, cached steps, runtime timers,
  notifications, update downloads, or operational metadata.
- Do not log file contents, paths, user values, notes, workout IDs, or validation
  error values.
- Do not add production dependencies without explicit approval.
- Keep routes and UI free of Drizzle queries and persistence invariants.
- Do not refactor unrelated database, settings, workout, or navigation code.

## Acceptance criteria

- A user can export a complete readable backup offline through native sharing on
  iOS and Android.
- A user can import a valid supported backup across platforms and recover the
  agreed portable state with relationships intact.
- Import shows a complete preview and never mutates persistent data before
  explicit confirmation.
- Invalid, unsupported, oversized, cancelled, or interrupted imports leave current
  SQLite and MMKV state unchanged.
- Successful import replaces portable user state atomically, rebuilds personal
  records, clears excluded caches, and exposes one persistent one-way undo.
- Undo restores the pre-import state and is consumed only after successful restore.
- Providers never display mixed pre-import and imported state; restart is required
  when safe live refresh cannot be proven.
- Backup evolution is covered by version dispatch and does not depend on database
  migration numbers.
- Logs, spans, temporary files, and UI errors do not expose private backup data.
- All automated checks and the cross-platform manual matrix pass.
