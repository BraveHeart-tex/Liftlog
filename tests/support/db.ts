import { createDrizzleDb, runDatabaseMigrations } from '@/src/db/client';
import {
  backfillExerciseEquipment,
  backfillNormalizedExerciseNames
} from '@/src/db/exercise-name-migration';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { SQLiteDatabase } from 'expo-sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NodeSQLiteDatabase } from '@/tests/support/sqlite-adapter';

// Each database test file registers afterEach(closeTestDatabases). A root-level
// afterEach also runs after every test inside a describe block, so each test
// creates its own database.

interface MigrationJournalEntry {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface MigrationJournal {
  entries: MigrationJournalEntry[];
}

const openTestDatabases: NodeSQLiteDatabase[] = [];

export function loadMigrations(maxIndex?: number) {
  const migrationsDirectory = path.resolve(process.cwd(), 'src/db/migrations');
  const journal = JSON.parse(
    readFileSync(path.join(migrationsDirectory, 'meta/_journal.json'), 'utf8')
  ) as MigrationJournal;
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

/** An empty in-memory database, closed by the next closeTestDatabases call. */
export function createTestDatabase() {
  const nodeClient = new NodeSQLiteDatabase();

  openTestDatabases.push(nodeClient);

  return nodeClient;
}

/** A database migrated the way production initialization migrates it. */
export async function createMigratedTestDatabase() {
  const nodeClient = createTestDatabase();
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

  return { db, nodeClient };
}

/** Closes every database created since the previous call. */
export function closeTestDatabases() {
  for (const nodeClient of openTestDatabases.splice(0)) {
    if (nodeClient.isOpen) {
      nodeClient.closeSync();
    }
  }
}

/** Makes any personal record rebuild (a delete from personal_records) fail. */
export function rejectPersonalRecordRebuilds(nodeClient: NodeSQLiteDatabase) {
  nodeClient.execSync(`
    CREATE TRIGGER reject_personal_record_rebuild
    BEFORE DELETE ON personal_records
    BEGIN
      SELECT RAISE(ABORT, 'unexpected personal record rebuild');
    END;
  `);
}
