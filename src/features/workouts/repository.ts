import type { DrizzleDb } from "@/src/db/client";
import {
  sets,
  workoutExercises,
  workouts,
  type NewSet,
  type NewWorkout,
  type NewWorkoutExercise,
  type Set,
  type User,
  type Workout,
  type WorkoutExercise,
} from "@/src/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

function getWorkoutRecordById(
  db: DrizzleDb,
  id: Workout["id"],
): Workout | undefined {
  return db.select().from(workouts).where(eq(workouts.id, id)).get();
}

function getWorkoutExerciseRecordById(
  db: DrizzleDb,
  id: WorkoutExercise["id"],
): WorkoutExercise | undefined {
  return db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.id, id))
    .get();
}

function getSetRecordById(db: DrizzleDb, id: Set["id"]): Set | undefined {
  return db.select().from(sets).where(eq(sets.id, id)).get();
}

export function getWorkouts(db: DrizzleDb, userId: User["id"]): Workout[] {
  return db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, "completed")))
    .orderBy(desc(workouts.startedAt))
    .all();
}

export function getActiveWorkout(
  db: DrizzleDb,
  userId: User["id"],
): Workout | undefined {
  return db
    .select()
    .from(workouts)
    .where(
      and(eq(workouts.userId, userId), eq(workouts.status, "in_progress")),
    )
    .orderBy(desc(workouts.startedAt))
    .get();
}

export function getWorkoutById(
  db: DrizzleDb,
  id: Workout["id"],
): Workout | undefined {
  return getWorkoutRecordById(db, id);
}

export function getWorkoutWithExercises(
  db: DrizzleDb,
  id: Workout["id"],
): { workout: Workout; exercises: WorkoutExercise[] } | undefined {
  const workout = getWorkoutRecordById(db, id);

  if (!workout) {
    return undefined;
  }

  const exercisesForWorkout = db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, id))
    .orderBy(asc(workoutExercises.order))
    .all();

  return { workout, exercises: exercisesForWorkout };
}

export function getWorkoutExerciseWithSets(
  db: DrizzleDb,
  workoutExerciseId: WorkoutExercise["id"],
): { workoutExercise: WorkoutExercise; sets: Set[] } | undefined {
  const workoutExercise = getWorkoutExerciseRecordById(db, workoutExerciseId);

  if (!workoutExercise) {
    return undefined;
  }

  const setsForExercise = db
    .select()
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId))
    .orderBy(asc(sets.order))
    .all();

  return { workoutExercise, sets: setsForExercise };
}

export function createWorkout(db: DrizzleDb, data: NewWorkout): Workout {
  return db.insert(workouts).values(data).returning().get();
}

export function updateWorkout(
  db: DrizzleDb,
  id: Workout["id"],
  data: Partial<NewWorkout>,
): Workout | undefined {
  if (Object.keys(data).length === 0) {
    return getWorkoutRecordById(db, id);
  }

  return db
    .update(workouts)
    .set(data)
    .where(eq(workouts.id, id))
    .returning()
    .get();
}

export function completeWorkout(db: DrizzleDb, id: Workout["id"]): void {
  db
    .update(workouts)
    .set({
      status: "completed",
      completedAt: Date.now(),
    })
    .where(eq(workouts.id, id))
    .run();
}

export function cancelWorkout(db: DrizzleDb, id: Workout["id"]): void {
  db
    .update(workouts)
    .set({
      status: "cancelled",
      completedAt: Date.now(),
    })
    .where(eq(workouts.id, id))
    .run();
}

export function createWorkoutExercise(
  db: DrizzleDb,
  data: NewWorkoutExercise,
): WorkoutExercise {
  return db.insert(workoutExercises).values(data).returning().get();
}

export function deleteWorkoutExercise(
  db: DrizzleDb,
  id: WorkoutExercise["id"],
): void {
  db.delete(workoutExercises).where(eq(workoutExercises.id, id)).run();
}

export function createSet(db: DrizzleDb, data: NewSet): Set {
  return db.insert(sets).values(data).returning().get();
}

export function updateSet(
  db: DrizzleDb,
  id: Set["id"],
  data: Partial<NewSet>,
): Set | undefined {
  if (Object.keys(data).length === 0) {
    return getSetRecordById(db, id);
  }

  return db
    .update(sets)
    .set(data)
    .where(eq(sets.id, id))
    .returning()
    .get();
}

export function deleteSet(db: DrizzleDb, id: Set["id"]): void {
  db.delete(sets).where(eq(sets.id, id)).run();
}

export function completeSet(db: DrizzleDb, id: Set["id"]): void {
  db
    .update(sets)
    .set({
      status: "completed",
      completedAt: Date.now(),
    })
    .where(eq(sets.id, id))
    .run();
}
