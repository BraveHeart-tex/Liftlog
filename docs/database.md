## Database

`DatabaseProvider` is the single lifecycle entry point — owns `SQLiteProvider`, migrations, seeding, and Drizzle context. No duplicate init logic elsewhere.

`src/db/client.ts` owns DB config, WAL, foreign keys, and `createDrizzleDb`. App code must not call `useSQLiteContext`, `createDrizzleDb`, `migrate`, or `runSeedIfNeeded` directly — these are infrastructure-level. Exception: dev-only tooling (`src/components/drizzle-studio.tsx`).

---

## Schema & Migrations

- Schema: `src/db/schema.ts`
- Migrations: `src/db/migrations` (tool-managed, never touch manually)

**To change schema:**

1. Edit `src/db/schema.ts`
2. Run `pnpm exec drizzle-kit generate`
3. Let the app migration flow apply it

Never manually edit migration SQL, snapshots, `_journal.json`, or `migrations.js`. Never patch the DB directly or hand-write migration state. Schema changes must be reproducible, deterministic, and source-controlled.
