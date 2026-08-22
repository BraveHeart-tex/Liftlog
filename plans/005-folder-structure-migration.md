# 005 — Migrate to domain-first folder structure

- **Status**: TODO
- **Category**: Architecture
- **Estimated scope**: Large, incremental migration
- **Dependencies**: None

## Goal

Move the codebase from a broad feature-plus-technical-folders structure to a
domain-first structure with shallow capability modules. This plan is the
source of truth for where new and moved files belong.

No migration work is authorized by this plan alone. Execute the phases only
after separately approving the relevant phase.

## Current audit

- `src/features/workouts` contains 114 files.
- Workouts currently mixes active sessions, templates, history, set entry,
  exercise selection, progression, supersets, and rest timers.
- `src/features/workout-log` overlaps with workout history and calendar flows.
- `src/app` contains route files with substantial screen implementation.
- App-wide providers and boundaries currently live under `src/components`.
- Graphify found no import cycles in the current graph.

## Target structure

```text
src/
  app/                         # Thin Expo Router route adapters
  components/
    ui/                        # Generic UI primitives
    styled/                    # Generic native/third-party wrappers
  providers/                   # App-wide providers and error boundaries
  db/                          # Schema, client, migrations, seeds
  features/
    workouts/
      active/
      templates/
      history/
        calendar/
      set-entry/
      exercise-selection/
      shared/
    rest-timer/
    exercises/
    progress/
    settings/
    steps/
  lib/
    animations/
    audio/
    db/
    haptics/
    observability/
    utils/
  theme/

tests/                         # Mirrors source domains
```

Capability folders may contain local `components`, `hooks`, repositories,
services, types, and utilities when their size justifies those folders. Do
not create empty technical folders in advance.

## Placement rules

1. Organize by business capability, not by screen or technical type.
2. Promote a sub-feature when it owns state, lifecycle, data access,
   integrations, multiple screens, or independent tests.
3. Keep nesting shallow. Avoid paths such as
   `workouts/set-forms/rest-timers`.
4. Keep route files in `src/app` thin: route params, navigation metadata, and
   rendering a feature-owned screen.
5. Keep repositories and domain services inside their owning capability.
6. Keep `src/db` limited to database infrastructure, schema, migrations, and
   seed/bootstrap support.
7. Keep generic UI primitives in `src/components/ui` and generic wrappers in
   `src/components/styled`. Domain composites stay in features.
8. Use `features/workouts/shared` only for workout-specific code shared by
   multiple workout capabilities.
9. Keep database row/schema types in `src/db`. Keep feature view models,
   inputs, and domain types with the feature.
10. Keep tests in a mirrored top-level `tests` tree; keep database/integration
    tests in explicit integration folders.

## Dependency rules

```text
app → features → db/platform/shared
```

- Features must not import route files.
- Shared code must not import features.
- Cross-feature imports use small intentional public APIs.
- Avoid giant barrel files that export every component and hook.
- Use existing TypeScript aliases and ESLint checks before adding tooling or
  dependencies.

## Migration phases

### Phase 1 — Establish the contract

- [ ] Add this plan to the architecture documentation/index.
- [ ] Confirm the dependency direction and placement rules in review.
- [ ] Identify the public API of each feature before moving consumers.
- [ ] Record current import paths for the files being migrated.

### Phase 2 — Move app-shell infrastructure

- [ ] Move app-wide providers and error boundaries from `components` to
      `src/providers` where appropriate.
- [ ] Keep generic UI and styled wrappers in `src/components`.
- [ ] Keep database bootstrap ownership explicit between `providers` and
      `db`.

### Phase 3 — Consolidate workout history

- [ ] Move `src/features/workout-log` behavior into
      `src/features/workouts/history`.
- [ ] Put calendar-specific code under `history/calendar`.
- [ ] Co-locate completed-workout list, detail, edit, and repository logic
      under history capabilities.
- [ ] Preserve existing route URLs while changing implementation ownership.

### Phase 4 — Extract rest timer

- [ ] Move rest-timer state, components, hooks, notifications, audio, and
      haptics into `src/features/rest-timer`.
- [ ] Keep timer preferences persisted by settings.
- [ ] Keep timer runtime behavior owned by rest-timer.
- [ ] Expose only the small API required by workouts and settings.
- [ ] Preserve app-level audio-mode configuration; do not add leaf-level audio
      mode calls.

### Phase 5 — Split the workouts domain

- [ ] Move active-session code into `workouts/active`.
- [ ] Move template creation/editing code into `workouts/templates`.
- [ ] Move set-form code into `workouts/set-entry`.
- [ ] Move workout-specific exercise pickers into
      `workouts/exercise-selection`.
- [ ] Move shared workout-domain code into `workouts/shared` only when used by
      multiple capabilities.
- [ ] Split repositories by capability responsibility, not database table.

### Phase 6 — Thin route adapters

- [ ] Move substantial screen composition out of `src/app` route files.
- [ ] Leave route parsing, navigation, metadata, and feature-screen rendering
      in the route files.
- [ ] Preserve Expo Router route names and navigation behavior.

### Phase 7 — Enforce and clean up

- [ ] Update imports after each capability migration.
- [ ] Add or extend ESLint checks for forbidden dependency directions.
- [ ] Remove obsolete folders only after repository-wide search proves they
      are unused.
- [ ] Keep tests aligned with the final feature tree.

## Verification after each phase

- [ ] `pnpm run ts-check`
- [ ] `pnpm run lint`
- [ ] `pnpm test`
- [ ] Verify affected Expo Router navigation flows.
- [ ] Run `graphify update .` after source changes.
- [ ] Confirm no unrelated worktree changes were overwritten.

## Completion criteria

- Every new file has one obvious owner under the placement rules.
- `src/features/workouts` contains shallow capability folders rather than a
  large mixed technical directory.
- `src/app` contains route adapters rather than business logic.
- Rest-timer runtime behavior is independently owned.
- Workout history and workout log have one domain owner.
- No feature imports route files or generic code imports features.
- Type-check, lint, tests, and affected navigation flows pass.

## Boundaries

- Do not add production dependencies for this migration.
- Do not redesign screens or change product behavior.
- Do not hand-edit generated migrations, snapshots, or SQL.
- Do not reorganize unrelated native/platform project files.
- Preserve existing uncommitted user changes while migrating.
