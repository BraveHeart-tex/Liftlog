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
  type Workout
} from '@/src/db/schema';
import { and, asc, desc, eq, inArray, lt } from 'drizzle-orm';
import {
  computeEstimated1RM,
  getPersonalRecordSnapshot,
  getSetScore,
  resolveTrackingType
} from '@/src/features/progress/tracking';

const MAX_EXERCISE_HISTORY_WORKOUTS = 20;

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

export function getExerciseHistoryWorkoutsQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id']
) {
  return db
    .select({ workout: workouts })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workouts.status, 'completed'),
        eq(workoutExercises.exerciseId, exerciseId)
      )
    )
    .orderBy(desc(workouts.startedAt));
}

export function getRecentExerciseHistoryWorkoutsQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  limit: number,
  beforeStartedAt?: Workout['startedAt']
) {
  return db
    .selectDistinct({ workout: workouts })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workouts.status, 'completed'),
        eq(workoutExercises.exerciseId, exerciseId),
        beforeStartedAt ? lt(workouts.startedAt, beforeStartedAt) : undefined
      )
    )
    .orderBy(desc(workouts.startedAt))
    .limit(limit);
}

export function getRecentExerciseHistoryWorkouts(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  limit: number,
  beforeStartedAt?: Workout['startedAt']
) {
  return getRecentExerciseHistoryWorkoutsQuery(
    db,
    exerciseId,
    limit,
    beforeStartedAt
  ).all();
}

export function getExerciseHistorySetsQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  workoutIds: Workout['id'][]
) {
  if (workoutIds.length === 0) {
    return db
      .select({
        workoutId: workoutExercises.workoutId,
        set: sets
      })
      .from(sets)
      .innerJoin(
        workoutExercises,
        eq(sets.workoutExerciseId, workoutExercises.id)
      )
      .where(eq(workoutExercises.id, ''));
  }

  return db
    .select({
      workoutId: workoutExercises.workoutId,
      set: sets
    })
    .from(sets)
    .innerJoin(
      workoutExercises,
      eq(sets.workoutExerciseId, workoutExercises.id)
    )
    .where(
      and(
        inArray(workoutExercises.workoutId, workoutIds),
        eq(workoutExercises.exerciseId, exerciseId)
      )
    )
    .orderBy(asc(workoutExercises.order), asc(sets.order));
}

export function getExerciseHistorySets(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  workoutIds: Workout['id'][]
) {
  return getExerciseHistorySetsQuery(db, exerciseId, workoutIds).all();
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

    if (workoutHistory.length === MAX_EXERCISE_HISTORY_WORKOUTS) {
      break;
    }
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

  db.transaction(tx => {
    tx.delete(personalRecords)
      .where(eq(personalRecords.exerciseId, exerciseId))
      .run();

    if (newRecords.length > 0) {
      tx.insert(personalRecords).values(newRecords).run();
    }
  });
}

export function maybeRebuildPersonalRecords(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  newSetScore: number
): void {
  const currentBest = db
    .select({ score: personalRecords.score })
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.score))
    .limit(1)
    .get();

  if (currentBest && newSetScore <= currentBest.score) {
    return;
  }

  rebuildPersonalRecordsForExercise(db, exerciseId);
}

export { computeEstimated1RM };
