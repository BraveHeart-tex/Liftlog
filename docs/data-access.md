## Data Access

- Route screens and UI components must not access Drizzle, build queries, or own business rules.
- Feature hooks own screen state, derived data, live subscriptions, and action orchestration.
- Repositories own table imports, query construction, transactions, reads/writes, and DB invariants.
- Reuse `*Query` builders across live, fallback, and derived reads.
- Use `useLiveWithFallback` for reactive reads.

## Observability

Instrument logical database operations and high-value flows to find slow
release work without exposing SQL, IDs, or user values.

- Repositories use `withDatabaseSpan` for one logical read, write, or
  transaction. Do not wrap every internal statement without evidence.
- Pass a stable, parameter-free `operation` to every `useLiveWithFallback` call.
  It records both `initial_read` (`query.all()`) and `live_refresh`
  (`query.then()`).
- `database-provider.tsx` has separate spans for migration validation,
  migrations, production backfills, cleanup, and seeds. Development seed spans
  validate instrumentation only; their data is not a production baseline.
- Use `withDomainFlowSpan` for high-value actions. Current names:
  `workout.start`, `workout.save`, and `workout.finish`.

When a route or flow parent exists, the expected hierarchy is:

```text
route transaction
└── workout.finish (ui.action)
    └── workout.complete (db)
```

Wrappers default to `onlyIfParent: true`; when Sentry is disabled, unsampled,
unavailable, or parentless, application behavior is unchanged. Database errors
are rethrown unchanged. Safe database metadata is limited to `feature`,
`access`, `phase`, `liveRefresh`, and optional `rowCount`; never add SQL, IDs,
names, notes, weights, or error messages.

When changing data access: keep queries and invariants in repositories, add a
stable operation name, instrument one logical boundary, add success/error
coverage, and run tests, TypeScript, ESLint, and Prettier. Run `graphify update .`
after source changes.
