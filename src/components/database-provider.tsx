import { DatabaseErrorBoundary } from '@/src/components/database-error-boundary';
import {
  createDrizzleDb,
  databaseName,
  databaseOptions,
  runDatabaseMigrations,
  type DrizzleDb
} from '@/src/db/client';
import {
  assertNoExerciseNameMigrationConflicts,
  backfillNormalizedExerciseNames
} from '@/src/db/exercise-name-migration';
import migrations from '@/src/db/migrations/migrations';
import { runSeedIfNeeded } from '@/src/db/seed';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import {
  type SQLiteDatabase,
  SQLiteProvider,
  useSQLiteContext
} from 'expo-sqlite';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo
} from 'react';

const DrizzleContext = createContext<DrizzleDb | null>(null);

const NORMALIZED_EXERCISE_NAME_BACKFILL_MIGRATION_INDEX = 11;

const migrationsThroughExerciseNameBackfill = {
  ...migrations,
  journal: {
    entries: migrations.journal.entries.filter(
      entry => entry.idx <= NORMALIZED_EXERCISE_NAME_BACKFILL_MIGRATION_INDEX
    )
  }
};

export function useDrizzle() {
  const context = useContext(DrizzleContext);

  if (!context) {
    throw new Error('useDrizzle must be used within a DrizzleProvider');
  }

  return context;
}

interface DrizzleProviderProps extends PropsWithChildren {
  onReady: () => void;
}

function DrizzleProvider({ children, onReady }: DrizzleProviderProps) {
  const sqliteDb = useSQLiteContext();

  const db = useMemo(() => createDrizzleDb(sqliteDb), [sqliteDb]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <DrizzleContext.Provider value={db}>{children}</DrizzleContext.Provider>
  );
}

async function migrateAsync(sqliteDb: SQLiteDatabase) {
  const drizzleDb = createDrizzleDb(sqliteDb);

  try {
    await assertNoExerciseNameMigrationConflicts(sqliteDb);
    await runDatabaseMigrations(sqliteDb, () =>
      migrate(drizzleDb, migrationsThroughExerciseNameBackfill)
    );
    backfillNormalizedExerciseNames(drizzleDb);
    await runDatabaseMigrations(sqliteDb, () => migrate(drizzleDb, migrations));
  } catch (error) {
    console.error('Database migration failed', error);

    throw error;
  }

  try {
    await runSeedIfNeeded(drizzleDb);

    if (__DEV__) {
      const { runDevSeedIfNeeded } = await import('@/src/db/dev-seed');

      await runDevSeedIfNeeded(drizzleDb);
    }
  } catch (error) {
    console.error('Database seed failed', error);

    throw error;
  }
}

interface DatabaseProviderProps extends PropsWithChildren {
  onError?: () => void;
  onReady: () => void;
}

export function DatabaseProvider({
  children,
  onError,
  onReady
}: DatabaseProviderProps) {
  return (
    <DatabaseErrorBoundary onError={onError}>
      <SQLiteProvider
        databaseName={databaseName}
        onInit={migrateAsync}
        options={databaseOptions}
      >
        <DrizzleProvider onReady={onReady}>{children}</DrizzleProvider>
      </SQLiteProvider>
    </DatabaseErrorBoundary>
  );
}
