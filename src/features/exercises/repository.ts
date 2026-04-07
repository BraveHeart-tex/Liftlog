import type { DrizzleDb } from "@/src/db/client";
import {
  exercises,
  type Exercise,
  type NewExercise,
  type User,
} from "@/src/db/schema";
import { and, asc, eq, isNull, like, or } from "drizzle-orm";

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
  return getExerciseRecordById(db, id);
}

export function createExercise(
  db: DrizzleDb,
  data: NewExercise,
): Exercise {
  return db.insert(exercises).values(data).returning().get();
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
  return db
    .select()
    .from(exercises)
    .where(
      and(
        or(eq(exercises.userId, userId), isNull(exercises.userId)),
        eq(exercises.isArchived, 0),
        like(exercises.name, `%${query}%`),
      ),
    )
    .orderBy(asc(exercises.name))
    .all();
}
