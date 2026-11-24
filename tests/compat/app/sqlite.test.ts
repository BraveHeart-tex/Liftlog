import {
  createDrizzleDb,
  runDatabaseMigrations,
  type DrizzleDb
} from '@/src/db/client';
import {
  backfillExerciseEquipment,
  backfillNormalizedExerciseNames
} from '@/src/db/exercise-name-migration';
import { workoutExercises, workouts } from '@/src/db/schema';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { SQLiteDatabase } from 'expo-sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync
} from 'node:sqlite';

// Probe-local copy of the expo-sqlite adapter over node:sqlite from
// tests/db/database.integration.test.ts; #138 moves it to tests/support.
// Catches a Jest environment that cannot load node:sqlite, run Drizzle migrations,
// enforce foreign keys or roll back a failed transaction.

interface MigrationJournal {
  entries: { idx: number; tag: string; when: number; breakpoints: boolean }[];
}

class NodeSQLiteStatement {
  constructor(
    private readonly statement: StatementSync,
    private readonly database: DatabaseSync
  ) {}

  executeSync(params: SQLInputValue[] = []) {
    return this.execute(params, false);
  }

  executeForRawResultSync(params: SQLInputValue[] = []) {
    return this.execute(params, true);
  }

  private execute(params: SQLInputValue[], rawResult: boolean) {
    const rows = this.statement.all(...params);
    const metadata = this.database
      .prepare(
        'SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowId'
      )
      .get();

    return {
      changes: Number(metadata?.changes),
      lastInsertRowId: Number(metadata?.lastInsertRowId),
      getAllSync: () =>
        rawResult ? rows.map(row => Object.values(row)) : rows,
      getFirstSync: () => {
        const row = rows[0] ?? null;

        return rawResult && row ? Object.values(row) : row;
      }
    };
  }
}

class NodeSQLiteDatabase {
  private readonly database = new DatabaseSync(':memory:');

  get isOpen() {
    return this.database.isOpen;
  }

  closeSync() {
    this.database.close();
  }

  execSync(source: string) {
    this.database.exec(source);
  }

  async execAsync(source: string) {
    this.execSync(source);
  }

  prepareSync(source: string) {
    return new NodeSQLiteStatement(
      this.database.prepare(source),
      this.database
    );
  }

  getFirstSync<T>(source: string): T | null {
    return (this.database.prepare(source).get() as T | undefined) ?? null;
  }

  getAllSync<T>(source: string, params: SQLInputValue[] = []): T[] {
    return this.database.prepare(source).all(...params) as T[];
  }

  async getFirstAsync<T>(source: string): Promise<T | null> {
    return this.getFirstSync<T>(source);
  }

  async getAllAsync<T>(source: string): Promise<T[]> {
    return this.getAllSync<T>(source);
  }
}

const migrationsDirectory = path.resolve(process.cwd(), 'src/db/migrations');
const journal = JSON.parse(
  readFileSync(path.join(migrationsDirectory, 'meta/_journal.json'), 'utf8')
) as MigrationJournal;

function loadMigrations(maxIndex?: number) {
  const entries = journal.entries.filter(
    entry => maxIndex === undefined || entry.idx <= maxIndex
  );

  return {
    journal: { entries },
    migrations: Object.fromEntries(
      entries.map(entry => [
        `m${entry.idx.toString().padStart(4, '0')}`,
        readFileSync(path.join(migrationsDirectory, `${entry.tag}.sql`), 'utf8')
      ])
    )
  };
}

async function migrateTestDatabase(nodeClient: NodeSQLiteDatabase) {
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(11))
  );
  backfillNormalizedExerciseNames(db);
  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations(14))
  );
  await backfillExerciseEquipment(sqliteClient);
  await runDatabaseMigrations(sqliteClient, () =>
    migrate(db, loadMigrations())
  );

  return db;
}

function insertWorkout(db: DrizzleDb, id: string) {
  db.insert(workouts)
    .values({
      id,
      name: 'Workout',
      status: 'in_progress',
      startedAt: 1,
      dateKey: '1970-01-01'
    })
    .run();
}

test('node:sqlite runs every migration, enforces foreign keys, rolls back and closes', async () => {
  const nodeClient = new NodeSQLiteDatabase();

  try {
    const db = await migrateTestDatabase(nodeClient);

    const applied = nodeClient.getAllSync<{ hash: string }>(
      'SELECT hash FROM __drizzle_migrations'
    );
    expect(applied).toHaveLength(journal.entries.length);

    expect(
      nodeClient.getFirstSync<{ foreign_keys: number }>('PRAGMA foreign_keys')
    ).toEqual({ foreign_keys: 1 });
    expect(() =>
      db
        .insert(workoutExercises)
        .values({
          id: 'orphan',
          workoutId: 'missing-workout',
          exerciseId: 'missing-exercise',
          order: 0
        })
        .run()
    ).toThrow(/FOREIGN KEY constraint failed/);

    expect(() =>
      db.transaction(tx => {
        insertWorkout(tx, 'rolled-back-workout');

        throw new Error('abort transaction');
      })
    ).toThrow('abort transaction');
    expect(db.select().from(workouts).all()).toEqual([]);
  } finally {
    nodeClient.closeSync();
  }

  expect(nodeClient.isOpen).toBe(false);
});
