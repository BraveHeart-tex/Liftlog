import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  workoutExercises,
  workoutTemplateExercises,
  type Exercise,
  type NewExercise
} from '@/src/db/schema';
import { rebuildPersonalRecordsForExerciseInTransaction } from '@/src/features/progress/progress.repository';
import { normalizeExerciseName } from '@/src/features/exercises/exercise-name.utils';
import { withDatabaseSpan } from '@/src/lib/db/database-observability';
import { and, count, eq, exists, inArray, ne, or, sql } from 'drizzle-orm';
import type { InferColumnsDataTypes } from 'drizzle-orm/column';

const exerciseListFields = {
  id: exercises.id,
  name: exercises.name,
  category: exercises.category,
  trackingType: exercises.trackingType,
  primaryMuscles: exercises.primaryMuscles,
  secondaryMuscles: exercises.secondaryMuscles,
  isCustom: exercises.isCustom,
  isArchived: exercises.isArchived,
  createdAt: exercises.createdAt
};

export type ExerciseListItem = InferColumnsDataTypes<typeof exerciseListFields>;

interface CustomExerciseDetailsUpdate {
  category: Exercise['category'];
  trackingType: Exercise['trackingType'];
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

export class ExerciseNameConflictError extends Error {
  constructor() {
    super('An active exercise with this normalized name already exists.');
    this.name = 'ExerciseNameConflictError';
  }
}

export function isExerciseNameUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(
      'UNIQUE constraint failed: exercises.normalized_name'
    )
  );
}

export function validateStagedCustomExerciseNames<T extends { name: string }>(
  db: DrizzleDb,
  stagedExercises: T[],
  createConflictError: () => Error
): (T & { normalizedName: string })[] {
  const normalizedExercises = stagedExercises.map(exercise => ({
    ...exercise,
    normalizedName: normalizeExerciseName(exercise.name)
  }));
  const normalizedNames = new Set<string>();

  for (const exercise of normalizedExercises) {
    if (
      exercise.normalizedName.length === 0 ||
      normalizedNames.has(exercise.normalizedName)
    ) {
      throw createConflictError();
    }

    normalizedNames.add(exercise.normalizedName);
  }

  if (normalizedNames.size === 0) {
    return normalizedExercises;
  }

  const persistedNameConflict = db
    .select({ id: exercises.id })
    .from(exercises)
    .where(
      and(
        eq(exercises.isArchived, 0),
        inArray(exercises.normalizedName, Array.from(normalizedNames))
      )
    )
    .limit(1)
    .get();

  if (persistedNameConflict) {
    throw createConflictError();
  }

  return normalizedExercises;
}

export function getExerciseByIdQuery(db: DrizzleDb, id: Exercise['id']) {
  return db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
}

export function getExercisesQuery(db: DrizzleDb) {
  return db
    .select(exerciseListFields)
    .from(exercises)
    .where(eq(exercises.isArchived, 0))
    .orderBy(sql`${exercises.name} collate nocase`);
}

export function hasExerciseNameConflict(
  db: DrizzleDb,
  id: Exercise['id'] | undefined,
  name: Exercise['name']
): boolean {
  return withDatabaseSpan(
    {
      operation: 'exercise.hasNameConflict',
      feature: 'exercise',
      access: 'read'
    },
    () => {
      const normalizedName = normalizeExerciseName(name);

      if (normalizedName.length === 0) {
        return false;
      }

      const existingExercise = db
        .select({ id: exercises.id })
        .from(exercises)
        .where(
          and(
            eq(exercises.isArchived, 0),
            ...(id ? [ne(exercises.id, id)] : []),
            eq(exercises.normalizedName, normalizedName)
          )
        )
        .limit(1)
        .get();

      return Boolean(existingExercise);
    }
  );
}

export function createExercise(db: DrizzleDb, data: NewExercise): Exercise {
  return withDatabaseSpan(
    {
      operation: 'exercise.create',
      feature: 'exercise',
      access: 'write'
    },
    () => {
      try {
        return db
          .insert(exercises)
          .values({
            ...data,
            normalizedName: normalizeExerciseName(data.name),
            isCustom: 1,
            isArchived: 0
          })
          .returning()
          .get();
      } catch (error) {
        if (isExerciseNameUniqueConstraintError(error)) {
          throw new ExerciseNameConflictError();
        }

        throw error;
      }
    }
  );
}

export function updateCustomExerciseName(
  db: DrizzleDb,
  { id, name }: { id: Exercise['id']; name: Exercise['name'] }
): Exercise | undefined {
  return withDatabaseSpan(
    {
      operation: 'exercise.updateCustomName',
      feature: 'exercise',
      access: 'write'
    },
    () => {
      try {
        return db
          .update(exercises)
          .set({ name, normalizedName: normalizeExerciseName(name) })
          .where(and(eq(exercises.id, id), eq(exercises.isCustom, 1)))
          .returning()
          .get();
      } catch (error) {
        if (isExerciseNameUniqueConstraintError(error)) {
          throw new ExerciseNameConflictError();
        }

        throw error;
      }
    }
  );
}

export function updateCustomExerciseDetails(
  db: DrizzleDb,
  id: Exercise['id'],
  details: CustomExerciseDetailsUpdate
): Exercise | undefined {
  return withDatabaseSpan(
    {
      operation: 'exercise.updateCustomDetails',
      feature: 'exercise',
      access: 'write'
    },
    () =>
      db.transaction(tx => {
        const exercise = tx
          .select({
            isCustom: exercises.isCustom,
            trackingType: exercises.trackingType
          })
          .from(exercises)
          .where(eq(exercises.id, id))
          .get();

        if (!exercise || exercise.isCustom !== 1) {
          return undefined;
        }

        const updatedExercise = tx
          .update(exercises)
          .set({
            category: details.category,
            trackingType: details.trackingType,
            primaryMuscles: JSON.stringify(details.primaryMuscles),
            secondaryMuscles: JSON.stringify(details.secondaryMuscles)
          })
          .where(and(eq(exercises.id, id), eq(exercises.isCustom, 1)))
          .returning()
          .get();

        if (updatedExercise && exercise.trackingType !== details.trackingType) {
          rebuildPersonalRecordsForExerciseInTransaction(tx, id);
        }

        return updatedExercise;
      })
  );
}

function archiveExercise(db: DrizzleDb, id: Exercise['id']): void {
  db.update(exercises)
    .set({ isArchived: 1 })
    .where(and(eq(exercises.id, id), eq(exercises.isCustom, 1)))
    .run();
}

function deleteExercise(db: DrizzleDb, id: Exercise['id']): void {
  db.delete(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.isCustom, 1)))
    .run();
}

export function getExerciseUsageSummaryQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id']
) {
  const workoutUsage = db
    .select({
      count: count(workoutExercises.id).as('workout_usage_count')
    })
    .from(workoutExercises)
    .where(eq(workoutExercises.exerciseId, exerciseId))
    .as('workout_usage');
  const templateUsage = db
    .select({
      count: count(workoutTemplateExercises.id).as('template_usage_count')
    })
    .from(workoutTemplateExercises)
    .where(eq(workoutTemplateExercises.exerciseId, exerciseId))
    .as('template_usage');

  return db
    .select({
      workoutUsageCount: workoutUsage.count,
      templateUsageCount: templateUsage.count,
      totalUsageCount:
        sql<number>`${workoutUsage.count} + ${templateUsage.count}`.as(
          'total_usage_count'
        )
    })
    .from(workoutUsage)
    .crossJoin(templateUsage);
}

export function getExerciseUsageExistsQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id']
) {
  const workoutUsage = db
    .select({ id: workoutExercises.id })
    .from(workoutExercises)
    .where(eq(workoutExercises.exerciseId, exerciseId))
    .limit(1);
  const templateUsage = db
    .select({ id: workoutTemplateExercises.id })
    .from(workoutTemplateExercises)
    .where(eq(workoutTemplateExercises.exerciseId, exerciseId))
    .limit(1);

  return db
    .select({
      isUsed: sql<number>`${or(
        exists(workoutUsage),
        exists(templateUsage)
      )}`.as('is_used')
    })
    .from(sql`(select 1) as usage_probe`);
}

function isExerciseUsed(db: DrizzleDb, exerciseId: Exercise['id']): boolean {
  return getExerciseUsageExistsQuery(db, exerciseId).get()?.isUsed === 1;
}

export function removeCustomExercise(
  db: DrizzleDb,
  id: Exercise['id']
): 'archived' | 'deleted' | 'not_custom' | 'not_found' {
  return withDatabaseSpan(
    {
      operation: 'exercise.removeCustom',
      feature: 'exercise',
      access: 'write'
    },
    () => {
      const exercise = db
        .select({ isCustom: exercises.isCustom })
        .from(exercises)
        .where(eq(exercises.id, id))
        .get();

      if (!exercise) {
        return 'not_found';
      }

      if (exercise.isCustom !== 1) {
        return 'not_custom';
      }

      if (isExerciseUsed(db, id)) {
        archiveExercise(db, id);

        return 'archived';
      }

      try {
        deleteExercise(db, id);
      } catch (error) {
        console.error(
          'Failed to delete unused custom exercise; archiving instead.',
          error
        );
        archiveExercise(db, id);

        return 'archived';
      }

      return 'deleted';
    }
  );
}
