import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  sets,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates,
  type Exercise,
  type NewExercise,
  type NewSet,
  type NewWorkout,
  type Set,
  type Workout,
  type WorkoutExercise,
  type WorkoutTemplate
} from '@/src/db/schema';
import { createExercise } from '@/src/features/exercises/exercise.repository';
import { normalizeSupersetRows } from '@/src/features/workouts/superset.utils';
import { formatWorkoutName } from '@/src/features/workouts/workout-display.utils';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  lte,
  ne,
  notInArray,
  sql
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

export const HISTORICAL_WORKOUT_DRAFT_STATUS = 'historical_draft';

export const HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS = 'historical_edit_draft';
const HISTORICAL_WORKOUT_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const HISTORICAL_SET_INTERVAL_MS = 60_000;

function withWorkoutDateKey(data: NewWorkout): NewWorkout {
  const startedAt = data.startedAt ?? Date.now();

  return {
    ...data,
    startedAt,
    dateKey: data.dateKey ?? toLocalDateKey(startedAt)
  };
}

function getLocalNoonTimestamp(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

interface SavedHistoricalWorkoutDraft {
  workout: Workout;
  affectedExerciseIds: WorkoutExercise['exerciseId'][];
}

interface SavedHistoricalWorkoutEditDraft {
  workout: Workout;
  affectedExerciseIds: WorkoutExercise['exerciseId'][];
}

export interface ActiveWorkoutExerciseDraftRow {
  id: WorkoutExercise['id'];
  exerciseId: WorkoutExercise['exerciseId'];
  supersetId: WorkoutExercise['supersetId'];
}

export type ActiveWorkoutExerciseDraftBaselineRow = Pick<
  WorkoutExercise,
  'id' | 'exerciseId' | 'order' | 'supersetId'
>;

export type StagedCustomExercise = Exercise;

export class ActiveWorkoutExerciseDraftConflictError extends Error {
  constructor() {
    super('Active workout exercise draft conflicted with persisted data.');
    this.name = 'ActiveWorkoutExerciseDraftConflictError';
  }
}

function getWorkoutRecordById(
  db: DrizzleDb,
  id: Workout['id']
): Workout | undefined {
  return db.select().from(workouts).where(eq(workouts.id, id)).get();
}

function getSetRecordById(db: DrizzleDb, id: Set['id']): Set | undefined {
  return db.select().from(sets).where(eq(sets.id, id)).get();
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

export function getRecentWorkoutsQuery(db: DrizzleDb, limit: number) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'completed'))
    .orderBy(desc(workouts.startedAt))
    .limit(limit);
}

export function getRecentExerciseIdsQuery(
  db: DrizzleDb,
  excludedExerciseIds: string[] = [],
  limit: number
) {
  return db
    .select({ exerciseId: workoutExercises.exerciseId })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(
      and(
        eq(workouts.status, 'completed'),
        eq(exercises.isArchived, 0),
        excludedExerciseIds.length > 0
          ? notInArray(workoutExercises.exerciseId, excludedExerciseIds)
          : undefined
      )
    )
    .orderBy(desc(workouts.startedAt), asc(workoutExercises.order))
    .limit(limit);
}

export function getActiveWorkoutQuery(db: DrizzleDb) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'in_progress'))
    .orderBy(desc(workouts.startedAt))
    .limit(1);
}

export function getActiveWorkoutForRestTimerNotification(
  db: DrizzleDb,
  workoutId: Workout['id'] | undefined
) {
  const rows = db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.status, 'in_progress'),
        workoutId ? eq(workouts.id, workoutId) : undefined
      )
    )
    .orderBy(desc(workouts.startedAt))
    .limit(1);

  return rows.get();
}

export function getActiveWorkoutExerciseForRestTimerNotification(
  db: DrizzleDb,
  workoutId: Workout['id'],
  workoutExerciseId: WorkoutExercise['id']
) {
  const rows = db
    .select({ workoutExercise: workoutExercises })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workouts.status, 'in_progress'),
        eq(workouts.id, workoutId),
        eq(workoutExercises.id, workoutExerciseId)
      )
    )
    .limit(1);

  return rows.get()?.workoutExercise;
}

export function getHistoricalWorkoutDraftQuery(
  db: DrizzleDb,
  id: Workout['id']
) {
  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.status, HISTORICAL_WORKOUT_DRAFT_STATUS)
      )
    );
}

export function getHistoricalWorkoutEditDraftQuery(
  db: DrizzleDb,
  id: Workout['id']
) {
  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.status, HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS)
      )
    );
}

export function getActiveWorkoutSummaryQuery(db: DrizzleDb) {
  return db
    .select({
      workout: workouts,
      exerciseCount: countDistinct(workoutExercises.id),
      completedSetCount: count(sets.id)
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(
      sets,
      and(
        eq(sets.workoutExerciseId, workoutExercises.id),
        eq(sets.status, 'completed')
      )
    )
    .where(eq(workouts.status, 'in_progress'))
    .groupBy(workouts.id)
    .orderBy(desc(workouts.startedAt));
}

export function getWorkoutByIdQuery(db: DrizzleDb, id: Workout['id']) {
  return db.select().from(workouts).where(eq(workouts.id, id));
}

export interface WorkoutHistoryDetailRow {
  workout: Workout;
  workoutExercise: WorkoutExercise | null;
  exercise: Exercise | null;
  set: Set | null;
}

export interface WorkoutHistoryDetail {
  workout: Workout | undefined;
  workoutExerciseRows: WorkoutExercise[];
  exerciseById: Map<Exercise['id'], Exercise>;
  setsByWorkoutExerciseId: Map<WorkoutExercise['id'], Set[]>;
  totalVolume: number;
  totalCompletedSets: number;
}

export function getWorkoutHistoryDetailRowsQuery(
  db: DrizzleDb,
  workoutId: Workout['id']
) {
  return db
    .select({
      workout: workouts,
      workoutExercise: workoutExercises,
      exercise: exercises,
      set: sets
    })
    .from(workouts)
    .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .leftJoin(
      sets,
      and(
        eq(sets.workoutExerciseId, workoutExercises.id),
        eq(sets.status, 'completed')
      )
    )
    .where(eq(workouts.id, workoutId))
    .orderBy(asc(workoutExercises.order), asc(sets.order));
}

export function mapWorkoutHistoryDetailRows(
  rows: WorkoutHistoryDetailRow[]
): WorkoutHistoryDetail {
  const firstRow = rows[0];
  const workoutExerciseById = new Map<WorkoutExercise['id'], WorkoutExercise>();
  const exerciseById = new Map<Exercise['id'], Exercise>();
  const setsByWorkoutExerciseId = new Map<WorkoutExercise['id'], Set[]>();
  let totalVolume = 0;
  let totalCompletedSets = 0;

  for (const row of rows) {
    if (row.workoutExercise) {
      workoutExerciseById.set(row.workoutExercise.id, row.workoutExercise);
    }

    if (row.exercise) {
      exerciseById.set(row.exercise.id, row.exercise);
    }

    if (!row.set || row.set.status !== 'completed') {
      continue;
    }

    const existingSets =
      setsByWorkoutExerciseId.get(row.set.workoutExerciseId) ?? [];

    setsByWorkoutExerciseId.set(row.set.workoutExerciseId, [
      ...existingSets,
      row.set
    ]);
    totalCompletedSets += 1;

    if (row.set.weightKg !== null && row.set.reps !== null) {
      totalVolume += row.set.weightKg * row.set.reps;
    }
  }

  return {
    workout: firstRow?.workout,
    workoutExerciseRows: Array.from(workoutExerciseById.values()),
    exerciseById,
    setsByWorkoutExerciseId,
    totalVolume: Math.round(totalVolume * 10) / 10,
    totalCompletedSets
  };
}

export function getWorkoutExercisesQuery(
  db: DrizzleDb,
  workoutId: Workout['id']
) {
  return db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.order));
}

export function getWorkoutExercisesWithExercisesQuery(
  db: DrizzleDb,
  workoutId: Workout['id']
) {
  return db
    .select({
      workoutExercise: workoutExercises,
      exercise: exercises
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.order));
}

export function getWorkoutExerciseByIdQuery(
  db: DrizzleDb,
  id: WorkoutExercise['id']
) {
  return db.select().from(workoutExercises).where(eq(workoutExercises.id, id));
}

export function getActiveWorkoutExerciseDetailQuery(
  db: DrizzleDb,
  workoutExerciseId: WorkoutExercise['id']
) {
  const pairedWorkoutExercises = alias(
    workoutExercises,
    'paired_workout_exercises'
  );
  const pairedExercises = alias(exercises, 'paired_exercises');

  return db
    .select({
      workoutExercise: workoutExercises,
      exercise: exercises,
      workout: workouts,
      pairedWorkoutExercise: pairedWorkoutExercises,
      pairedExercise: pairedExercises
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .leftJoin(
      pairedWorkoutExercises,
      and(
        eq(pairedWorkoutExercises.workoutId, workoutExercises.workoutId),
        eq(pairedWorkoutExercises.supersetId, workoutExercises.supersetId),
        ne(pairedWorkoutExercises.id, workoutExercises.id)
      )
    )
    .leftJoin(
      pairedExercises,
      eq(pairedWorkoutExercises.exerciseId, pairedExercises.id)
    )
    .where(eq(workoutExercises.id, workoutExerciseId));
}

export function getSetsByWorkoutExerciseIdQuery(
  db: DrizzleDb,
  workoutExerciseId: WorkoutExercise['id']
) {
  return db
    .select()
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId))
    .orderBy(asc(sets.order));
}

export function getSetsForWorkoutQuery(
  db: DrizzleDb,
  workoutId: Workout['id']
) {
  return db
    .select({ set: sets })
    .from(workoutExercises)
    .innerJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(sets.order));
}

export function createWorkout(db: DrizzleDb, data: NewWorkout): Workout {
  return db.insert(workouts).values(withWorkoutDateKey(data)).returning().get();
}

function cleanupStaleHistoricalWorkoutDrafts(db: DrizzleDb): void {
  db.delete(workouts)
    .where(
      and(
        inArray(workouts.status, [
          HISTORICAL_WORKOUT_DRAFT_STATUS,
          HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS
        ]),
        lte(
          workouts.completedAt,
          Date.now() - HISTORICAL_WORKOUT_DRAFT_MAX_AGE_MS
        )
      )
    )
    .run();
}

export function createHistoricalWorkoutDraft(
  db: DrizzleDb,
  dateKey: Workout['dateKey']
): Workout {
  cleanupStaleHistoricalWorkoutDrafts(db);

  const startedAt = getLocalNoonTimestamp(dateKey);

  return db
    .insert(workouts)
    .values({
      name: formatWorkoutName(startedAt),
      status: HISTORICAL_WORKOUT_DRAFT_STATUS,
      startedAt,
      dateKey,
      completedAt: Date.now()
    })
    .returning()
    .get();
}

export function createHistoricalWorkoutDraftFromTemplate(
  db: DrizzleDb,
  {
    dateKey,
    templateId
  }: {
    dateKey: Workout['dateKey'];
    templateId: WorkoutTemplate['id'];
  }
): Workout | undefined {
  cleanupStaleHistoricalWorkoutDrafts(db);

  let createdWorkout: Workout | undefined;

  db.transaction(tx => {
    const template = getWorkoutTemplateRecordById(tx, templateId);

    if (!template) {
      return;
    }

    const templateExerciseRows = tx
      .select()
      .from(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.templateId, templateId))
      .orderBy(asc(workoutTemplateExercises.order))
      .all();
    const startedAt = getLocalNoonTimestamp(dateKey);

    createdWorkout = tx
      .insert(workouts)
      .values({
        name: template.name,
        status: HISTORICAL_WORKOUT_DRAFT_STATUS,
        startedAt,
        dateKey,
        completedAt: Date.now()
      })
      .returning()
      .get();

    const createdWorkoutRow = createdWorkout;

    if (!createdWorkoutRow || templateExerciseRows.length === 0) {
      return;
    }

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
  });

  return createdWorkout;
}

export function createHistoricalWorkoutEditDraft(
  db: DrizzleDb,
  sourceWorkoutId: Workout['id']
): Workout | undefined {
  cleanupStaleHistoricalWorkoutDrafts(db);

  let createdWorkout: Workout | undefined;

  db.transaction(tx => {
    const sourceWorkout = tx
      .select()
      .from(workouts)
      .where(
        and(eq(workouts.id, sourceWorkoutId), eq(workouts.status, 'completed'))
      )
      .get();

    if (!sourceWorkout) {
      return;
    }

    const sourceWorkoutExercises = tx
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, sourceWorkoutId))
      .orderBy(asc(workoutExercises.order))
      .all();

    const sourceWorkoutExerciseIds = sourceWorkoutExercises.map(
      workoutExercise => workoutExercise.id
    );
    const sourceSets =
      sourceWorkoutExerciseIds.length > 0
        ? tx
            .select()
            .from(sets)
            .where(inArray(sets.workoutExerciseId, sourceWorkoutExerciseIds))
            .orderBy(asc(sets.order))
            .all()
        : [];
    const sourceSetsByWorkoutExerciseId = new Map<
      WorkoutExercise['id'],
      Set[]
    >();

    for (const set of sourceSets) {
      const existingSets =
        sourceSetsByWorkoutExerciseId.get(set.workoutExerciseId) ?? [];

      sourceSetsByWorkoutExerciseId.set(set.workoutExerciseId, [
        ...existingSets,
        set
      ]);
    }

    createdWorkout = tx
      .insert(workouts)
      .values({
        name: sourceWorkout.name,
        status: HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS,
        startedAt: sourceWorkout.startedAt,
        dateKey: sourceWorkout.dateKey,
        completedAt: Date.now(),
        notes: sourceWorkout.notes,
        sourceWorkoutId: sourceWorkout.id
      })
      .returning()
      .get();

    const createdWorkoutRow = createdWorkout;

    if (!createdWorkoutRow || sourceWorkoutExercises.length === 0) {
      return;
    }

    const draftWorkoutExercises = tx
      .insert(workoutExercises)
      .values(
        sourceWorkoutExercises.map(workoutExercise => ({
          workoutId: createdWorkoutRow.id,
          exerciseId: workoutExercise.exerciseId,
          order: workoutExercise.order,
          supersetId: workoutExercise.supersetId,
          notes: workoutExercise.notes
        }))
      )
      .returning()
      .all();
    const draftWorkoutExerciseIdBySourceId = new Map<
      WorkoutExercise['id'],
      WorkoutExercise['id']
    >(
      sourceWorkoutExercises.map((sourceWorkoutExercise, index) => [
        sourceWorkoutExercise.id,
        draftWorkoutExercises[index]?.id ?? ''
      ])
    );
    const draftSets: NewSet[] = [];

    for (const sourceWorkoutExercise of sourceWorkoutExercises) {
      const draftWorkoutExerciseId = draftWorkoutExerciseIdBySourceId.get(
        sourceWorkoutExercise.id
      );

      if (!draftWorkoutExerciseId) {
        continue;
      }

      const sourceSetRows =
        sourceSetsByWorkoutExerciseId.get(sourceWorkoutExercise.id) ?? [];

      for (const set of sourceSetRows) {
        draftSets.push({
          workoutExerciseId: draftWorkoutExerciseId,
          order: set.order,
          weightKg: set.weightKg,
          reps: set.reps,
          distanceMeters: set.distanceMeters,
          durationMs: set.durationMs,
          durationSeconds: set.durationSeconds,
          rpe: set.rpe,
          status: set.status,
          completedAt: set.completedAt
        });
      }
    }

    if (draftSets.length > 0) {
      tx.insert(sets).values(draftSets).run();
    }
  });

  return createdWorkout;
}

export function updateWorkoutName(
  db: DrizzleDb,
  id: Workout['id'],
  name: Workout['name']
): Workout | undefined {
  return db
    .update(workouts)
    .set({ name })
    .where(eq(workouts.id, id))
    .returning()
    .get();
}

export function deleteWorkout(db: DrizzleDb, id: Workout['id']): boolean {
  return db.delete(workouts).where(eq(workouts.id, id)).run().changes > 0;
}

export function completeWorkout(db: DrizzleDb, id: Workout['id']): void {
  const existingWorkout = getWorkoutRecordById(db, id);

  if (!existingWorkout) {
    return;
  }

  db.update(workouts)
    .set({
      status: 'completed',
      dateKey: toLocalDateKey(existingWorkout.startedAt),
      completedAt: Date.now()
    })
    .where(eq(workouts.id, id))
    .run();
}

export function saveHistoricalWorkoutDraft(
  db: DrizzleDb,
  id: Workout['id']
): SavedHistoricalWorkoutDraft | undefined {
  let savedWorkout: Workout | undefined;
  let affectedExerciseIds: WorkoutExercise['exerciseId'][] = [];

  db.transaction(tx => {
    const existingWorkout = tx
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.id, id),
          eq(workouts.status, HISTORICAL_WORKOUT_DRAFT_STATUS)
        )
      )
      .get();

    if (!existingWorkout) {
      return;
    }

    const completedSetRows = tx
      .select({
        setId: sets.id,
        exerciseId: workoutExercises.exerciseId
      })
      .from(sets)
      .innerJoin(
        workoutExercises,
        eq(sets.workoutExerciseId, workoutExercises.id)
      )
      .where(
        and(eq(workoutExercises.workoutId, id), eq(sets.status, 'completed'))
      )
      .orderBy(asc(workoutExercises.order), asc(sets.order))
      .all();

    if (completedSetRows.length === 0) {
      return;
    }

    tx.update(sets)
      .set({
        completedAt: sql`CASE ${sets.id} ${sql.join(
          completedSetRows.map(
            (row, index) =>
              sql`WHEN ${row.setId} THEN ${
                existingWorkout.startedAt +
                (index + 1) * HISTORICAL_SET_INTERVAL_MS
              }`
          ),
          sql` `
        )} END`
      })
      .where(
        inArray(
          sets.id,
          completedSetRows.map(row => row.setId)
        )
      )
      .run();

    savedWorkout = tx
      .update(workouts)
      .set({
        status: 'completed',
        dateKey: existingWorkout.dateKey,
        completedAt: null
      })
      .where(eq(workouts.id, id))
      .returning()
      .get();

    affectedExerciseIds = Array.from(
      new Set(completedSetRows.map(row => row.exerciseId))
    );
  });

  if (!savedWorkout) {
    return undefined;
  }

  return {
    workout: savedWorkout,
    affectedExerciseIds
  };
}

export function saveHistoricalWorkoutEditDraft(
  db: DrizzleDb,
  {
    sourceWorkoutId,
    draftWorkoutId
  }: {
    sourceWorkoutId: Workout['id'];
    draftWorkoutId: Workout['id'];
  }
): SavedHistoricalWorkoutEditDraft | undefined {
  let savedWorkout: Workout | undefined;
  let affectedExerciseIds: WorkoutExercise['exerciseId'][] = [];

  db.transaction(tx => {
    const sourceWorkout = tx
      .select()
      .from(workouts)
      .where(
        and(eq(workouts.id, sourceWorkoutId), eq(workouts.status, 'completed'))
      )
      .get();
    const draftWorkout = tx
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.id, draftWorkoutId),
          eq(workouts.status, HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS),
          eq(workouts.sourceWorkoutId, sourceWorkoutId)
        )
      )
      .get();

    if (!sourceWorkout || !draftWorkout) {
      return;
    }

    const sourceWorkoutExercises = tx
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, sourceWorkoutId))
      .orderBy(asc(workoutExercises.order))
      .all();
    const draftWorkoutExercises = tx
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, draftWorkoutId))
      .orderBy(asc(workoutExercises.order))
      .all();
    const draftWorkoutExerciseIds = draftWorkoutExercises.map(
      workoutExercise => workoutExercise.id
    );
    const draftSetRows =
      draftWorkoutExerciseIds.length > 0
        ? tx
            .select()
            .from(sets)
            .where(inArray(sets.workoutExerciseId, draftWorkoutExerciseIds))
            .orderBy(asc(sets.order))
            .all()
        : [];
    const completedDraftSetRows = draftSetRows.filter(
      set => set.status === 'completed'
    );

    if (completedDraftSetRows.length === 0) {
      return;
    }

    const draftSetsByWorkoutExerciseId = new Map<
      WorkoutExercise['id'],
      Set[]
    >();

    for (const set of draftSetRows) {
      const existingSets =
        draftSetsByWorkoutExerciseId.get(set.workoutExerciseId) ?? [];

      draftSetsByWorkoutExerciseId.set(set.workoutExerciseId, [
        ...existingSets,
        set
      ]);
    }

    const sourceExerciseIds = sourceWorkoutExercises.map(
      workoutExercise => workoutExercise.exerciseId
    );
    const draftExerciseIds = draftWorkoutExercises.map(
      workoutExercise => workoutExercise.exerciseId
    );

    tx.delete(workoutExercises)
      .where(eq(workoutExercises.workoutId, sourceWorkoutId))
      .run();

    if (draftWorkoutExercises.length > 0) {
      const replacementWorkoutExercises = tx
        .insert(workoutExercises)
        .values(
          draftWorkoutExercises.map(workoutExercise => ({
            workoutId: sourceWorkoutId,
            exerciseId: workoutExercise.exerciseId,
            order: workoutExercise.order,
            supersetId: workoutExercise.supersetId,
            notes: workoutExercise.notes
          }))
        )
        .returning()
        .all();
      const replacementWorkoutExerciseIdByDraftId = new Map<
        WorkoutExercise['id'],
        WorkoutExercise['id']
      >(
        draftWorkoutExercises.map((draftWorkoutExercise, index) => [
          draftWorkoutExercise.id,
          replacementWorkoutExercises[index]?.id ?? ''
        ])
      );
      const replacementSets: NewSet[] = [];

      for (const draftWorkoutExercise of draftWorkoutExercises) {
        const replacementWorkoutExerciseId =
          replacementWorkoutExerciseIdByDraftId.get(draftWorkoutExercise.id);

        if (!replacementWorkoutExerciseId) {
          continue;
        }

        const draftSets =
          draftSetsByWorkoutExerciseId.get(draftWorkoutExercise.id) ?? [];

        for (const set of draftSets) {
          replacementSets.push({
            workoutExerciseId: replacementWorkoutExerciseId,
            order: set.order,
            weightKg: set.weightKg,
            reps: set.reps,
            distanceMeters: set.distanceMeters,
            durationMs: set.durationMs,
            durationSeconds: set.durationSeconds,
            rpe: set.rpe,
            status: set.status,
            completedAt: set.completedAt
          });
        }
      }

      if (replacementSets.length > 0) {
        tx.insert(sets).values(replacementSets).run();
      }
    }

    tx.delete(workouts).where(eq(workouts.id, draftWorkoutId)).run();

    savedWorkout = sourceWorkout;
    affectedExerciseIds = Array.from(
      new Set([...sourceExerciseIds, ...draftExerciseIds])
    );
  });

  if (!savedWorkout) {
    return undefined;
  }

  return {
    workout: savedWorkout,
    affectedExerciseIds
  };
}

function requireWorkoutAllowsExerciseChanges(
  db: DrizzleDb,
  workoutId: Workout['id']
): void {
  const workout = db
    .select({ id: workouts.id })
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        inArray(workouts.status, [
          'in_progress',
          HISTORICAL_WORKOUT_DRAFT_STATUS,
          HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS
        ])
      )
    )
    .get();

  if (!workout) {
    throw new Error('Workout does not exist or cannot be edited.');
  }
}

function insertWorkoutExerciseAtNextOrder(
  db: DrizzleDb,
  workoutId: Workout['id'],
  exerciseId: Exercise['id']
): WorkoutExercise {
  const existingWorkoutExercise = db
    .select()
    .from(workoutExercises)
    .where(
      and(
        eq(workoutExercises.workoutId, workoutId),
        eq(workoutExercises.exerciseId, exerciseId)
      )
    )
    .limit(1)
    .get();

  if (existingWorkoutExercise) {
    return existingWorkoutExercise;
  }

  const lastWorkoutExercise = db
    .select({ order: workoutExercises.order })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(desc(workoutExercises.order))
    .limit(1)
    .get();

  return db
    .insert(workoutExercises)
    .values({
      workoutId,
      exerciseId,
      order: (lastWorkoutExercise?.order ?? -1) + 1,
      notes: null
    })
    .returning()
    .get();
}

export function addExerciseToWorkout(
  db: DrizzleDb,
  workoutId: Workout['id'],
  exerciseId: Exercise['id']
): WorkoutExercise {
  return db.transaction(tx => {
    requireWorkoutAllowsExerciseChanges(tx, workoutId);

    return insertWorkoutExerciseAtNextOrder(tx, workoutId, exerciseId);
  });
}

export function createCustomExerciseAndAddToWorkout(
  db: DrizzleDb,
  workoutId: Workout['id'],
  data: NewExercise
): { exercise: Exercise; workoutExercise: WorkoutExercise } {
  return db.transaction(tx => {
    requireWorkoutAllowsExerciseChanges(tx, workoutId);

    const exercise = createExercise(tx, data);
    const workoutExercise = insertWorkoutExerciseAtNextOrder(
      tx,
      workoutId,
      exercise.id
    );

    return { exercise, workoutExercise };
  });
}

export function saveActiveWorkoutExerciseDraft(
  db: DrizzleDb,
  workoutId: Workout['id'],
  rows: ActiveWorkoutExerciseDraftRow[],
  baselineRows: ActiveWorkoutExerciseDraftBaselineRow[],
  stagedCustomExercises: StagedCustomExercise[]
): void {
  db.transaction(tx => {
    const workout = tx
      .select({ status: workouts.status })
      .from(workouts)
      .where(eq(workouts.id, workoutId))
      .get();
    const existingWorkoutExercises = tx
      .select({
        id: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        order: workoutExercises.order,
        supersetId: workoutExercises.supersetId
      })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId))
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
      workout?.status !== 'in_progress' ||
      baselineById.size !== baselineRows.length ||
      draftIdSet.size !== rows.length ||
      draftExerciseIdSet.size !== rows.length ||
      stagedCustomExerciseById.size !== stagedCustomExercises.length ||
      existingWorkoutExercises.length !== baselineRows.length ||
      existingWorkoutExercises.some(existingRow => {
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
      throw new ActiveWorkoutExerciseDraftConflictError();
    }

    const persistedExercises =
      draftExerciseIdSet.size > 0
        ? tx
            .select({
              id: exercises.id,
              name: exercises.name,
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
      throw new ActiveWorkoutExerciseDraftConflictError();
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
          throw new ActiveWorkoutExerciseDraftConflictError();
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
      tx.delete(workoutExercises)
        .where(inArray(workoutExercises.id, removedIds))
        .run();
    }

    if (addedRows.length > 0) {
      tx.insert(workoutExercises)
        .values(
          addedRows.map(row => ({
            id: row.id,
            workoutId,
            exerciseId: row.exerciseId,
            order: row.order,
            supersetId: row.supersetId,
            notes: null
          }))
        )
        .run();
    }

    if (updatedRows.length > 0) {
      tx.update(workoutExercises)
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
            workoutExercises.id,
            updatedRows.map(row => row.id)
          )
        )
        .run();
    }
  });
}

export function reorderWorkoutExercises(
  db: DrizzleDb,
  workoutId: Workout['id'],
  orderedWorkoutExerciseIds: WorkoutExercise['id'][]
): void {
  db.transaction(tx => {
    const existingWorkoutExercises = tx
      .select({
        id: workoutExercises.id,
        order: workoutExercises.order,
        supersetId: workoutExercises.supersetId
      })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId))
      .all();

    const existingById = new Map(
      existingWorkoutExercises.map(we => [we.id, we])
    );

    const inputIdSet = new Set(orderedWorkoutExerciseIds);

    if (
      existingWorkoutExercises.length !== orderedWorkoutExerciseIds.length ||
      inputIdSet.size !== orderedWorkoutExerciseIds.length ||
      orderedWorkoutExerciseIds.some(id => !existingById.has(id))
    ) {
      throw new Error('Workout exercises changed before reorder completed.');
    }

    const normalizedRows = normalizeSupersetRows(
      orderedWorkoutExerciseIds.map((id, order) => ({
        id,
        order,
        supersetId: existingById.get(id)!.supersetId
      }))
    );
    const normalizedById = new Map(
      normalizedRows.map(row => [row.id, row.supersetId])
    );
    const toUpdate = orderedWorkoutExerciseIds.filter((id, newOrder) => {
      const existingRow = existingById.get(id)!;

      return (
        existingRow.order !== newOrder ||
        existingRow.supersetId !== normalizedById.get(id)
      );
    });

    if (toUpdate.length === 0) {
      return;
    }

    const caseExpr = sql.join(
      toUpdate.map(id => {
        const newOrder = orderedWorkoutExerciseIds.indexOf(id);

        return sql`WHEN ${id} THEN ${newOrder}`;
      }),
      sql` `
    );

    tx.update(workoutExercises)
      .set({
        order: sql`CASE id ${caseExpr} END`,
        supersetId: sql`CASE id ${sql.join(
          toUpdate.map(id => sql`WHEN ${id} THEN ${normalizedById.get(id)}`),
          sql` `
        )} END`
      })
      .where(inArray(workoutExercises.id, toUpdate))
      .run();
  });
}

export function updateWorkoutExerciseSupersets(
  db: DrizzleDb,
  workoutId: Workout['id'],
  rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[]
): void {
  db.transaction(tx => {
    const existingWorkoutExercises = tx
      .select({
        id: workoutExercises.id,
        order: workoutExercises.order,
        supersetId: workoutExercises.supersetId
      })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId))
      .orderBy(asc(workoutExercises.order))
      .all();
    const rowById = new Map(rows.map(row => [row.id, row.supersetId]));

    if (
      existingWorkoutExercises.length !== rows.length ||
      rows.some(
        row =>
          !existingWorkoutExercises.some(existing => existing.id === row.id)
      )
    ) {
      throw new Error(
        'Workout exercises changed before supersets were updated.'
      );
    }

    const normalizedRows = normalizeSupersetRows(
      existingWorkoutExercises.map(row => ({
        id: row.id,
        supersetId: rowById.get(row.id) ?? null
      }))
    );
    const toUpdate = normalizedRows.filter(row => {
      const existingRow = existingWorkoutExercises.find(
        existing => existing.id === row.id
      );

      return existingRow?.supersetId !== row.supersetId;
    });

    if (toUpdate.length === 0) {
      return;
    }

    const caseExpr = sql.join(
      toUpdate.map(row => sql`WHEN ${row.id} THEN ${row.supersetId}`),
      sql` `
    );

    tx.update(workoutExercises)
      .set({ supersetId: sql`CASE id ${caseExpr} END` })
      .where(
        inArray(
          workoutExercises.id,
          toUpdate.map(row => row.id)
        )
      )
      .run();
  });
}

export function updateWorkoutExerciseOrderAndSupersets(
  db: DrizzleDb,
  workoutId: Workout['id'],
  rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[],
  baselineRows: Pick<WorkoutExercise, 'id' | 'order' | 'supersetId'>[]
): void {
  db.transaction(tx => {
    const existingWorkoutExercises = tx
      .select({
        id: workoutExercises.id,
        order: workoutExercises.order,
        supersetId: workoutExercises.supersetId
      })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, workoutId))
      .all();

    const existingById = new Map(
      existingWorkoutExercises.map(workoutExercise => [
        workoutExercise.id,
        workoutExercise
      ])
    );
    const inputIdSet = new Set(rows.map(row => row.id));
    const baselineById = new Map(
      baselineRows.map(workoutExercise => [workoutExercise.id, workoutExercise])
    );

    if (
      inputIdSet.size !== rows.length ||
      baselineById.size !== baselineRows.length ||
      rows.some(row => !baselineById.has(row.id)) ||
      existingWorkoutExercises.length !== baselineRows.length ||
      existingWorkoutExercises.some(existingRow => {
        const baselineRow = baselineById.get(existingRow.id);

        return (
          !baselineRow ||
          existingRow.order !== baselineRow.order ||
          existingRow.supersetId !== baselineRow.supersetId
        );
      })
    ) {
      throw new Error('Workout exercises changed before edits were saved.');
    }

    const removedIds = baselineRows
      .filter(workoutExercise => !inputIdSet.has(workoutExercise.id))
      .map(workoutExercise => workoutExercise.id);
    const normalizedRows = normalizeSupersetRows(
      rows.map((row, order) => ({
        id: row.id,
        order,
        supersetId: row.supersetId
      }))
    );
    const toUpdate = normalizedRows.filter(row => {
      const existingRow = existingById.get(row.id)!;

      return (
        existingRow.order !== row.order ||
        existingRow.supersetId !== row.supersetId
      );
    });

    if (removedIds.length === 0 && toUpdate.length === 0) {
      return;
    }

    if (removedIds.length > 0) {
      tx.delete(workoutExercises)
        .where(inArray(workoutExercises.id, removedIds))
        .run();
    }

    if (toUpdate.length > 0) {
      tx.update(workoutExercises)
        .set({
          order: sql`CASE id ${sql.join(
            toUpdate.map(row => sql`WHEN ${row.id} THEN ${row.order}`),
            sql` `
          )} END`,
          supersetId: sql`CASE id ${sql.join(
            toUpdate.map(row => sql`WHEN ${row.id} THEN ${row.supersetId}`),
            sql` `
          )} END`
        })
        .where(
          inArray(
            workoutExercises.id,
            toUpdate.map(row => row.id)
          )
        )
        .run();
    }
  });
}

export function createSet(db: DrizzleDb, data: NewSet): Set {
  return db.insert(sets).values(data).returning().get();
}

export function updateSet(
  db: DrizzleDb,
  id: Set['id'],
  data: Partial<NewSet>
): Set | undefined {
  if (Object.keys(data).length === 0) {
    return getSetRecordById(db, id);
  }

  return db.update(sets).set(data).where(eq(sets.id, id)).returning().get();
}

export function deleteSet(db: DrizzleDb, id: Set['id']): void {
  db.delete(sets).where(eq(sets.id, id)).run();
}

export function repeatWorkout(
  db: DrizzleDb,
  {
    sourceWorkout,
    sourceWorkoutExercises
  }: {
    sourceWorkout: Pick<Workout, 'name'>;
    sourceWorkoutExercises: Pick<
      WorkoutExercise,
      'exerciseId' | 'order' | 'supersetId'
    >[];
  }
): Workout {
  let createdWorkout: Workout | undefined;

  db.transaction(tx => {
    const startedAt = Date.now();

    createdWorkout = tx
      .insert(workouts)
      .values({
        name: sourceWorkout.name,
        status: 'in_progress',
        startedAt,
        dateKey: toLocalDateKey(startedAt)
      })
      .returning()
      .get();

    const createdWorkoutRow = createdWorkout;

    if (!createdWorkoutRow || sourceWorkoutExercises.length === 0) {
      return;
    }

    tx.insert(workoutExercises)
      .values(
        sourceWorkoutExercises.map(workoutExercise => ({
          workoutId: createdWorkoutRow.id,
          exerciseId: workoutExercise.exerciseId,
          order: workoutExercise.order,
          supersetId: workoutExercise.supersetId,
          notes: null
        }))
      )
      .run();
  });

  if (!createdWorkout) {
    throw new Error('Failed to repeat workout.');
  }

  return createdWorkout;
}
