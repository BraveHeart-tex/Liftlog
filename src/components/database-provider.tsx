import { DatabaseErrorBoundary } from '@/src/components/database-error-boundary';
import { LoadingState } from '@/src/components/ui/loading-state';
import {
  configureDatabase,
  createDrizzleDb,
  databaseName,
  databaseOptions,
  type DrizzleDb
} from '@/src/db/client';
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
  Suspense,
  useContext,
  useMemo
} from 'react';

const DrizzleContext = createContext<DrizzleDb | null>(null);

export function useDrizzle() {
  const context = useContext(DrizzleContext);

  if (!context) {
    throw new Error('useDrizzle must be used within a DrizzleProvider');
  }

  return context;
}

function DrizzleProvider({ children }: PropsWithChildren) {
  const sqliteDb = useSQLiteContext();

  const db = useMemo(() => createDrizzleDb(sqliteDb), [sqliteDb]);

  return (
    <DrizzleContext.Provider value={db}>{children}</DrizzleContext.Provider>
  );
}

async function migrateAsync(db: SQLiteDatabase) {
  let drizzleDb: DrizzleDb;

  try {
    configureDatabase(db);
    drizzleDb = createDrizzleDb(db);
    await migrate(drizzleDb, migrations);
  } catch (error) {
    console.error('Database migration failed', error);

    throw error;
  }

  try {
    runSeedIfNeeded(drizzleDb);

    if (__DEV__) {
      const { runDevSeedIfNeeded } = await import('@/src/db/dev-seed');

      runDevSeedIfNeeded(drizzleDb);
    }
  } catch (error) {
    console.error('Database seed failed', error);

    throw error;
  }
}

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <DatabaseErrorBoundary>
      <Suspense
        fallback={
          <LoadingState
            label="Initializing database..."
            className="bg-background"
          />
        }
      >
        <SQLiteProvider
          databaseName={databaseName}
          onInit={migrateAsync}
          options={databaseOptions}
          useSuspense
        >
          <DrizzleProvider>{children}</DrizzleProvider>
        </SQLiteProvider>
      </Suspense>
    </DatabaseErrorBoundary>
  );
}
