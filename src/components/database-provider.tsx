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
import { createContext, PropsWithChildren, useContext, useMemo } from "react";

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
    return createDrizzleDb(sqliteDb);
  }, [sqliteDb]);

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
    <SQLiteProvider
      databaseName={databaseName}
      onError={console.error}
      onInit={migrateAsync}
      options={databaseOptions}
    >
      <DrizzleProvider>{children}</DrizzleProvider>
    </SQLiteProvider>
  );
}
