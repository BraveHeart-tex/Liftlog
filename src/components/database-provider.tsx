import { DatabaseErrorBoundary } from '@/src/components/database-error-boundary';
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
  useContext,
  useEffect,
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

interface ForeignKeyViolation {
  table: string;
  rowid: number | null;
  parent: string;
  fkid: number;
}

async function migrateAsync(sqliteDb: SQLiteDatabase) {
  configureDatabase(sqliteDb);

  const drizzleDb = createDrizzleDb(sqliteDb);

  try {
    // Must run before Drizzle starts its migration transaction.
    await sqliteDb.execAsync('PRAGMA foreign_keys = OFF;');

    try {
      await migrate(drizzleDb, migrations);
    } finally {
      // Always restore enforcement, including after migration failure.
      await sqliteDb.execAsync('PRAGMA foreign_keys = ON;');
    }

    const violations = await sqliteDb.getAllAsync<ForeignKeyViolation>(
      'PRAGMA foreign_key_check;'
    );

    if (violations.length > 0) {
      throw new Error(
        `Foreign key violations after migration: ${JSON.stringify(violations)}`
      );
    }
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
