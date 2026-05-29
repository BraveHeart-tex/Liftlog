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
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { View } from 'react-native';

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

type DatabaseProviderStatus = 'loading' | 'ready';

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<DatabaseProviderStatus>('loading');

  return (
    <DatabaseErrorBoundary>
      <View className="flex-1">
        <SQLiteProvider
          databaseName={databaseName}
          onInit={migrateAsync}
          options={databaseOptions}
        >
          <DrizzleProvider
            onReady={() => {
              setStatus(currentStatus =>
                currentStatus === 'loading' ? 'ready' : currentStatus
              );
            }}
          >
            {children}
          </DrizzleProvider>
        </SQLiteProvider>
        {status === 'loading' ? (
          <LoadingState
            label="Initializing database..."
            className="bg-background absolute inset-0"
          />
        ) : null}
      </View>
    </DatabaseErrorBoundary>
  );
}
