# Database

Read this when changing SQLite lifecycle, Drizzle setup, schema, seeds, or migrations.

## Lifecycle ownership

`DatabaseProvider` is the single application entry point for SQLite setup, migrations, seeds, and Drizzle wiring. App code uses the provider instead of creating a second lifecycle.

Application code does not call `useSQLiteContext`, `createDrizzleDb`, `migrate`, or `runSeedIfNeeded` directly. Development tooling is the exception.

## Schema and migrations

1. Change the source schema.
2. Generate the migration with Drizzle tooling.
3. Run the applicable database checks from [`AGENTS.md`](../AGENTS.md).

Migration SQL, snapshots, `_journal.json`, `migrations.js`, generated SQL, and SQLite migration state are generated artifacts. Keep them tool-owned: never edit, patch, or hand-write them.
