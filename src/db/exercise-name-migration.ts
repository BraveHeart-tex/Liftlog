import type { DrizzleDb } from '@/src/db/client';
import { exercises } from '@/src/db/schema';
import { normalizeExerciseName } from '@/src/features/exercises/exercise-name.utils';
import { eq } from 'drizzle-orm';
import type { SQLiteDatabase } from 'expo-sqlite';

interface ExerciseNameMigrationRow {
  id: string;
  name: string;
}

interface ExerciseNameMigrationConflict {
  normalizedName: string;
  exercises: ExerciseNameMigrationRow[];
}

interface ExerciseColumnRow {
  name: string;
}

async function getExerciseColumns(
  client: SQLiteDatabase
): Promise<ExerciseColumnRow[]> {
  return client.getAllAsync<ExerciseColumnRow>(
    "PRAGMA table_info('exercises')"
  );
}

export async function hasExerciseEquipmentColumn(
  client: SQLiteDatabase
): Promise<boolean> {
  return (await getExerciseColumns(client)).some(
    column => column.name === 'equipment'
  );
}

export class ExerciseNameMigrationConflictError extends Error {
  constructor(readonly conflicts: ExerciseNameMigrationConflict[]) {
    super(
      `Active exercises have duplicate normalized names: ${JSON.stringify(conflicts)}`
    );
    this.name = 'ExerciseNameMigrationConflictError';
  }
}

export async function assertNoExerciseNameMigrationConflicts(
  client: SQLiteDatabase
): Promise<void> {
  const exercisesTable = await client.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'exercises'"
  );

  if (!exercisesTable) {
    return;
  }

  const rows = await client.getAllAsync<ExerciseNameMigrationRow>(
    'SELECT id, name FROM exercises WHERE is_archived = 0'
  );
  const rowsByNormalizedName = new Map<string, ExerciseNameMigrationRow[]>();

  for (const row of rows) {
    const normalizedName = normalizeExerciseName(row.name);
    const matchingRows = rowsByNormalizedName.get(normalizedName) ?? [];

    matchingRows.push({ id: row.id, name: row.name });
    rowsByNormalizedName.set(normalizedName, matchingRows);
  }

  const conflicts = Array.from(
    rowsByNormalizedName,
    ([normalizedName, items]) => ({
      normalizedName,
      exercises: items
    })
  ).filter(conflict => conflict.exercises.length > 1);

  if (conflicts.length > 0) {
    throw new ExerciseNameMigrationConflictError(conflicts);
  }
}

export async function backfillExerciseEquipment(
  client: SQLiteDatabase
): Promise<void> {
  const columns = await getExerciseColumns(client);

  if (
    !columns.some(column => column.name === 'category') ||
    !columns.some(column => column.name === 'equipment')
  ) {
    return;
  }

  await client.execAsync(
    'UPDATE exercises SET equipment = category WHERE equipment IS NULL'
  );
}

export function backfillNormalizedExerciseNames(db: DrizzleDb): void {
  const rows = db
    .select({
      id: exercises.id,
      name: exercises.name,
      normalizedName: exercises.normalizedName
    })
    .from(exercises)
    .all();

  db.transaction(tx => {
    for (const row of rows) {
      const normalizedName = normalizeExerciseName(row.name);

      if (row.normalizedName !== normalizedName) {
        tx.update(exercises)
          .set({ normalizedName })
          .where(eq(exercises.id, row.id))
          .run();
      }
    }
  });
}
