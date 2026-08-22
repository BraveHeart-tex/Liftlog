# Data access

Read this when changing queries, repositories, live reads, feature hooks, or database/domain observability.

## Ownership

- Routes and UI components render data and dispatch actions. They do not import Drizzle, build queries, or own business rules.
- Feature hooks own screen state, derived data, live subscriptions, and action orchestration.
- Repositories own table imports, query construction, transactions, reads/writes, and database invariants.
- Reuse `*Query` builders across live, fallback, and derived reads.
- Use `useLiveWithFallback` for reactive reads.

## Observability

Instrument logical boundaries and high-value flows without exposing SQL, IDs, or user values.

- Wrap one logical repository read, write, or transaction with `withDatabaseSpan`; do not wrap every internal statement without evidence.
- Give every `useLiveWithFallback` call a stable, parameter-free `operation`. It identifies both `initial_read` (`query.all()`) and `live_refresh` (`query.then()`).
- `database-provider.tsx` has separate spans for migration validation, migrations, production backfills, cleanup, and seeds. Development seed spans validate instrumentation; their data is not a production baseline.
- Use `withDomainFlowSpan` for high-value actions. Current names are `workout.start`, `workout.save`, and `workout.finish`.

Expected nesting when a route or flow parent exists:

```text
route transaction
└── workout.finish (ui.action)
    └── workout.complete (db)
```

Wrappers default to `onlyIfParent: true`. With Sentry disabled, unsampled, unavailable, or parentless, application behavior is unchanged. Database errors are rethrown unchanged. Safe database metadata is limited to `feature`, `access`, `phase`, `liveRefresh`, and optional `rowCount`; exclude SQL, IDs, names, notes, weights, and error messages.

## Change gate

Keep queries and invariants in repositories, add a stable operation name, instrument one logical boundary, and cover success and error paths. Run the shared validation in [`AGENTS.md`](../AGENTS.md).
