## Data Access

- Route screens and UI components must not access Drizzle, build queries, or own business rules.
- Feature hooks own screen state, derived data, live subscriptions, and action orchestration.
- Repositories own table imports, query construction, transactions, reads/writes, and DB invariants.
- Reuse `*Query` builders across live, fallback, and derived reads.
- Use `useLiveWithFallback` for reactive reads.
