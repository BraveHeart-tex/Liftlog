import type { DrizzleDb } from '@/src/db/client';
import {
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
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

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
  const sortedRows = [...completedSetRows].sort((left, right) => {
    const achievedAtDiff = getSetAchievedAt(left) - getSetAchievedAt(right);

    if (achievedAtDiff !== 0) {
      return achievedAtDiff;
    }

    return left.set.order - right.set.order;
  });
  let bestEstimated1RM = 0;
  const newRecords: NewPersonalRecord[] = [];

  for (const row of sortedRows) {
    const estimated1rm = computeEstimated1RM(row.set.weightKg, row.set.reps);

    if (estimated1rm <= bestEstimated1RM) {
      continue;
    }

    bestEstimated1RM = estimated1rm;
    newRecords.push({
      exerciseId,
      setId: row.set.id,
      weightKg: row.set.weightKg,
      reps: row.set.reps,
      estimated1rm,
      achievedAt: getSetAchievedAt(row)
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
  newSetEstimated1rm: number
): void {
  const currentBest = db
    .select({ estimated1rm: personalRecords.estimated1rm })
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.estimated1rm))
    .limit(1)
    .get();

  if (currentBest && newSetEstimated1rm <= currentBest.estimated1rm) {
    return;
  }

  rebuildPersonalRecordsForExercise(db, exerciseId);
}

export function computeEstimated1RM(weightKg: number, reps: number): number {
  const estimatedOneRepMax = weightKg * (1 + reps / 30);

  return Math.round(estimatedOneRepMax * 100) / 100;
}
