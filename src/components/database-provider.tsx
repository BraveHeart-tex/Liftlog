import migrations from "@/src/db/migrations/migrations";
import * as schema from "@/src/db/schema";
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import {
  SQLiteDatabase,
  SQLiteProvider,
  SQLiteProviderProps,
  useSQLiteContext,
} from "expo-sqlite";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";

const databaseName = "workout.db";

type DrizzleDb = ExpoSQLiteDatabase<typeof schema>;

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

  const db = useMemo(() => {
    console.info("Creating Drizzle instance");
    return drizzle(sqliteDb, { schema });
  }, [sqliteDb]);

  return (
    <DrizzleContext.Provider value={db}>{children}</DrizzleContext.Provider>
  );
}

async function migrateAsync(db: SQLiteDatabase) {
  const drizzleDb = drizzle(db);
  await migrate(drizzleDb, migrations);
}

const options: SQLiteProviderProps["options"] = { enableChangeListener: true };

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider
      databaseName={databaseName}
      onError={console.error}
      onInit={migrateAsync}
      options={options}
    >
      <DrizzleProvider>{children}</DrizzleProvider>
    </SQLiteProvider>
  );
}
