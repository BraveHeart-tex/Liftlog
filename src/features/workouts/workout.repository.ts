import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  personalRecords,
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
import {
  createExercise,
  isExerciseNameUniqueConstraintError,
  validateStagedCustomExerciseNames
} from '@/src/features/exercises/exercise.repository';
import {
  rebuildPersonalRecordsForExerciseInTransaction,
  rebuildPersonalRecordsForExercisesInTransaction
} from '@/src/features/progress/progress.repository';
import {
  getSetScore,
  resolveTrackingType
} from '@/src/features/progress/tracking.domain';
import { normalizeSupersetRows } from '@/src/features/workouts/superset.utils';
import { formatWorkoutName } from '@/src/features/workouts/workout-display.utils';
import { toLocalDateKey } from '@/src/lib/utils/date.utils';
import { generateUuid } from '@/src/lib/utils/uuid.utils';
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  or,
  sql
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

export const HISTORICAL_WORKOUT_DRAFT_STATUS = 'historical_draft';

export const HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS = 'historical_edit_draft';
const HISTORICAL_WORKOUT_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const HISTORICAL_SET_INTERVAL_MS = 60_000;
const HISTORICAL_EDIT_BATCH_SIZE = 100;

function chunkRows<T>(rows: T[]): T[][] {
  const chunks: T[][] = [];

  for (
    let index = 0;
    index < rows.length;
    index += HISTORICAL_EDIT_BATCH_SIZE
  ) {
    chunks.push(rows.slice(index, index + HISTORICAL_EDIT_BATCH_SIZE));
  }

  return chunks;
}

function buildHistoricalWorkoutSourceSnapshot(
  workout: Workout,
  workoutExerciseRows: WorkoutExercise[],
  setRows: Set[]
): string {
  return JSON.stringify({
    workout: {
      id: workout.id,
      name: workout.name,
      status: workout.status,
      startedAt: workout.startedAt,
      dateKey: workout.dateKey,
      completedAt: workout.completedAt,
      notes: workout.notes,
      sourceWorkoutId: workout.sourceWorkoutId
    },
    workoutExercises: workoutExerciseRows
      .map(({ id, workoutId, exerciseId, order, supersetId, notes }) => ({
        id,
        workoutId,
        exerciseId,
        order,
        supersetId,
        notes
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    sets: setRows
      .map(
        ({
          id,
          workoutExerciseId,
          order,
          weightKg,
          reps,
          distanceMeters,
          durationMs,
          durationSeconds,
          rpe,
          status,
          completedAt
        }) => ({
          id,
          workoutExerciseId,
          order,
          weightKg,
          reps,
          distanceMeters,
          durationMs,
          durationSeconds,
          rpe,
          status,
          completedAt
        })
      )
      .sort((left, right) => left.id.localeCompare(right.id))
  });
}

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

interface CompletedSetCommandOptions {
  maintainPersonalRecords?: boolean;
}

interface CompletedSetMutationResult {
  set: Set;
  isNewPersonalRecord: boolean;
}

type NewCompletedSet = Omit<NewSet, 'status'>;
type CompletedSetUpdates = Omit<
  Partial<NewSet>,
  'id' | 'workoutExerciseId' | 'status'
>;

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

export class HistoricalWorkoutEditDraftConflictError extends Error {
  constructor() {
    super('Historical workout edit draft conflicted with persisted data.');
    this.name = 'HistoricalWorkoutEditDraftConflictError';
  }
}

function getWorkoutExerciseProgressContext(
  db: DrizzleDb,
  workoutExerciseId: WorkoutExercise['id']
) {
  return db
    .select({
      exerciseId: workoutExercises.exerciseId,
      trackingType: exercises.trackingType,
      workoutStartedAt: workouts.startedAt
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(eq(workoutExercises.id, workoutExerciseId))
    .get();
}

function getSetProgressContext(db: DrizzleDb, setId: Set['id']) {
  return db
    .select({
      set: sets,
      exerciseId: workoutExercises.exerciseId,
      trackingType: exercises.trackingType,
      workoutStartedAt: workouts.startedAt
    })
    .from(sets)
    .innerJoin(
      workoutExercises,
      eq(sets.workoutExerciseId, workoutExercises.id)
    )
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(eq(sets.id, setId))
    .get();
}

function getCurrentPersonalRecordScore(
  db: DrizzleDb,
  exerciseId: Exercise['id']
): number | undefined {
  return db
    .select({ score: personalRecords.score })
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.score))
    .limit(1)
    .get()?.score;
}

function isSetInPersonalRecordChain(db: DrizzleDb, setId: Set['id']): boolean {
  return (
    db
      .select({ id: personalRecords.id })
      .from(personalRecords)
      .where(eq(personalRecords.setId, setId))
      .limit(1)
      .get() !== undefined
  );
}

function isPersonalRecordScore(
  score: number | null,
  previousBestScore: number | undefined
): boolean {
  return score !== null && score > (previousBestScore ?? 0);
}

function getPersonalRecordScoreBeforeSet(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  set: Set,
  workoutStartedAt: Workout['startedAt']
): number | undefined {
  const achievedAt = set.completedAt ?? workoutStartedAt;

  return db
    .select({ score: personalRecords.score })
    .from(personalRecords)
    .innerJoin(sets, eq(personalRecords.setId, sets.id))
    .where(
      and(
        eq(personalRecords.exerciseId, exerciseId),
        or(
          lt(personalRecords.achievedAt, achievedAt),
          and(
            eq(personalRecords.achievedAt, achievedAt),
            lt(sets.order, set.order)
          )
        )
      )
    )
    .orderBy(desc(personalRecords.score))
    .limit(1)
    .get()?.score;
}

function isLatestPersonalRecordSet(
  db: DrizzleDb,
  { exerciseId, setId }: { exerciseId: Exercise['id']; setId: Set['id'] }
): boolean {
  return (
    db
      .select({ setId: personalRecords.setId })
      .from(personalRecords)
      .where(eq(personalRecords.exerciseId, exerciseId))
      .orderBy(desc(personalRecords.score))
      .limit(1)
      .get()?.setId === setId
  );
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
  const rankedExerciseUsages = db
    .select({
      exerciseId: workoutExercises.exerciseId,
      startedAt: workouts.startedAt,
      exerciseOrder: workoutExercises.order,
      usageRank: sql<number>`row_number() over (
            partition by ${workoutExercises.exerciseId}
            order by ${workouts.startedAt} desc, ${workoutExercises.order} asc, ${workouts.id} desc, ${workoutExercises.id} desc
          )`.as('usage_rank')
    })
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
    .as('ranked_exercise_usages');

  return db
    .select({ exerciseId: rankedExerciseUsages.exerciseId })
    .from(rankedExerciseUsages)
    .where(eq(rankedExerciseUsages.usageRank, 1))
    .orderBy(
      desc(rankedExerciseUsages.startedAt),
      asc(rankedExerciseUsages.exerciseOrder),
      asc(rankedExerciseUsages.exerciseId)
    )
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
  {
    workoutId,
    workoutExerciseId
  }: {
    workoutId: Workout['id'];
    workoutExerciseId: WorkoutExercise['id'];
  }
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

interface WorkoutHistoryDetailRow {
  workout: Workout;
  workoutExercise: WorkoutExercise | null;
  exercise: Exercise | null;
  set: Set | null;
}

interface WorkoutHistoryDetail {
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

export function cleanupLegacyHistoricalWorkoutEditDrafts(db: DrizzleDb): void {
  db.delete(workouts)
    .where(
      and(
        eq(workouts.status, HISTORICAL_WORKOUT_EDIT_DRAFT_STATUS),
        isNull(workouts.sourceSnapshot)
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
        sourceSnapshot: buildHistoricalWorkoutSourceSnapshot(
          sourceWorkout,
          sourceWorkoutExercises,
          sourceSets
        ),
        sourceWorkoutId: sourceWorkout.id
      })
      .returning()
      .get();

    const createdWorkoutRow = createdWorkout;

    if (!createdWorkoutRow || sourceWorkoutExercises.length === 0) {
      return;
    }

    const draftWorkoutExercises = sourceWorkoutExercises.map(
      workoutExercise => ({
        id: generateUuid(),
        workoutId: createdWorkoutRow.id,
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order,
        supersetId: workoutExercise.supersetId,
        notes: workoutExercise.notes,
        sourceWorkoutExerciseId: workoutExercise.id
      })
    );

    tx.insert(workoutExercises).values(draftWorkoutExercises).run();
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
          completedAt: set.completedAt,
          sourceSetId: set.id
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
  { id, name }: { id: Workout['id']; name: Workout['name'] }
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
  db.update(workouts)
    .set({
      status: 'completed',
      completedAt: Date.now()
    })
    .where(and(eq(workouts.id, id), eq(workouts.status, 'in_progress')))
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

    rebuildPersonalRecordsForExercisesInTransaction(tx, affectedExerciseIds);
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
    const sourceWorkoutExerciseIds = sourceWorkoutExercises.map(row => row.id);
    const draftWorkoutExerciseIds = draftWorkoutExercises.map(row => row.id);
    const sourceSetRows =
      sourceWorkoutExerciseIds.length > 0
        ? tx
            .select()
            .from(sets)
            .where(inArray(sets.workoutExerciseId, sourceWorkoutExerciseIds))
            .all()
        : [];
    const draftSetRows = draftWorkoutExerciseIds.length
      ? tx
          .select()
          .from(sets)
          .where(inArray(sets.workoutExerciseId, draftWorkoutExerciseIds))
          .all()
      : [];

    if (
      !draftWorkout.sourceSnapshot ||
      draftWorkout.sourceSnapshot !==
        buildHistoricalWorkoutSourceSnapshot(
          sourceWorkout,
          sourceWorkoutExercises,
          sourceSetRows
        )
    ) {
      throw new HistoricalWorkoutEditDraftConflictError();
    }

    const completedDraftSetRows = draftSetRows.filter(
      set => set.status === 'completed'
    );

    if (completedDraftSetRows.length === 0) {
      return;
    }

    const sourceExerciseById = new Map(
      sourceWorkoutExercises.map(row => [row.id, row])
    );
    const draftExerciseById = new Map(
      draftWorkoutExercises.map(row => [row.id, row])
    );
    const mappedDraftExercises = draftWorkoutExercises.filter(
      row => row.sourceWorkoutExerciseId !== null
    );
    const mappedSourceExerciseIds = mappedDraftExercises.map(
      row => row.sourceWorkoutExerciseId!
    );
    const sourceSetById = new Map(sourceSetRows.map(row => [row.id, row]));
    const mappedDraftSets = draftSetRows.filter(
      row => row.sourceSetId !== null
    );
    const mappedSourceSetIds = mappedDraftSets.map(row => row.sourceSetId!);

    if (
      new Set(mappedSourceExerciseIds).size !==
        mappedSourceExerciseIds.length ||
      mappedDraftExercises.some(
        row => !sourceExerciseById.has(row.sourceWorkoutExerciseId!)
      ) ||
      new Set(mappedSourceSetIds).size !== mappedSourceSetIds.length ||
      mappedDraftSets.some(row => {
        const sourceSet = sourceSetById.get(row.sourceSetId!);
        const draftExercise = draftExerciseById.get(row.workoutExerciseId);

        return (
          !sourceSet ||
          !draftExercise?.sourceWorkoutExerciseId ||
          sourceSet.workoutExerciseId !== draftExercise.sourceWorkoutExerciseId
        );
      })
    ) {
      throw new HistoricalWorkoutEditDraftConflictError();
    }

    const removedWorkoutExercises = sourceWorkoutExercises.filter(
      row => !mappedSourceExerciseIds.includes(row.id)
    );
    const removedWorkoutExerciseIds = new Set(
      removedWorkoutExercises.map(row => row.id)
    );
    const addedDraftExercises = draftWorkoutExercises.filter(
      row => row.sourceWorkoutExerciseId === null
    );
    const updatedDraftExercises = mappedDraftExercises.filter(row => {
      const source = sourceExerciseById.get(row.sourceWorkoutExerciseId!)!;

      return (
        source.exerciseId !== row.exerciseId ||
        source.order !== row.order ||
        source.supersetId !== row.supersetId ||
        source.notes !== row.notes
      );
    });
    const removedSets = sourceSetRows.filter(
      row =>
        !removedWorkoutExerciseIds.has(row.workoutExerciseId) &&
        !mappedSourceSetIds.includes(row.id)
    );
    const addedDraftSets = draftSetRows.filter(row => row.sourceSetId === null);
    const updatedDraftSets = mappedDraftSets.filter(row => {
      const source = sourceSetById.get(row.sourceSetId!)!;

      return (
        source.order !== row.order ||
        source.weightKg !== row.weightKg ||
        source.reps !== row.reps ||
        source.distanceMeters !== row.distanceMeters ||
        source.durationMs !== row.durationMs ||
        source.durationSeconds !== row.durationSeconds ||
        source.rpe !== row.rpe ||
        source.status !== row.status ||
        source.completedAt !== row.completedAt
      );
    });
    const addedSourceExerciseIdByDraftId = new Map(
      addedDraftExercises.map(row => [row.id, generateUuid()])
    );
    const sourceExerciseIdByDraftId = new Map(
      draftWorkoutExercises.map(row => [
        row.id,
        row.sourceWorkoutExerciseId ??
          addedSourceExerciseIdByDraftId.get(row.id)!
      ])
    );
    const affected = new Set<WorkoutExercise['exerciseId']>();
    const addSourceExerciseForSet = (set: Set) => {
      const sourceExercise = sourceExerciseById.get(set.workoutExerciseId);

      if (sourceExercise) {
        affected.add(sourceExercise.exerciseId);
      }
    };

    const addDraftExerciseForSet = (set: Set) => {
      const draftExercise = draftExerciseById.get(set.workoutExerciseId);

      if (draftExercise) {
        affected.add(draftExercise.exerciseId);
      }
    };

    for (const set of sourceSetRows) {
      if (
        removedWorkoutExerciseIds.has(set.workoutExerciseId) &&
        set.status === 'completed'
      ) {
        addSourceExerciseForSet(set);
      }
    }

    for (const set of removedSets) {
      if (set.status === 'completed') {
        addSourceExerciseForSet(set);
      }
    }

    for (const set of addedDraftSets) {
      if (set.status === 'completed') {
        addDraftExerciseForSet(set);
      }
    }

    for (const draftSet of updatedDraftSets) {
      const sourceSet = sourceSetById.get(draftSet.sourceSetId!)!;

      if (sourceSet.status === 'completed' || draftSet.status === 'completed') {
        addSourceExerciseForSet(sourceSet);
        addDraftExerciseForSet(draftSet);
      }
    }

    for (const draftExercise of updatedDraftExercises) {
      const sourceExercise = sourceExerciseById.get(
        draftExercise.sourceWorkoutExerciseId!
      )!;

      if (sourceExercise.exerciseId !== draftExercise.exerciseId) {
        const hasCompletedSets = sourceSetRows.some(
          set =>
            set.workoutExerciseId === sourceExercise.id &&
            set.status === 'completed'
        );

        if (hasCompletedSets) {
          affected.add(sourceExercise.exerciseId);
          affected.add(draftExercise.exerciseId);
        }
      }
    }

    for (const rows of chunkRows(removedSets)) {
      tx.delete(sets)
        .where(
          inArray(
            sets.id,
            rows.map(row => row.id)
          )
        )
        .run();
    }

    for (const rows of chunkRows(removedWorkoutExercises)) {
      tx.delete(workoutExercises)
        .where(
          inArray(
            workoutExercises.id,
            rows.map(row => row.id)
          )
        )
        .run();
    }

    for (const rows of chunkRows(addedDraftExercises)) {
      tx.insert(workoutExercises)
        .values(
          rows.map(row => ({
            id: addedSourceExerciseIdByDraftId.get(row.id)!,
            workoutId: sourceWorkoutId,
            exerciseId: row.exerciseId,
            order: row.order,
            supersetId: row.supersetId,
            notes: row.notes
          }))
        )
        .run();
    }

    for (const rows of chunkRows(updatedDraftExercises)) {
      tx.update(workoutExercises)
        .set({
          exerciseId: sql`CASE ${workoutExercises.id} ${sql.join(
            rows.map(
              row =>
                sql`WHEN ${row.sourceWorkoutExerciseId} THEN ${row.exerciseId}`
            ),
            sql` `
          )} END`,
          order: sql`CASE ${workoutExercises.id} ${sql.join(
            rows.map(
              row => sql`WHEN ${row.sourceWorkoutExerciseId} THEN ${row.order}`
            ),
            sql` `
          )} END`,
          supersetId: sql`CASE ${workoutExercises.id} ${sql.join(
            rows.map(
              row =>
                sql`WHEN ${row.sourceWorkoutExerciseId} THEN ${row.supersetId}`
            ),
            sql` `
          )} END`,
          notes: sql`CASE ${workoutExercises.id} ${sql.join(
            rows.map(
              row => sql`WHEN ${row.sourceWorkoutExerciseId} THEN ${row.notes}`
            ),
            sql` `
          )} END`
        })
        .where(
          inArray(
            workoutExercises.id,
            rows.map(row => row.sourceWorkoutExerciseId!)
          )
        )
        .run();
    }

    for (const rows of chunkRows(addedDraftSets)) {
      tx.insert(sets)
        .values(
          rows.map(row => ({
            id: generateUuid(),
            workoutExerciseId: sourceExerciseIdByDraftId.get(
              row.workoutExerciseId
            )!,
            order: row.order,
            weightKg: row.weightKg,
            reps: row.reps,
            distanceMeters: row.distanceMeters,
            durationMs: row.durationMs,
            durationSeconds: row.durationSeconds,
            rpe: row.rpe,
            status: row.status,
            completedAt: row.completedAt
          }))
        )
        .run();
    }

    for (const rows of chunkRows(updatedDraftSets)) {
      tx.update(sets)
        .set({
          order: sql`CASE ${sets.id} ${sql.join(
            rows.map(row => sql`WHEN ${row.sourceSetId} THEN ${row.order}`),
            sql` `
          )} END`,
          weightKg: sql`CASE ${sets.id} ${sql.join(
            rows.map(row => sql`WHEN ${row.sourceSetId} THEN ${row.weightKg}`),
            sql` `
          )} END`,
          reps: sql`CASE ${sets.id} ${sql.join(
            rows.map(row => sql`WHEN ${row.sourceSetId} THEN ${row.reps}`),
            sql` `
          )} END`,
          distanceMeters: sql`CASE ${sets.id} ${sql.join(
            rows.map(
              row => sql`WHEN ${row.sourceSetId} THEN ${row.distanceMeters}`
            ),
            sql` `
          )} END`,
          durationMs: sql`CASE ${sets.id} ${sql.join(
            rows.map(
              row => sql`WHEN ${row.sourceSetId} THEN ${row.durationMs}`
            ),
            sql` `
          )} END`,
          durationSeconds: sql`CASE ${sets.id} ${sql.join(
            rows.map(
              row => sql`WHEN ${row.sourceSetId} THEN ${row.durationSeconds}`
            ),
            sql` `
          )} END`,
          rpe: sql`CASE ${sets.id} ${sql.join(
            rows.map(row => sql`WHEN ${row.sourceSetId} THEN ${row.rpe}`),
            sql` `
          )} END`,
          status: sql`CASE ${sets.id} ${sql.join(
            rows.map(row => sql`WHEN ${row.sourceSetId} THEN ${row.status}`),
            sql` `
          )} END`,
          completedAt: sql`CASE ${sets.id} ${sql.join(
            rows.map(
              row => sql`WHEN ${row.sourceSetId} THEN ${row.completedAt}`
            ),
            sql` `
          )} END`
        })
        .where(
          inArray(
            sets.id,
            rows.map(row => row.sourceSetId!)
          )
        )
        .run();
    }

    savedWorkout = tx
      .update(workouts)
      .set({ name: draftWorkout.name, notes: draftWorkout.notes })
      .where(eq(workouts.id, sourceWorkoutId))
      .returning()
      .get();

    tx.delete(workouts).where(eq(workouts.id, draftWorkoutId)).run();

    affectedExerciseIds = Array.from(affected).sort();

    rebuildPersonalRecordsForExercisesInTransaction(tx, affectedExerciseIds);
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
  {
    workoutId,
    exerciseId
  }: { workoutId: Workout['id']; exerciseId: Exercise['id'] }
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
  {
    workoutId,
    exerciseId
  }: { workoutId: Workout['id']; exerciseId: Exercise['id'] }
): WorkoutExercise {
  return db.transaction(tx => {
    requireWorkoutAllowsExerciseChanges(tx, workoutId);

    return insertWorkoutExerciseAtNextOrder(tx, { workoutId, exerciseId });
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
    const workoutExercise = insertWorkoutExerciseAtNextOrder(tx, {
      workoutId,
      exerciseId: exercise.id
    });

    return { exercise, workoutExercise };
  });
}

export function saveActiveWorkoutExerciseDraft(
  db: DrizzleDb,
  {
    workoutId,
    rows,
    baselineRows,
    stagedCustomExercises
  }: {
    workoutId: Workout['id'];
    rows: ActiveWorkoutExerciseDraftRow[];
    baselineRows: ActiveWorkoutExerciseDraftBaselineRow[];
    stagedCustomExercises: StagedCustomExercise[];
  }
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

    const normalizedStagedCustomExercises = validateStagedCustomExerciseNames(
      tx,
      stagedCustomExercises,
      () => new ActiveWorkoutExerciseDraftConflictError()
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
          throw new ActiveWorkoutExerciseDraftConflictError();
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

export function createCompletedSet(
  db: DrizzleDb,
  data: NewCompletedSet,
  { maintainPersonalRecords = true }: CompletedSetCommandOptions = {}
): CompletedSetMutationResult {
  return db.transaction(tx => {
    const progressContext = maintainPersonalRecords
      ? getWorkoutExerciseProgressContext(tx, data.workoutExerciseId)
      : undefined;
    const currentBestScore = progressContext
      ? getCurrentPersonalRecordScore(tx, progressContext.exerciseId)
      : undefined;
    const set = tx
      .insert(sets)
      .values({ ...data, status: 'completed' })
      .returning()
      .get();
    const score = progressContext
      ? getSetScore(resolveTrackingType(progressContext.trackingType), set)
      : null;
    const couldBecomeLatestPersonalRecord = isPersonalRecordScore(
      score,
      currentBestScore
    );
    const couldAffectPersonalRecordChain = progressContext
      ? isPersonalRecordScore(
          score,
          getPersonalRecordScoreBeforeSet(
            tx,
            progressContext.exerciseId,
            set,
            progressContext.workoutStartedAt
          )
        )
      : false;

    if (progressContext && couldAffectPersonalRecordChain) {
      rebuildPersonalRecordsForExerciseInTransaction(
        tx,
        progressContext.exerciseId
      );
    }

    const isNewPersonalRecord =
      progressContext !== undefined &&
      couldBecomeLatestPersonalRecord &&
      isLatestPersonalRecordSet(tx, {
        exerciseId: progressContext.exerciseId,
        setId: set.id
      });

    return { set, isNewPersonalRecord };
  });
}

export function updateCompletedSet(
  db: DrizzleDb,
  id: Set['id'],
  data: CompletedSetUpdates,
  { maintainPersonalRecords = true }: CompletedSetCommandOptions = {}
): CompletedSetMutationResult | undefined {
  return db.transaction(tx => {
    const progressContext = getSetProgressContext(tx, id);

    if (!progressContext) {
      return undefined;
    }

    const currentBestScore = maintainPersonalRecords
      ? getCurrentPersonalRecordScore(tx, progressContext.exerciseId)
      : undefined;
    const wasInPersonalRecordChain = maintainPersonalRecords
      ? isSetInPersonalRecordChain(tx, id)
      : false;
    const set = tx
      .update(sets)
      .set({ ...data, status: 'completed' })
      .where(eq(sets.id, id))
      .returning()
      .get();
    const score = maintainPersonalRecords
      ? getSetScore(resolveTrackingType(progressContext.trackingType), set)
      : null;
    const couldBecomeLatestPersonalRecord = isPersonalRecordScore(
      score,
      currentBestScore
    );
    const couldAffectPersonalRecordChain =
      maintainPersonalRecords &&
      isPersonalRecordScore(
        score,
        getPersonalRecordScoreBeforeSet(
          tx,
          progressContext.exerciseId,
          set,
          progressContext.workoutStartedAt
        )
      );

    if (wasInPersonalRecordChain || couldAffectPersonalRecordChain) {
      rebuildPersonalRecordsForExerciseInTransaction(
        tx,
        progressContext.exerciseId
      );
    }

    const isNewPersonalRecord =
      couldBecomeLatestPersonalRecord &&
      isLatestPersonalRecordSet(tx, {
        exerciseId: progressContext.exerciseId,
        setId: set.id
      });

    return { set, isNewPersonalRecord };
  });
}

export function deleteCompletedSet(
  db: DrizzleDb,
  id: Set['id'],
  { maintainPersonalRecords = true }: CompletedSetCommandOptions = {}
): Set | undefined {
  return db.transaction(tx => {
    const progressContext = getSetProgressContext(tx, id);

    if (!progressContext) {
      return undefined;
    }

    const wasInPersonalRecordChain = maintainPersonalRecords
      ? isSetInPersonalRecordChain(tx, id)
      : false;

    tx.delete(sets).where(eq(sets.id, id)).run();

    if (wasInPersonalRecordChain) {
      rebuildPersonalRecordsForExerciseInTransaction(
        tx,
        progressContext.exerciseId
      );
    }

    return progressContext.set;
  });
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
