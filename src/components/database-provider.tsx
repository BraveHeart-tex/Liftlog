import { DatabaseErrorBoundary } from "@/src/components/database-error-boundary";
import {
  configureDatabase,
  createDrizzleDb,
  databaseName,
  databaseOptions,
  DrizzleDb,
} from "@/src/db/client";
import migrations from "@/src/db/migrations/migrations";
import { runSeedIfNeeded } from "@/src/db/seed";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import {
  createContext,
  PropsWithChildren,
  Suspense,
  useContext,
  useMemo,
} from "react";
import { Text, View } from "react-native";

const DrizzleContext = createContext<DrizzleDb | null>(null);

export function useDrizzle() {
  const context = useContext(DrizzleContext);
  if (!context) {
    throw new Error("useDrizzle must be used within a DrizzleProvider");
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
    console.error("Database migration failed", error);
    throw error;
  }

  try {
    runSeedIfNeeded(drizzleDb);
  } catch (error) {
    console.error("Database seed failed", error);
    throw error;
  }
}

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <DatabaseErrorBoundary>
      <Suspense
        fallback={
          <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-small text-muted-foreground">
              Initializing database...
            </Text>
          </View>
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
