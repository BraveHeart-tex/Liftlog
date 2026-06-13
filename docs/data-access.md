## Data Access

Flow: `Screen → feature screen hook → feature data/action hook → repository → Drizzle`

Keep DB access out of route screens, presentational components, and UI primitives. No query construction in components, no direct Drizzle in screens, no duplicated query logic.

Screens (`src/features/*/hooks`) should be lightweight — layout, orchestration, composition only.

---

## Feature Hooks

Own: screen state · derived data · filtering · sorting · live query subscriptions

May: call repositories · compose live queries · call `useDrizzle` · expose formatted data · coordinate actions

```tsx
// ✅
const { exercises, filteredExercises } = useExercisesScreen();

// ❌
const db = useDrizzle(); // directly in screen
```

---

## Repositories

Own: Drizzle table imports · query construction · transactions · reads/writes · DB invariants

Expose reusable query builders named `*Query` for consistent reuse across live, fallback, and derived hooks.

---

## Live Queries

```tsx
const { data } = useLiveWithFallback(getExercisesQuery(db), [db]);
```

- Use the same `*Query` builder for live + fallback paths.
- Keep live query logic inside feature hooks — not in UI components.
