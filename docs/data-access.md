## Data Access Rules

Keep database access out of:

- route screens
- presentational components
- UI primitives

Prefer feature-level data ownership and predictable data flow.

Avoid:

- query construction inside components
- direct Drizzle access in screens
- duplicated query logic
- mixing UI and database concerns

## Preferred Data Flow

Required flow:

```txt
Screen -> feature screen hook -> feature data/action hook -> repository -> Drizzle
```

Screens should consume feature-level hooks from:

```txt
src/features/*/hooks
```

Prefer lightweight route screens focused on:

- layout
- orchestration
- feature composition

## Feature Hooks

Feature hooks may:

- call repositories
- compose live queries
- call `useDrizzle`
- expose formatted screen data
- coordinate feature-level actions

Feature hooks should own:

- screen state
- derived data
- filtering
- sorting
- live query subscriptions

Good:

```tsx
export default function ExercisesScreen() {
  const { exercises, filteredExercises } = useExercisesScreen();
}
```

Avoid:

```tsx
export default function ExercisesScreen() {
  const db = useDrizzle();
}
```

## Repository Responsibilities

Repositories own:

- Drizzle table imports
- query construction
- transactions
- synchronous reads/writes
- database invariants
- reusable query builders

Repositories should expose reusable query builders named:

```txt
*Query
```

so they can be reused consistently across:

- live queries
- fallback queries
- derived feature hooks

Avoid placing business rules directly in screens or UI components.

## Live Queries

For reactive data, use:

```tsx
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';

const db = useDrizzle();

const { data } = useLiveWithFallback(getExercisesQuery(db), [db]);
```

Rules:

- use the same repository query builder for live + fallback paths
- avoid rebuilding queries unnecessarily
- keep live query logic inside feature hooks
- avoid direct live query subscriptions inside UI components

Live queries should remain:

- predictable
- reusable
- centralized
- feature-owned
