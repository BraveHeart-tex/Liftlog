## Database Lifecycle

`DatabaseProvider` owns:

- `SQLiteProvider`
- migrations
- seeding
- Drizzle context setup

App code should treat `DatabaseProvider` as the single database lifecycle entry point.

Avoid duplicating database initialization logic elsewhere.

## SQLite / Drizzle Ownership Boundaries

`src/db/client.ts` owns:

- database configuration
- WAL setup
- foreign key configuration
- database name/options
- `createDrizzleDb`

Application code should not call these directly outside provider setup:

- `useSQLiteContext`
- `createDrizzleDb`
- `migrate`
- `runSeedIfNeeded`

These APIs are infrastructure-level concerns.

Dev-only tooling may use `useSQLiteContext` when required.

Example:

```txt id="4j2khj"
src/components/drizzle-studio.tsx
```

## Schema and Migrations

Schema source of truth:

```txt id="ixdmp0"
src/db/schema.ts
```

Migration location:

```txt id="2h1y6z"
src/db/migrations
```

When changing schema:

1. update `src/db/schema.ts`
2. generate migrations with:

```sh id="bqarfm"
pnpm exec drizzle-kit generate
```

Never manually create migration files.

## Generated Migration Restrictions

Generated migration files are considered off-limits.

Never manually edit:

- migration SQL
- migration snapshots
- `_journal.json`
- `migrations.js`

Never:

- patch the SQLite database manually
- hand-write migration state
- bypass migration generation flow

Generated files should remain fully tool-managed.

## Migration Workflow

Required workflow:

```txt id="0j2rte"
Update schema.ts -> generate migration -> run app migration flow
```

Avoid:

- ad-hoc schema patching
- temporary migration hacks
- modifying generated migration output

Schema changes should remain:

- reproducible
- deterministic
- tool-generated
- source-controlled
