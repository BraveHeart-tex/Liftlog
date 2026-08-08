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
import {
  isExerciseNameUniqueConstraintError,
  validateStagedCustomExerciseNames
} from '@/src/features/exercises/exercise.repository';
import { resolveTemplateName } from '@/src/features/workouts/workout-display.utils';
import { normalizeSupersetRows } from '@/src/features/workouts/superset.utils';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';

export interface WorkoutStartTemplateItem {
  template: WorkoutTemplate;
  exerciseRows: WorkoutTemplateExercise[];
  exerciseCount: number;
  exerciseSummary: string;
}

interface WorkoutTemplateListRow {
  templateId: WorkoutTemplate['id'];
  templateName: WorkoutTemplate['name'];
  templateSourceWorkoutId: WorkoutTemplate['sourceWorkoutId'];
  templateCreatedAt: WorkoutTemplate['createdAt'];
  templateUpdatedAt: WorkoutTemplate['updatedAt'];
  templateExerciseId: WorkoutTemplateExercise['id'] | null;
  templateExerciseTemplateId: WorkoutTemplateExercise['templateId'] | null;
  templateExerciseExerciseId: WorkoutTemplateExercise['exerciseId'] | null;
  templateExerciseOrder: WorkoutTemplateExercise['order'] | null;
  templateExerciseSupersetId: WorkoutTemplateExercise['supersetId'] | null;
  exerciseId: Exercise['id'] | null;
  exerciseName: Exercise['name'] | null;
}

interface WorkoutTemplateDetailRow {
  templateId: WorkoutTemplate['id'];
  templateName: WorkoutTemplate['name'];
  templateSourceWorkoutId: WorkoutTemplate['sourceWorkoutId'];
  templateCreatedAt: WorkoutTemplate['createdAt'];
  templateUpdatedAt: WorkoutTemplate['updatedAt'];
  templateExerciseId: WorkoutTemplateExercise['id'] | null;
  templateExerciseTemplateId: WorkoutTemplateExercise['templateId'] | null;
  templateExerciseExerciseId: WorkoutTemplateExercise['exerciseId'] | null;
  templateExerciseOrder: WorkoutTemplateExercise['order'] | null;
  templateExerciseSupersetId: WorkoutTemplateExercise['supersetId'] | null;
  exerciseId: Exercise['id'] | null;
  exerciseName: Exercise['name'] | null;
  exerciseNormalizedName: Exercise['normalizedName'] | null;
  exerciseCategory: Exercise['category'] | null;
  exerciseTrackingType: Exercise['trackingType'] | null;
  exercisePrimaryMuscles: Exercise['primaryMuscles'] | null;
  exerciseSecondaryMuscles: Exercise['secondaryMuscles'] | null;
  exerciseIsCustom: Exercise['isCustom'] | null;
  exerciseIsArchived: Exercise['isArchived'] | null;
  exerciseCreatedAt: Exercise['createdAt'] | null;
}

interface WorkoutTemplateDetail {
  template: WorkoutTemplate | undefined;
  templateExerciseRows: WorkoutTemplateExercise[];
  exerciseById: Map<Exercise['id'], Exercise>;
}

interface WorkoutTemplateExerciseDraftRow {
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

export function getWorkoutStartTemplateRowsQuery(
  db: DrizzleDb,
  limit?: number
) {
  const orderedTemplates = db
    .select({
      id: workoutTemplates.id,
      name: workoutTemplates.name,
      sourceWorkoutId: workoutTemplates.sourceWorkoutId,
      createdAt: workoutTemplates.createdAt,
      updatedAt: workoutTemplates.updatedAt
    })
    .from(workoutTemplates)
    .orderBy(
      desc(workoutTemplates.updatedAt),
      desc(workoutTemplates.createdAt)
    );
  const limitedTemplates = (
    limit === undefined ? orderedTemplates : orderedTemplates.limit(limit)
  ).as('limited_workout_templates');

  return db
    .select({
      templateId: limitedTemplates.id,
      templateName: limitedTemplates.name,
      templateSourceWorkoutId: limitedTemplates.sourceWorkoutId,
      templateCreatedAt: limitedTemplates.createdAt,
      templateUpdatedAt: limitedTemplates.updatedAt,
      templateExerciseId: workoutTemplateExercises.id,
      templateExerciseTemplateId: workoutTemplateExercises.templateId,
      templateExerciseExerciseId: workoutTemplateExercises.exerciseId,
      templateExerciseOrder: workoutTemplateExercises.order,
      templateExerciseSupersetId: workoutTemplateExercises.supersetId,
      exerciseId: exercises.id,
      exerciseName: exercises.name
    })
    .from(limitedTemplates)
    .leftJoin(
      workoutTemplateExercises,
      eq(workoutTemplateExercises.templateId, limitedTemplates.id)
    )
    .leftJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
    .orderBy(
      desc(limitedTemplates.updatedAt),
      desc(limitedTemplates.createdAt),
      asc(workoutTemplateExercises.order)
    );
}

export function getWorkoutTemplateDetailRowsQuery(
  db: DrizzleDb,
  templateId: WorkoutTemplate['id']
) {
  return db
    .select({
      templateId: workoutTemplates.id,
      templateName: workoutTemplates.name,
      templateSourceWorkoutId: workoutTemplates.sourceWorkoutId,
      templateCreatedAt: workoutTemplates.createdAt,
      templateUpdatedAt: workoutTemplates.updatedAt,
      templateExerciseId: workoutTemplateExercises.id,
      templateExerciseTemplateId: workoutTemplateExercises.templateId,
      templateExerciseExerciseId: workoutTemplateExercises.exerciseId,
      templateExerciseOrder: workoutTemplateExercises.order,
      templateExerciseSupersetId: workoutTemplateExercises.supersetId,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      exerciseNormalizedName: exercises.normalizedName,
      exerciseCategory: exercises.category,
      exerciseTrackingType: exercises.trackingType,
      exercisePrimaryMuscles: exercises.primaryMuscles,
      exerciseSecondaryMuscles: exercises.secondaryMuscles,
      exerciseIsCustom: exercises.isCustom,
      exerciseIsArchived: exercises.isArchived,
      exerciseCreatedAt: exercises.createdAt
    })
    .from(workoutTemplates)
    .leftJoin(
      workoutTemplateExercises,
      eq(workoutTemplateExercises.templateId, workoutTemplates.id)
    )
    .leftJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
    .where(eq(workoutTemplates.id, templateId))
    .orderBy(asc(workoutTemplateExercises.order));
}

function buildTemplateSummary(exerciseNames: string[]): string {
  if (exerciseNames.length === 0) {
    return 'No exercises';
  }

  if (exerciseNames.length <= 2) {
    return exerciseNames.join(' • ');
  }

  return `${exerciseNames.slice(0, 2).join(' • ')} +${
    exerciseNames.length - 2
  } more`;
}

export function mapWorkoutTemplateRows(
  rows: WorkoutTemplateListRow[]
): WorkoutStartTemplateItem[] {
  const itemsByTemplateId = new Map<
    WorkoutTemplate['id'],
    {
      template: WorkoutTemplate;
      exerciseRows: WorkoutTemplateExercise[];
      exerciseNames: string[];
    }
  >();

  for (const row of rows) {
    let item = itemsByTemplateId.get(row.templateId);

    if (!item) {
      item = {
        template: {
          id: row.templateId,
          name: row.templateName,
          sourceWorkoutId: row.templateSourceWorkoutId,
          createdAt: row.templateCreatedAt,
          updatedAt: row.templateUpdatedAt
        },
        exerciseRows: [],
        exerciseNames: []
      };
      itemsByTemplateId.set(row.templateId, item);
    }

    if (row.templateExerciseId === null) {
      continue;
    }

    const exerciseRow: WorkoutTemplateExercise = {
      id: row.templateExerciseId,
      templateId: row.templateExerciseTemplateId!,
      exerciseId: row.templateExerciseExerciseId!,
      order: row.templateExerciseOrder!,
      supersetId: row.templateExerciseSupersetId
    };

    item.exerciseRows.push(exerciseRow);

    if (row.exerciseName) {
      item.exerciseNames.push(
        row.templateExerciseSupersetId
          ? `Superset: ${row.exerciseName}`
          : row.exerciseName
      );
    }
  }

  return Array.from(itemsByTemplateId.values()).map(
    ({ template, exerciseRows, exerciseNames }) => ({
      template,
      exerciseRows,
      exerciseCount: exerciseRows.length,
      exerciseSummary: buildTemplateSummary(exerciseNames)
    })
  );
}

export function mapWorkoutTemplateDetailRows(
  rows: WorkoutTemplateDetailRow[]
): WorkoutTemplateDetail {
  const firstRow = rows[0];
  const templateExerciseRows: WorkoutTemplateExercise[] = [];
  const exerciseById = new Map<Exercise['id'], Exercise>();

  if (!firstRow) {
    return {
      template: undefined,
      templateExerciseRows,
      exerciseById
    };
  }

  for (const row of rows) {
    if (row.templateExerciseId === null) {
      continue;
    }

    templateExerciseRows.push({
      id: row.templateExerciseId,
      templateId: row.templateExerciseTemplateId!,
      exerciseId: row.templateExerciseExerciseId!,
      order: row.templateExerciseOrder!,
      supersetId: row.templateExerciseSupersetId
    });

    if (row.exerciseId === null) {
      continue;
    }

    exerciseById.set(row.exerciseId, {
      id: row.exerciseId,
      name: row.exerciseName!,
      normalizedName: row.exerciseNormalizedName!,
      category: row.exerciseCategory!,
      trackingType: row.exerciseTrackingType!,
      primaryMuscles: row.exercisePrimaryMuscles,
      secondaryMuscles: row.exerciseSecondaryMuscles,
      isCustom: row.exerciseIsCustom!,
      isArchived: row.exerciseIsArchived!,
      createdAt: row.exerciseCreatedAt!
    });
  }

  return {
    template: {
      id: firstRow.templateId,
      name: firstRow.templateName,
      sourceWorkoutId: firstRow.templateSourceWorkoutId,
      createdAt: firstRow.templateCreatedAt,
      updatedAt: firstRow.templateUpdatedAt
    },
    templateExerciseRows,
    exerciseById
  };
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

export function updateWorkoutTemplateName(
  db: DrizzleDb,
  { id, name }: { id: WorkoutTemplate['id']; name: WorkoutTemplate['name'] }
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
  {
    templateId,
    rows,
    baselineRows,
    stagedCustomExercises
  }: {
    templateId: WorkoutTemplate['id'];
    rows: WorkoutTemplateExerciseDraftRow[];
    baselineRows: WorkoutTemplateExerciseDraftBaselineRow[];
    stagedCustomExercises: StagedTemplateCustomExercise[];
  }
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

    const normalizedStagedCustomExercises = validateStagedCustomExerciseNames(
      tx,
      stagedCustomExercises,
      () => new WorkoutTemplateExerciseDraftConflictError()
    );

    if (normalizedStagedCustomExercises.length > 0) {
      try {
        tx.insert(exercises)
          .values(
            normalizedStagedCustomExercises.map(exercise => ({
              ...exercise,
              isCustom: 1,
              isArchived: 0
            }))
          )
          .run();
      } catch (error) {
        if (isExerciseNameUniqueConstraintError(error)) {
          throw new WorkoutTemplateExerciseDraftConflictError();
        }

        throw error;
      }
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
