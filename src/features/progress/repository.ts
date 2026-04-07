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
  type User,
  type Workout,
} from "@/src/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

const MAX_EXERCISE_HISTORY_WORKOUTS = 20;

export function getPersonalRecords(
  db: DrizzleDb,
  userId: User["id"],
): PersonalRecord[] {
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.userId, userId))
    .orderBy(desc(personalRecords.achievedAt))
    .all();
}

export function getPersonalRecordsByExercise(
  db: DrizzleDb,
  userId: User["id"],
  exerciseId: Exercise["id"],
): PersonalRecord[] {
  return db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, exerciseId),
      ),
    )
    .orderBy(desc(personalRecords.achievedAt))
    .all();
}

export function getLatestPersonalRecord(
  db: DrizzleDb,
  userId: User["id"],
  exerciseId: Exercise["id"],
): PersonalRecord | undefined {
  return db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, exerciseId),
      ),
    )
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
  userId: User["id"],
  exerciseId: Exercise["id"],
): { workout: Workout; sets: Set[] }[] {
  const workoutRows = db
    .select({ workout: workouts })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workouts.userId, userId),
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

  return workoutHistory.map((workout) => {
    const setsForWorkout = db
      .select({ set: sets })
      .from(sets)
      .innerJoin(
        workoutExercises,
        eq(sets.workoutExerciseId, workoutExercises.id),
      )
      .where(
        and(
          eq(workoutExercises.workoutId, workout.id),
          eq(workoutExercises.exerciseId, exerciseId),
        ),
      )
      .orderBy(asc(workoutExercises.order), asc(sets.order))
      .all()
      .map((row) => row.set);

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
