import type { DrizzleDb } from '@/src/db/client';
import { exercises, type Exercise, type NewExercise } from '@/src/db/schema';
import { and, asc, eq, inArray, like } from 'drizzle-orm';
import type { InferColumnsDataTypes } from 'drizzle-orm/column';

const exerciseListFields = {
  id: exercises.id,
  name: exercises.name,
  category: exercises.category,
  primaryMuscles: exercises.primaryMuscles,
  secondaryMuscles: exercises.secondaryMuscles,
  isCustom: exercises.isCustom,
  isArchived: exercises.isArchived,
  createdAt: exercises.createdAt
};

export type ExerciseListItem = InferColumnsDataTypes<typeof exerciseListFields>;

function escapeLikePattern(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

function getExerciseRecordById(
  db: DrizzleDb,
  id: Exercise['id']
): Exercise | undefined {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

export function getExerciseByIdQuery(db: DrizzleDb, id: Exercise['id']) {
  return db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
}

export function getExercisesQuery(db: DrizzleDb) {
  return db
    .select(exerciseListFields)
    .from(exercises)
    .where(eq(exercises.isArchived, 0))
    .orderBy(asc(exercises.name));
}

export function getExercises(db: DrizzleDb): ExerciseListItem[] {
  return getExercisesQuery(db).all();
}

export function getExercisesByIdsQuery(db: DrizzleDb, ids: Exercise['id'][]) {
  if (ids.length === 0) {
    return db
      .select(exerciseListFields)
      .from(exercises)
      .where(inArray(exercises.id, ['']));
  }

  return db
    .select(exerciseListFields)
    .from(exercises)
    .where(inArray(exercises.id, ids));
}

export function getExercisesByIds(
  db: DrizzleDb,
  ids: Exercise['id'][]
): ExerciseListItem[] {
  return getExercisesByIdsQuery(db, ids).all();
}

export function getExerciseById(
  db: DrizzleDb,
  id: Exercise['id']
): Exercise | null {
  // Archived exercises remain addressable by id for edit/archive workflows.
  return getExerciseByIdQuery(db, id).get() ?? null;
}

export function createExercise(db: DrizzleDb, data: NewExercise): Exercise {
  return db
    .insert(exercises)
    .values({
      ...data,
      isCustom: 1,
      isArchived: 0
    })
    .returning()
    .get();
}

export function updateExercise(
  db: DrizzleDb,
  id: Exercise['id'],
  data: Partial<NewExercise>
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

export function archiveExercise(db: DrizzleDb, id: Exercise['id']): void {
  db.update(exercises).set({ isArchived: 1 }).where(eq(exercises.id, id)).run();
}

export function searchExercises(
  db: DrizzleDb,
  query: string
): ExerciseListItem[] {
  const exerciseRecords = getExercises(db);

  // SQLite `LIKE` needs an explicit escape clause for literal `%` / `_`.
  // Keep the normal query-builder path for common input and fall back to a
  // literal substring match only when the query contains wildcard characters.
  if (query.includes('%') || query.includes('_') || query.includes('\\')) {
    const normalizedQuery = query.toLocaleLowerCase();

    return exerciseRecords.filter(exercise =>
      exercise.name.toLocaleLowerCase().includes(normalizedQuery)
    );
  }

  return db
    .select(exerciseListFields)
    .from(exercises)
    .where(
      and(
        eq(exercises.isArchived, 0),
        like(exercises.name, `%${escapeLikePattern(query)}%`)
      )
    )
    .orderBy(asc(exercises.name))
    .all();
}
