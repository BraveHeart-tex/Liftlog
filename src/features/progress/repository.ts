import type { DrizzleDb } from "@/src/db/client";
import {
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  type Exercise,
  type NewPersonalRecord,
  type PersonalRecord,
  type Set,
  type Workout,
} from "@/src/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

const MAX_EXERCISE_HISTORY_WORKOUTS = 20;

export function getPersonalRecords(db: DrizzleDb): PersonalRecord[] {
  return db
    .select()
    .from(personalRecords)
    .orderBy(desc(personalRecords.achievedAt))
    .all();
}

export function getPersonalRecordsByExercise(
  db: DrizzleDb,
  exerciseId: Exercise["id"],
): PersonalRecord[] {
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.achievedAt))
    .all();
}

export function getLatestPersonalRecord(
  db: DrizzleDb,
  exerciseId: Exercise["id"],
): PersonalRecord | undefined {
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.achievedAt))
    .get();
}

export function createPersonalRecord(
  db: DrizzleDb,
  data: NewPersonalRecord,
): PersonalRecord {
  return db.insert(personalRecords).values(data).returning().get();
}

export function getExerciseHistory(
  db: DrizzleDb,
  exerciseId: Exercise["id"],
): { workout: Workout; sets: Set[] }[] {
  const workoutRows = db
    .select({ workout: workouts })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workouts.status, "completed"),
        eq(workoutExercises.exerciseId, exerciseId),
      ),
    )
    .orderBy(desc(workouts.startedAt))
    .all();

  const seenWorkoutIds = new Set<Workout["id"]>();
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

  const workoutIds = workoutHistory.map((workout) => workout.id);
  const setRows = db
    .select({
      workoutId: workoutExercises.workoutId,
      set: sets,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        inArray(workoutExercises.workoutId, workoutIds),
        eq(workoutExercises.exerciseId, exerciseId),
      ),
    )
    .orderBy(asc(workoutExercises.order), asc(sets.order))
    .all();

  const setsByWorkoutId = new Map<Workout["id"], Set[]>();

  for (const row of setRows) {
    const existingSets = setsByWorkoutId.get(row.workoutId);

    if (existingSets) {
      existingSets.push(row.set);
      continue;
    }

    setsByWorkoutId.set(row.workoutId, [row.set]);
  }

  return workoutHistory.map((workout) => {
    const setsForWorkout = setsByWorkoutId.get(workout.id) ?? [];

    return {
      workout,
      sets: setsForWorkout,
    };
  });
}

export function computeEstimated1RM(weightKg: number, reps: number): number {
  const estimatedOneRepMax = weightKg * (1 + reps / 30);

  return Math.round(estimatedOneRepMax * 100) / 100;
}
