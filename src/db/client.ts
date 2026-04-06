import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

export const client = openDatabaseSync("workout.db", {
  enableChangeListener: true,
});

client.execSync("PRAGMA journal_mode=WAL");
client.execSync("PRAGMA foreign_keys=ON");

export const db = drizzle(client, { schema });
