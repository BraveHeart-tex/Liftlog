## Database

`DatabaseProvider` is the only DB lifecycle entry point. Do not duplicate SQLite, migration, seed, or Drizzle setup.

App code must not call `useSQLiteContext`, `createDrizzleDb`, `migrate`, or `runSeedIfNeeded` directly. Dev tooling is the exception.

## Migrations

- Change schema in the source schema, then generate migrations with Drizzle tooling.
- Never edit migration SQL, snapshots, `_journal.json`, `migrations.js`, or generated SQL.
- Never patch SQLite directly or hand-write migration state.
