import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  type Exercise,
  type NewPersonalRecord,
  type PersonalRecord,
  type Set,
  type Workout,
  type WorkoutExercise
} from '@/src/db/schema';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/sqlite-core';
import {
  computeEstimated1RM,
  getPersonalRecordSnapshot,
  getSetScore,
  resolveTrackingType
} from '@/src/features/progress/tracking.domain';

export function getPersonalRecordsByExerciseQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id']
) {
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.achievedAt));
}

export function getPersonalRecordsByExercise(
  db: DrizzleDb,
  exerciseId: Exercise['id']
): PersonalRecord[] {
  return getPersonalRecordsByExerciseQuery(db, exerciseId).all();
}

const TWO_MONTHS_MS = 2 * 30 * 24 * 60 * 60 * 1000;

interface ExerciseHistoryQueryRow {
  workout: Workout;
  workoutExercise: WorkoutExercise | null;
  set: Set | null;
  isVisible: number;
  isProgression: number;
}

interface ExerciseHistoryRows {
  visibleWorkoutRows: { workout: Workout }[];
  progressionWorkoutRows: { workout: Workout }[];
  setRows: { workoutId: Workout['id']; set: Set }[];
}

interface ExerciseHistoryQueryOptions {
  beforeStartedAt?: Workout['startedAt'];
  includeProgression?: boolean;
  includeLimitProbe?: boolean;
}

export function getExerciseHistoryQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  visibleWorkoutLimit: number,
  options: ExerciseHistoryQueryOptions = {}
) {
  const {
    beforeStartedAt,
    includeProgression = false,
    includeLimitProbe = false
  } = options;
  const visibleWorkoutIds = db.$with('visible_exercise_history_workouts').as(
    db
      .selectDistinct({
        id: workouts.id,
        startedAt: workouts.startedAt
      })
      .from(workouts)
      .innerJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
      .where(
        and(
          eq(workouts.status, 'completed'),
          eq(workoutExercises.exerciseId, exerciseId),
          beforeStartedAt !== undefined
            ? sql`${workouts.startedAt} < ${beforeStartedAt}`
            : undefined
        )
      )
      .orderBy(desc(workouts.startedAt), desc(workouts.id))
      .limit(visibleWorkoutLimit + (includeLimitProbe ? 1 : 0))
  );
  const visiblePageWorkoutIds = db
    .$with('visible_exercise_history_page_workouts')
    .as(
      db
        .select({
          id: visibleWorkoutIds.id,
          startedAt: visibleWorkoutIds.startedAt
        })
        .from(visibleWorkoutIds)
        .orderBy(desc(visibleWorkoutIds.startedAt), desc(visibleWorkoutIds.id))
        .limit(visibleWorkoutLimit)
    );
  const latestVisibleStartedAt = db
    .select({ startedAt: visibleWorkoutIds.startedAt })
    .from(visibleWorkoutIds)
    .orderBy(desc(visibleWorkoutIds.startedAt), desc(visibleWorkoutIds.id))
    .limit(1);
  const progressionWorkoutIds = db
    .$with('progression_exercise_history_workouts')
    .as(
      db
        .selectDistinct({
          id: workouts.id,
          startedAt: workouts.startedAt
        })
        .from(workouts)
        .innerJoin(
          workoutExercises,
          eq(workouts.id, workoutExercises.workoutId)
        )
        .where(
          and(
            eq(workouts.status, 'completed'),
            eq(workoutExercises.exerciseId, exerciseId),
            includeProgression
              ? sql`${workouts.startedAt} >= (${latestVisibleStartedAt}) - ${TWO_MONTHS_MS}`
              : eq(workouts.id, '')
          )
        )
    );
  const selectedWorkoutIds = db.$with('selected_exercise_history_workouts').as(
    unionAll(
      db
        .select({
          id: visibleWorkoutIds.id,
          isVisible: sql<number>`1`.as('is_visible'),
          isProgression: sql<number>`0`.as('is_progression'),
          loadSets: sql<number>`0`.as('load_sets')
        })
        .from(visibleWorkoutIds),
      db
        .select({
          id: visiblePageWorkoutIds.id,
          isVisible: sql<number>`1`.as('is_visible'),
          isProgression: sql<number>`0`.as('is_progression'),
          loadSets: sql<number>`1`.as('load_sets')
        })
        .from(visiblePageWorkoutIds),
      db
        .select({
          id: progressionWorkoutIds.id,
          isVisible: sql<number>`0`.as('is_visible'),
          isProgression: sql<number>`1`.as('is_progression'),
          loadSets: sql<number>`1`.as('load_sets')
        })
        .from(progressionWorkoutIds)
    )
  );
  const uniqueSelectedWorkoutIds = db
    .$with('unique_selected_exercise_history_workouts')
    .as(
      db
        .select({
          id: selectedWorkoutIds.id,
          isVisible: sql<number>`max(${selectedWorkoutIds.isVisible})`.as(
            'is_visible'
          ),
          isProgression:
            sql<number>`max(${selectedWorkoutIds.isProgression})`.as(
              'is_progression'
            ),
          loadSets: sql<number>`max(${selectedWorkoutIds.loadSets})`.as(
            'load_sets'
          )
        })
        .from(selectedWorkoutIds)
        .groupBy(selectedWorkoutIds.id)
    );

  return db
    .with(
      visibleWorkoutIds,
      visiblePageWorkoutIds,
      progressionWorkoutIds,
      selectedWorkoutIds,
      uniqueSelectedWorkoutIds
    )
    .select({
      workout: workouts,
      workoutExercise: workoutExercises,
      set: sets,
      isVisible: uniqueSelectedWorkoutIds.isVisible,
      isProgression: uniqueSelectedWorkoutIds.isProgression
    })
    .from(uniqueSelectedWorkoutIds)
    .innerJoin(workouts, eq(workouts.id, uniqueSelectedWorkoutIds.id))
    .leftJoin(
      workoutExercises,
      and(
        eq(workoutExercises.workoutId, workouts.id),
        eq(workoutExercises.exerciseId, exerciseId)
      )
    )
    .leftJoin(
      sets,
      and(
        eq(sets.workoutExerciseId, workoutExercises.id),
        eq(uniqueSelectedWorkoutIds.loadSets, 1)
      )
    )
    .orderBy(
      desc(workouts.startedAt),
      desc(workouts.id),
      asc(workoutExercises.order),
      asc(sets.order)
    );
}

export function mapExerciseHistoryRows(
  rows: ExerciseHistoryQueryRow[]
): ExerciseHistoryRows {
  const visibleWorkoutRows: { workout: Workout }[] = [];
  const progressionWorkoutRows: { workout: Workout }[] = [];
  const setRows: { workoutId: Workout['id']; set: Set }[] = [];
  const visibleWorkoutIds = new Set<Workout['id']>();
  const progressionWorkoutIds = new Set<Workout['id']>();

  for (const row of rows) {
    if (row.isVisible && !visibleWorkoutIds.has(row.workout.id)) {
      visibleWorkoutIds.add(row.workout.id);
      visibleWorkoutRows.push({ workout: row.workout });
    }

    if (row.isProgression && !progressionWorkoutIds.has(row.workout.id)) {
      progressionWorkoutIds.add(row.workout.id);
      progressionWorkoutRows.push({ workout: row.workout });
    }

    if (row.set) {
      setRows.push({ workoutId: row.workout.id, set: row.set });
    }
  }

  return { visibleWorkoutRows, progressionWorkoutRows, setRows };
}

export function buildExerciseHistory(
  workoutRows: { workout: Workout }[],
  setRows: { workoutId: Workout['id']; set: Set }[]
): { workout: Workout; sets: Set[] }[] {
  const seenWorkoutIds = new Set<Workout['id']>();
  const workoutHistory: Workout[] = [];

  for (const row of workoutRows) {
    if (seenWorkoutIds.has(row.workout.id)) {
      continue;
    }

    seenWorkoutIds.add(row.workout.id);
    workoutHistory.push(row.workout);
  }

  if (workoutHistory.length === 0) {
    return [];
  }

  const limitedWorkoutIds = new Set(workoutHistory.map(workout => workout.id));
  const setsByWorkoutId = new Map<Workout['id'], Set[]>();

  for (const row of setRows) {
    if (!limitedWorkoutIds.has(row.workoutId)) {
      continue;
    }

    const existingSets = setsByWorkoutId.get(row.workoutId);

    if (existingSets) {
      existingSets.push(row.set);
      continue;
    }

    setsByWorkoutId.set(row.workoutId, [row.set]);
  }

  return workoutHistory.map(workout => {
    const setsForWorkout = setsByWorkoutId.get(workout.id) ?? [];

    return {
      workout,
      sets: setsForWorkout
    };
  });
}

function getCompletedSetsForPersonalRecords(db: DrizzleDb, exerciseId: string) {
  return db
    .select({
      set: sets,
      workoutStartedAt: workouts.startedAt
    })
    .from(sets)
    .innerJoin(
      workoutExercises,
      eq(sets.workoutExerciseId, workoutExercises.id)
    )
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workoutExercises.exerciseId, exerciseId),
        inArray(workouts.status, ['completed', 'in_progress']),
        eq(sets.status, 'completed')
      )
    )
    .all();
}

function getExerciseTrackingType(db: DrizzleDb, exerciseId: Exercise['id']) {
  const exercise = db
    .select({ trackingType: exercises.trackingType })
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .get();

  return resolveTrackingType(exercise?.trackingType);
}

function getSetAchievedAt(row: {
  set: Set;
  workoutStartedAt: Workout['startedAt'];
}): number {
  return row.set.completedAt ?? row.workoutStartedAt;
}

export function rebuildPersonalRecordsForExercise(
  db: DrizzleDb,
  exerciseId: Exercise['id']
): void {
  db.transaction(tx => {
    rebuildPersonalRecordsForExerciseInTransaction(tx, exerciseId);
  });
}

export function rebuildPersonalRecordsForExerciseInTransaction(
  db: DrizzleDb,
  exerciseId: Exercise['id']
): void {
  const completedSetRows = getCompletedSetsForPersonalRecords(db, exerciseId);
  const trackingType = getExerciseTrackingType(db, exerciseId);
  const sortedRows = [...completedSetRows].sort((left, right) => {
    const achievedAtDiff = getSetAchievedAt(left) - getSetAchievedAt(right);

    if (achievedAtDiff !== 0) {
      return achievedAtDiff;
    }

    return left.set.order - right.set.order;
  });
  let bestScore = 0;
  const newRecords: NewPersonalRecord[] = [];

  for (const row of sortedRows) {
    const score = getSetScore(trackingType, row.set);

    if (score === null || score <= bestScore) {
      continue;
    }

    bestScore = score;
    newRecords.push({
      exerciseId,
      setId: row.set.id,
      achievedAt: getSetAchievedAt(row),
      ...getPersonalRecordSnapshot(trackingType, row.set, score)
    });
  }

  db.delete(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .run();

  if (newRecords.length > 0) {
    db.insert(personalRecords).values(newRecords).run();
  }
}

export { computeEstimated1RM };
