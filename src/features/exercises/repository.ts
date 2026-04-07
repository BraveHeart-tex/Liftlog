import type { DrizzleDb } from "@/src/db/client";
import {
  exercises,
  type Exercise,
  type NewExercise,
  type User,
} from "@/src/db/schema";
import { and, asc, eq, isNull, like, or } from "drizzle-orm";

function escapeLikePattern(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function getExerciseRecordById(
  db: DrizzleDb,
  id: Exercise["id"],
): Exercise | undefined {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

export function getExercises(db: DrizzleDb, userId: User["id"]): Exercise[] {
  return db
    .select()
    .from(exercises)
    .where(
      and(
        or(eq(exercises.userId, userId), isNull(exercises.userId)),
        eq(exercises.isArchived, 0),
      ),
    )
    .orderBy(asc(exercises.name))
    .all();
}

export function getExerciseById(
  db: DrizzleDb,
  id: Exercise["id"],
): Exercise | undefined {
  // Archived exercises remain addressable by id for edit/archive workflows.
  return getExerciseRecordById(db, id);
}

export function createExercise(
  db: DrizzleDb,
  data: NewExercise,
): Exercise {
  return db
    .insert(exercises)
    .values({
      ...data,
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
  db
    .update(exercises)
    .set({ isArchived: 1 })
    .where(eq(exercises.id, id))
    .run();
}

export function searchExercises(
  db: DrizzleDb,
  userId: User["id"],
  query: string,
): Exercise[] {
  const exercisesForUser = db
    .select()
    .from(exercises)
    .where(
      and(
        or(eq(exercises.userId, userId), isNull(exercises.userId)),
        eq(exercises.isArchived, 0),
      ),
    )
    .orderBy(asc(exercises.name))
    .all();

  // SQLite `LIKE` needs an explicit escape clause for literal `%` / `_`.
  // Keep the normal query-builder path for common input and fall back to a
  // literal substring match only when the query contains wildcard characters.
  if (query.includes("%") || query.includes("_") || query.includes("\\")) {
    const normalizedQuery = query.toLocaleLowerCase();

    return exercisesForUser.filter((exercise) =>
      exercise.name.toLocaleLowerCase().includes(normalizedQuery),
    );
  }

  return db
    .select()
    .from(exercises)
    .where(
      and(
        or(eq(exercises.userId, userId), isNull(exercises.userId)),
        eq(exercises.isArchived, 0),
        like(exercises.name, `%${escapeLikePattern(query)}%`),
      ),
    )
    .orderBy(asc(exercises.name))
    .all();
}
