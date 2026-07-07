import type { DrizzleDb } from '@/src/db/client';
import {
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates,
  type Workout,
  type WorkoutTemplate,
  type WorkoutTemplateExercise
} from '@/src/db/schema';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import { resolveTemplateName } from '@/src/features/workouts/workout-display.utils';
import { normalizeSupersetRows } from '@/src/features/workouts/superset.utils';
import { asc, desc, eq, inArray } from 'drizzle-orm';

function getWorkoutTemplateRecordById(
  db: DrizzleDb,
  id: WorkoutTemplate['id']
): WorkoutTemplate | undefined {
  return db
    .select()
    .from(workoutTemplates)
    .where(eq(workoutTemplates.id, id))
    .get();
}

export function getWorkoutTemplatesQuery(db: DrizzleDb, limit?: number) {
  const query = db
    .select()
    .from(workoutTemplates)
    .orderBy(
      desc(workoutTemplates.updatedAt),
      desc(workoutTemplates.createdAt)
    );

  return limit === undefined ? query : query.limit(limit);
}

export function getWorkoutTemplateByIdQuery(
  db: DrizzleDb,
  id: WorkoutTemplate['id']
) {
  return db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
}

export function getWorkoutTemplateBySourceWorkoutIdQuery(
  db: DrizzleDb,
  sourceWorkoutId: Workout['id']
) {
  return db
    .select()
    .from(workoutTemplates)
    .where(eq(workoutTemplates.sourceWorkoutId, sourceWorkoutId))
    .limit(1);
}

export function getWorkoutTemplateExercisesQuery(
  db: DrizzleDb,
  templateId: WorkoutTemplate['id']
) {
  return db
    .select()
    .from(workoutTemplateExercises)
    .where(eq(workoutTemplateExercises.templateId, templateId))
    .orderBy(asc(workoutTemplateExercises.order));
}

export function getWorkoutTemplateExercisesForTemplatesQuery(
  db: DrizzleDb,
  templateIds: WorkoutTemplate['id'][]
) {
  if (templateIds.length === 0) {
    return getWorkoutTemplateExercisesQuery(db, '');
  }

  return db
    .select()
    .from(workoutTemplateExercises)
    .where(inArray(workoutTemplateExercises.templateId, templateIds))
    .orderBy(asc(workoutTemplateExercises.order));
}

export function updateWorkoutTemplateName(
  db: DrizzleDb,
  id: WorkoutTemplate['id'],
  name: WorkoutTemplate['name']
): WorkoutTemplate | undefined {
  const existingTemplate = getWorkoutTemplateRecordById(db, id);

  if (!existingTemplate) {
    return undefined;
  }

  return db
    .update(workoutTemplates)
    .set({
      name: resolveTemplateName(name),
      updatedAt: Date.now()
    })
    .where(eq(workoutTemplates.id, id))
    .returning()
    .get();
}

export function updateWorkoutTemplateExercises(
  db: DrizzleDb,
  id: WorkoutTemplate['id'],
  exerciseRows: Pick<WorkoutTemplateExercise, 'exerciseId' | 'supersetId'>[]
): WorkoutTemplate | undefined {
  let updatedTemplate: WorkoutTemplate | undefined;

  db.transaction(tx => {
    const existingTemplate = getWorkoutTemplateRecordById(tx, id);

    if (!existingTemplate) {
      return;
    }

    tx.delete(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.templateId, id))
      .run();

    if (exerciseRows.length > 0) {
      const normalizedExerciseRows = normalizeSupersetRows(
        exerciseRows.map((exerciseRow, order) => ({
          id: String(order),
          ...exerciseRow
        }))
      );

      tx.insert(workoutTemplateExercises)
        .values(
          normalizedExerciseRows.map((exerciseRow, order) => ({
            templateId: id,
            exerciseId: exerciseRow.exerciseId,
            order,
            supersetId: exerciseRow.supersetId
          }))
        )
        .run();
    }

    updatedTemplate = tx
      .update(workoutTemplates)
      .set({ updatedAt: Date.now() })
      .where(eq(workoutTemplates.id, id))
      .returning()
      .get();
  });

  return updatedTemplate;
}

export function deleteWorkoutTemplate(
  db: DrizzleDb,
  id: WorkoutTemplate['id']
): void {
  db.delete(workoutTemplates).where(eq(workoutTemplates.id, id)).run();
}

export function createWorkoutTemplate(
  db: DrizzleDb,
  {
    name,
    exerciseRows,
    sourceWorkoutId
  }: {
    name: string;
    exerciseRows: Pick<
      WorkoutTemplateExercise,
      'exerciseId' | 'order' | 'supersetId'
    >[];
    sourceWorkoutId?: Workout['id'];
  }
): WorkoutTemplate {
  const now = Date.now();
  let createdTemplate: WorkoutTemplate | undefined;

  // create the template record first, then copy the ordered
  // exercise rows in the same transaction so the saved preset stays consistent.
  db.transaction(tx => {
    createdTemplate = tx
      .insert(workoutTemplates)
      .values({
        name: resolveTemplateName(name),
        sourceWorkoutId,
        createdAt: now,
        updatedAt: now
      })
      .returning()
      .get();

    const createdTemplateRow = createdTemplate;

    if (!createdTemplateRow || exerciseRows.length === 0) {
      return;
    }

    const normalizedExerciseRows = normalizeSupersetRows(
      exerciseRows.map(exercise => ({
        id: String(exercise.order),
        ...exercise
      }))
    );

    tx.insert(workoutTemplateExercises)
      .values(
        normalizedExerciseRows.map(exercise => ({
          templateId: createdTemplateRow.id,
          exerciseId: exercise.exerciseId,
          order: exercise.order,
          supersetId: exercise.supersetId
        }))
      )
      .run();
  });

  if (!createdTemplate) {
    throw new Error('Failed to create workout template.');
  }

  return createdTemplate;
}

export function createWorkoutFromTemplate(
  db: DrizzleDb,
  {
    templateId,
    discardWorkoutId
  }: {
    templateId: WorkoutTemplate['id'];
    discardWorkoutId?: Workout['id'];
  }
): Workout | undefined {
  let createdWorkout: Workout | undefined;

  db.transaction(tx => {
    const template = tx
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.id, templateId))
      .get();

    if (!template) {
      return;
    }

    const templateExerciseRows = tx
      .select()
      .from(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.templateId, templateId))
      .orderBy(asc(workoutTemplateExercises.order))
      .all();

    const startedAt = Date.now();

    createdWorkout = tx
      .insert(workouts)
      .values({
        name: template.name,
        status: 'in_progress',
        startedAt,
        dateKey: toLocalDateKey(startedAt)
      })
      .returning()
      .get();

    const createdWorkoutRow = createdWorkout;

    if (!createdWorkoutRow) {
      return;
    }

    if (templateExerciseRows.length > 0) {
      tx.insert(workoutExercises)
        .values(
          templateExerciseRows.map(templateExercise => ({
            workoutId: createdWorkoutRow.id,
            exerciseId: templateExercise.exerciseId,
            order: templateExercise.order,
            supersetId: templateExercise.supersetId,
            notes: null
          }))
        )
        .run();
    }

    if (discardWorkoutId) {
      tx.delete(workouts).where(eq(workouts.id, discardWorkoutId)).run();
    }
  });

  return createdWorkout;
}
