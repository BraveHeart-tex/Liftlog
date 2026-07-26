import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates,
  type Exercise,
  type Workout,
  type WorkoutTemplate,
  type WorkoutTemplateExercise
} from '@/src/db/schema';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import { resolveTemplateName } from '@/src/features/workouts/workout-display.utils';
import { normalizeSupersetRows } from '@/src/features/workouts/superset.utils';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';

export interface WorkoutTemplateExerciseDraftRow {
  id: WorkoutTemplateExercise['id'];
  exerciseId: WorkoutTemplateExercise['exerciseId'];
  supersetId: WorkoutTemplateExercise['supersetId'];
}

export type WorkoutTemplateExerciseDraftBaselineRow = Pick<
  WorkoutTemplateExercise,
  'id' | 'exerciseId' | 'order' | 'supersetId'
>;

export type StagedTemplateCustomExercise = Exercise;

export class WorkoutTemplateExerciseDraftConflictError extends Error {
  constructor() {
    super('Workout template exercise draft conflicted with persisted data.');
    this.name = 'WorkoutTemplateExerciseDraftConflictError';
  }
}

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

export function saveWorkoutTemplateExerciseDraft(
  db: DrizzleDb,
  templateId: WorkoutTemplate['id'],
  rows: WorkoutTemplateExerciseDraftRow[],
  baselineRows: WorkoutTemplateExerciseDraftBaselineRow[],
  stagedCustomExercises: StagedTemplateCustomExercise[]
): void {
  db.transaction(tx => {
    const template = getWorkoutTemplateRecordById(tx, templateId);
    const existingTemplateExercises = tx
      .select({
        id: workoutTemplateExercises.id,
        exerciseId: workoutTemplateExercises.exerciseId,
        order: workoutTemplateExercises.order,
        supersetId: workoutTemplateExercises.supersetId
      })
      .from(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.templateId, templateId))
      .all();
    const baselineById = new Map(
      baselineRows.map(row => [row.id, row] as const)
    );
    const draftIdSet = new Set(rows.map(row => row.id));
    const draftExerciseIdSet = new Set(rows.map(row => row.exerciseId));
    const stagedCustomExerciseById = new Map(
      stagedCustomExercises.map(exercise => [exercise.id, exercise] as const)
    );

    if (
      !template ||
      baselineById.size !== baselineRows.length ||
      draftIdSet.size !== rows.length ||
      draftExerciseIdSet.size !== rows.length ||
      stagedCustomExerciseById.size !== stagedCustomExercises.length ||
      existingTemplateExercises.length !== baselineRows.length ||
      existingTemplateExercises.some(existingRow => {
        const baselineRow = baselineById.get(existingRow.id);

        return (
          !baselineRow ||
          existingRow.exerciseId !== baselineRow.exerciseId ||
          existingRow.order !== baselineRow.order ||
          existingRow.supersetId !== baselineRow.supersetId
        );
      }) ||
      rows.some(row => {
        const baselineRow = baselineById.get(row.id);

        return baselineRow && baselineRow.exerciseId !== row.exerciseId;
      }) ||
      stagedCustomExercises.some(
        exercise => !draftExerciseIdSet.has(exercise.id)
      )
    ) {
      throw new WorkoutTemplateExerciseDraftConflictError();
    }

    const persistedExercises =
      draftExerciseIdSet.size > 0
        ? tx
            .select({
              id: exercises.id,
              isArchived: exercises.isArchived
            })
            .from(exercises)
            .where(inArray(exercises.id, Array.from(draftExerciseIdSet)))
            .all()
        : [];
    const persistedExerciseById = new Map(
      persistedExercises.map(exercise => [exercise.id, exercise] as const)
    );

    if (
      rows.some(row => {
        const persistedExercise = persistedExerciseById.get(row.exerciseId);

        if (persistedExercise) {
          return (
            stagedCustomExerciseById.has(row.exerciseId) ||
            (persistedExercise.isArchived !== 0 && !baselineById.has(row.id))
          );
        }

        return !stagedCustomExerciseById.has(row.exerciseId);
      })
    ) {
      throw new WorkoutTemplateExerciseDraftConflictError();
    }

    if (stagedCustomExercises.length > 0) {
      const persistedActiveExerciseNames = tx
        .select({ name: exercises.name })
        .from(exercises)
        .where(eq(exercises.isArchived, 0))
        .all();
      const normalizedNames = new Set(
        persistedActiveExerciseNames.map(exercise =>
          exercise.name.trim().toLowerCase()
        )
      );

      for (const exercise of stagedCustomExercises) {
        const normalizedName = exercise.name.trim().toLowerCase();

        if (!normalizedName || normalizedNames.has(normalizedName)) {
          throw new WorkoutTemplateExerciseDraftConflictError();
        }

        normalizedNames.add(normalizedName);
      }

      tx.insert(exercises)
        .values(
          stagedCustomExercises.map(exercise => ({
            ...exercise,
            isCustom: 1,
            isArchived: 0
          }))
        )
        .run();
    }

    const normalizedRows = normalizeSupersetRows(
      rows.map((row, order) => ({ ...row, order }))
    );
    const removedIds = baselineRows
      .filter(row => !draftIdSet.has(row.id))
      .map(row => row.id);
    const addedRows = normalizedRows.filter(row => !baselineById.has(row.id));
    const updatedRows = normalizedRows.filter(row => {
      const baselineRow = baselineById.get(row.id);

      return (
        baselineRow &&
        (baselineRow.order !== row.order ||
          baselineRow.supersetId !== row.supersetId)
      );
    });

    if (removedIds.length > 0) {
      tx.delete(workoutTemplateExercises)
        .where(inArray(workoutTemplateExercises.id, removedIds))
        .run();
    }

    if (addedRows.length > 0) {
      tx.insert(workoutTemplateExercises)
        .values(
          addedRows.map(row => ({
            id: row.id,
            templateId,
            exerciseId: row.exerciseId,
            order: row.order,
            supersetId: row.supersetId
          }))
        )
        .run();
    }

    if (updatedRows.length > 0) {
      tx.update(workoutTemplateExercises)
        .set({
          order: sql`CASE id ${sql.join(
            updatedRows.map(row => sql`WHEN ${row.id} THEN ${row.order}`),
            sql` `
          )} END`,
          supersetId: sql`CASE id ${sql.join(
            updatedRows.map(row => sql`WHEN ${row.id} THEN ${row.supersetId}`),
            sql` `
          )} END`
        })
        .where(
          inArray(
            workoutTemplateExercises.id,
            updatedRows.map(row => row.id)
          )
        )
        .run();
    }

    tx.update(workoutTemplates)
      .set({ updatedAt: Date.now() })
      .where(eq(workoutTemplates.id, templateId))
      .run();
  });
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
