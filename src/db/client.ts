import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { SQLiteDatabase, SQLiteOpenOptions } from "expo-sqlite";
import * as schema from "./schema";

export { schema };

export const databaseName = "workout.db";

export const databaseOptions: SQLiteOpenOptions = {
  enableChangeListener: true,
};

export type DrizzleDb = ExpoSQLiteDatabase<typeof schema>;

export function configureDatabase(client: SQLiteDatabase) {
  client.execSync("PRAGMA journal_mode=WAL");
  client.execSync("PRAGMA foreign_keys=ON");
}

export function createDrizzleDb(client: SQLiteDatabase): DrizzleDb {
  return drizzle(client, { schema });
}
