import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useSQLiteContext } from 'expo-sqlite';

function DrizzleStudioClient() {
  const db = useSQLiteContext();

  useDrizzleStudio(db);

  return null;
}

export function DrizzleStudio() {
  if (!__DEV__) {
    return null;
  }

  return <DrizzleStudioClient />;
}
