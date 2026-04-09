import type { DrizzleDb } from "@/src/db/client";
import { exercises, type Exercise, type NewExercise } from "@/src/db/schema";
import { and, asc, eq, like } from "drizzle-orm";

function escapeLikePattern(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

function getExerciseRecordById(
  db: DrizzleDb,
  id: Exercise["id"],
): Exercise | undefined {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

export function getExercisesQuery(db: DrizzleDb) {
  return db
    .select()
    .from(exercises)
    .where(eq(exercises.isArchived, 0))
    .orderBy(asc(exercises.name));
}

export function getExercises(db: DrizzleDb): Exercise[] {
  return getExercisesQuery(db).all();
}

export function getExerciseById(
  db: DrizzleDb,
  id: Exercise["id"],
): Exercise | undefined {
  // Archived exercises remain addressable by id for edit/archive workflows.
  return getExerciseRecordById(db, id);
}

export function createExercise(db: DrizzleDb, data: NewExercise): Exercise {
  return db
    .insert(exercises)
    .values({
      ...data,
      isCustom: 1,
      isArchived: 0,
    })
    .returning()
    .get();
}

export function updateExercise(
  db: DrizzleDb,
  id: Exercise["id"],
  data: Partial<NewExercise>,
): Exercise | undefined {
  if (Object.keys(data).length === 0) {
    return getExerciseRecordById(db, id);
  }

  return db
    .update(exercises)
    .set(data)
    .where(eq(exercises.id, id))
    .returning()
    .get();
}

export function archiveExercise(db: DrizzleDb, id: Exercise["id"]): void {
  db.update(exercises).set({ isArchived: 1 }).where(eq(exercises.id, id)).run();
}

export function searchExercises(
  db: DrizzleDb,
  query: string,
): Exercise[] {
  const exerciseRecords = getExercises(db);

  // SQLite `LIKE` needs an explicit escape clause for literal `%` / `_`.
  // Keep the normal query-builder path for common input and fall back to a
  // literal substring match only when the query contains wildcard characters.
  if (query.includes("%") || query.includes("_") || query.includes("\\")) {
    const normalizedQuery = query.toLocaleLowerCase();

    return exerciseRecords.filter((exercise) =>
      exercise.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }

  return db
    .select()
    .from(exercises)
    .where(
      and(
        eq(exercises.isArchived, 0),
        like(exercises.name, `%${escapeLikePattern(query)}%`),
      ),
    )
    .orderBy(asc(exercises.name))
    .all();
}
