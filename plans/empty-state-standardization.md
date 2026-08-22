# 004 — Standardize empty and fallback states

- **Status**: TODO
- **Severity**: MEDIUM
- **Category**: UX consistency
- **Estimated scope**: Shared primitive plus app-wide call-site migration

## Problem

LiftLog has a shared `EmptyState`, but empty and fallback states still use
several incompatible patterns: hand-built centered text, list-specific JSX,
large feature-specific illustrations, dashed cards, and compact inline labels.
The same missing or unavailable data also has inconsistent actions, spacing,
icons, and copy.

The audit found:

- 20 existing `EmptyState` call sites.
- 1 bespoke exercise-search empty state.
- 2 bespoke Health Connect states.
- 1 bespoke no-sets card.
- 1 bespoke insufficient-progress-data state.
- 8 hand-built missing-entity screens.
- 1 hand-built cannot-edit fallback.
- Several inline value-level fallbacks such as `No PR yet` and `Tap to log sets`.

## Target

Evolve `src/components/ui/empty-state.tsx` into the canonical renderer for
empty, no-results, missing, error, unavailable, and insufficient-data states.
Keep `LoadingState` separate.

The shared contract should support:

```tsx
type EmptyStateKind =
  | 'empty'
  | 'no-results'
  | 'not-found'
  | 'error'
  | 'unavailable'
  | 'insufficient-data';

type EmptyStateLayout = 'page' | 'section' | 'inline';
```

The component should provide:

- Semantic `kind` and density `layout` variants.
- Existing `icon`, `title`, `description`, and `className` behavior.
- A composable `visual` slot for Health Connect and search-specific visuals.
- A composable `actions` slot for primary, secondary, or domain-specific actions.
- Temporary compatibility for the existing singular `action` prop.
- Consistent typography, icon treatment, spacing, surfaces, accessibility, and
  action layout using existing LiftLog tokens and primitives.

Screens own copy and navigation. The shared component owns structure and visual
rules. Do not add dependencies, decorative asset systems, or route awareness.

## Inventory and migration targets

### Page-level states

Migrate these to `EmptyState layout="page"` with semantic `kind` values and
consistent recovery actions:

- `src/app/(tabs)/workout/active/index.tsx` — active-workout load error and no
  active workout.
- `src/app/(tabs)/workout/active/edit-exercises.tsx` — missing active workout.
- `src/app/workouts/backfill/[id].tsx` — missing backfill workout.
- `src/app/workouts/edit/[id].tsx` — missing workout edit draft.
- `src/providers/database-error-boundary.tsx` — database failure.
- `src/app/exercises/[id].tsx` — missing exercise detail.
- `src/app/exercises/edit/[id].tsx` — missing exercise and non-custom exercise.
- `src/app/workouts/[id].tsx` — missing workout detail.
- `src/app/workouts/templates/[id].tsx` — missing template detail.
- `src/app/(tabs)/workout/exercise/[workoutExerciseId]/index.tsx` — missing
  active workout exercise.
- `src/app/(tabs)/workout/exercise/[workoutExerciseId]/history.tsx` — missing
  exercise history target.
- `src/app/workouts/backfill/exercise/[workoutExerciseId].tsx` — missing
  backfill exercise.
- `src/app/workouts/edit/exercise/[workoutExerciseId].tsx` — missing edit
  exercise.
- `src/providers/screen-error-boundary.tsx` — unexpected screen error.

### Section and list states

Migrate these to `EmptyState layout="section"`:

- Active workout edit: no exercises added.
- Exercise detail: no records yet.
- Workout detail: no logged exercises.
- Template detail: no draft exercises and no saved exercises.
- Workout log: no workouts for the selected day.
- Steps history: no step history.
- Exercise history: no history yet.
- Exercise picker: no-results for search, filter, recent, or custom views.
- Workout home: no recent workouts.
- Workout home: no templates.
- Template exercise editor: no exercises added.
- Active workout content: exercise-load error and no exercises yet.

### Domain-specific compositions

Retain domain behavior while composing from the shared shell:

- `src/app/(tabs)/exercises/index.tsx` — use `no-results` with custom visual
  and primary Create / secondary Clear actions.
- `src/features/steps/components/steps-empty-state.tsx` — use the shared shell
  with Health Connect visual, connect action, and privacy footer.
- `src/features/steps/components/steps-unavailable-state.tsx` — use the
  shared `unavailable` shell with platform-specific copy.
- `src/features/workouts/set-entry/components/set-form/set-form-empty-state.tsx` — use
  section density, dashed surface, and Add set action.
- `src/features/exercises/components/exercise-progress-chart.tsx` — use
  `insufficient-data` in a compact chart-local layout.

### Inline value-level states

Use the new `inline` treatment where a full empty-state block would be too
heavy:

- `src/features/workouts/active/components/active-workout-exercise-card.tsx` —
  `Tap to log sets`.
- `src/features/workouts/active/components/exercise-history-list.tsx` — `No PR yet`
  and `No prior 30-day data`.
- `src/features/workouts/active/components/active-workout-exercise-edit-row.tsx` —
  `No sets logged yet` in confirmation context.
- `src/features/steps/components/steps-summary-cards.tsx` — `Not enough data`.

## Steps

### Phase 0 — Baseline and contract

- [x] Complete the repository inventory and classify loading, empty,
      no-results, missing, error, unavailable, insufficient-data, and inline states.
- [ ] Extend `EmptyState` with `kind`, `layout="inline"`, `visual`, and
      `actions` without breaking existing consumers.
- [ ] Define the canonical page, section, and inline spacing/surface rules using
      existing semantic tokens.
- [ ] Add accessibility behavior for state titles and action groups.
- [ ] Add focused tests using the existing test setup where practical; do not
      add a testing dependency or broad snapshot suite.

### Phase 1 — Page-level fallback migration

- [ ] Replace hand-built missing exercise, workout, template, and workout
      exercise screens with the shared component.
- [ ] Replace the non-custom exercise edit fallback with `kind="unavailable"`.
- [ ] Standardize missing-entity recovery around Back or a safe destination.
- [ ] Standardize error recovery around Retry where the existing data flow can
      retry, otherwise Back or a safe destination.
- [ ] Migrate the screen error boundary to the shared error presentation.
- [ ] Preserve database-specific conflict copy and remediation behavior.

### Phase 2 — Section and list migration

- [ ] Migrate every existing `EmptyState` section call site to semantic `kind`
      and the new shared layout rules.
- [ ] Remove per-screen spacing and surface overrides that duplicate component
      variants.
- [ ] Standardize list-empty handling so loading never renders as an empty
      state and no-results states expose the correct reset/create action.
- [ ] Preserve list headers, footers, filtering, and bottom-sheet behavior.

### Phase 3 — Domain-specific compositions

- [ ] Refactor the exercise library empty state to use the shared shell while
      preserving search, filter reset, and custom-exercise creation behavior.
- [ ] Refactor Health Connect connect and unavailable states to share layout,
      typography, action treatment, and accessibility while preserving their
      feature-specific visual and privacy content.
- [ ] Refactor the set-form empty card to the shared section treatment.
- [ ] Refactor the progress chart insufficient-data state to the compact
      shared treatment without changing chart thresholds.

### Phase 4 — Inline states and compatibility cleanup

- [ ] Migrate compact inline empty/value fallbacks to the inline treatment or
      the agreed consistent text style where a component would be excessive.
- [ ] Remove the temporary singular `action` compatibility prop after all
      consumers use `actions`.
- [ ] Remove obsolete per-screen empty-state styling and dead bespoke layout
      code.
- [ ] Confirm no empty/fallback rendering remains outside the approved shared
      component or an intentional domain composition.

### Phase 5 — Documentation and verification

- [ ] Document the state taxonomy, layout variants, action rules, and domain
      composition guidance in `DESIGN.md`.
- [ ] Add the focused usage guidance to the relevant UX/styling docs.
- [ ] Run `pnpm run ts-check`.
- [ ] Run `pnpm run lint`.
- [ ] Run `pnpm run prettier:check`.
- [ ] Run `pnpm test`.
- [ ] Run `graphify update .` after code changes.
- [ ] Complete the manual state matrix for every migrated route and list:
      initial empty, filtered no-results, missing entity, error, unavailable
      capability, insufficient data, action press, and Back/Retry behavior.
- [ ] Re-run the empty-state inventory search and review the diff for unrelated
      changes.

## Boundaries

- Do NOT add a new production dependency.
- Do NOT replace `LoadingState` with `EmptyState`.
- Do NOT centralize business-specific copy into a global registry.
- Do NOT remove Health Connect, search, privacy, or chart-specific content.
- Do NOT change data fetching, route structure, list behavior, chart thresholds,
  or workout logging behavior.
- Do NOT hand-edit generated files, migrations, snapshots, or generated SQL.
- Do NOT introduce unrelated visual refactors.

## Acceptance criteria

- Every audited empty and fallback state uses the shared primitive or an
  intentional domain composition built on its shell.
- Page, section, and inline states have visibly consistent hierarchy, spacing,
  icon treatment, surfaces, and action placement.
- Missing entities no longer produce silent dead ends.
- Search/filter states distinguish no-results from true empty data.
- Loading, empty, error, unavailable, and insufficient-data states remain
  semantically distinct.
- Health Connect and exercise-search workflows retain their existing behavior.
- Existing project checks pass, and the manual state matrix is complete.
- No unrelated files or behavior changes are included.
