import {
  drizzle,
  type ExpoSQLiteDatabase
} from 'drizzle-orm/expo-sqlite/driver';
import type { SQLiteDatabase, SQLiteOpenOptions } from 'expo-sqlite';
import {
  appMeta,
  exercises,
  healthStepDays,
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates
} from '@/src/db/schema';

const schema = {
  appMeta,
  exercises,
  healthStepDays,
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates
};

export const databaseName = 'workout.db';

export const databaseOptions: SQLiteOpenOptions = {
  enableChangeListener: true
};

export type DrizzleDb = ExpoSQLiteDatabase<typeof schema>;

function configureDatabase(client: SQLiteDatabase) {
  client.execSync('PRAGMA journal_mode=WAL');
  client.execSync('PRAGMA foreign_keys=ON');
}

interface ForeignKeysPragma {
  foreign_keys: number;
}

interface ForeignKeyViolation {
  table: string;
  rowid: number | null;
  parent: string;
  fkid: number;
}

export async function runDatabaseMigrations(
  client: SQLiteDatabase,
  migrateDatabase: () => Promise<void>
): Promise<void> {
  configureDatabase(client);

  // Must run before Drizzle starts its migration transaction.
  await client.execAsync('PRAGMA foreign_keys = OFF;');

  try {
    await migrateDatabase();
  } finally {
    // Always restore and verify enforcement on this connection.
    await client.execAsync('PRAGMA foreign_keys = ON;');

    const foreignKeys = await client.getFirstAsync<ForeignKeysPragma>(
      'PRAGMA foreign_keys;'
    );

    if (foreignKeys?.foreign_keys !== 1) {
      throw new Error('SQLite foreign key enforcement is disabled.');
    }
  }

  const violations = await client.getAllAsync<ForeignKeyViolation>(
    'PRAGMA foreign_key_check;'
  );

  if (violations.length > 0) {
    throw new Error(
      `Foreign key violations after migration: ${JSON.stringify(violations)}`
    );
  }
}

export function createDrizzleDb(client: SQLiteDatabase): DrizzleDb {
  return drizzle(client, { schema });
}
