import type { DrizzleDb } from '@/src/db/client';
import {
  sets,
  workoutExercises,
  workouts,
  type NewSet,
  type NewWorkout,
  type NewWorkoutExercise,
  type Set,
  type Workout,
  type WorkoutExercise
} from '@/src/db/schema';
import { asc, desc, eq, inArray } from 'drizzle-orm';

function getWorkoutRecordById(
  db: DrizzleDb,
  id: Workout['id']
): Workout | undefined {
  return db.select().from(workouts).where(eq(workouts.id, id)).get();
}

function getSetRecordById(db: DrizzleDb, id: Set['id']): Set | undefined {
  return db.select().from(sets).where(eq(sets.id, id)).get();
}

export function getWorkoutsQuery(db: DrizzleDb) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'completed'))
    .orderBy(desc(workouts.startedAt));
}

export function getWorkouts(db: DrizzleDb): Workout[] {
  return getWorkoutsQuery(db).all();
}

export function getActiveWorkoutQuery(db: DrizzleDb) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'in_progress'))
    .orderBy(desc(workouts.startedAt));
}

export function getActiveWorkout(db: DrizzleDb): Workout | undefined {
  return getActiveWorkoutQuery(db).get();
}

export function getWorkoutByIdQuery(db: DrizzleDb, id: Workout['id']) {
  return db.select().from(workouts).where(eq(workouts.id, id));
}

export function getWorkoutById(
  db: DrizzleDb,
  id: Workout['id']
): Workout | undefined {
  return getWorkoutRecordById(db, id);
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

export function getWorkoutExercises(
  db: DrizzleDb,
  workoutId: Workout['id']
): WorkoutExercise[] {
  return getWorkoutExercisesQuery(db, workoutId).all();
}

export function getWorkoutExercisesForWorkoutsQuery(
  db: DrizzleDb,
  workoutIds: Workout['id'][]
) {
  if (workoutIds.length === 0) {
    return getWorkoutExercisesQuery(db, '');
  }

  return db
    .select()
    .from(workoutExercises)
    .where(inArray(workoutExercises.workoutId, workoutIds))
    .orderBy(asc(workoutExercises.order));
}

export function getWorkoutExercisesForWorkouts(
  db: DrizzleDb,
  workoutIds: Workout['id'][]
): WorkoutExercise[] {
  return getWorkoutExercisesForWorkoutsQuery(db, workoutIds).all();
}

export function getWorkoutExerciseByIdQuery(
  db: DrizzleDb,
  id: WorkoutExercise['id']
) {
  return db.select().from(workoutExercises).where(eq(workoutExercises.id, id));
}

export function getWorkoutExerciseById(
  db: DrizzleDb,
  id: WorkoutExercise['id']
): WorkoutExercise | undefined {
  return getWorkoutExerciseByIdQuery(db, id).get();
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

export function getSetsByWorkoutExerciseId(
  db: DrizzleDb,
  workoutExerciseId: WorkoutExercise['id']
): Set[] {
  return getSetsByWorkoutExerciseIdQuery(db, workoutExerciseId).all();
}

export function getSetsForWorkoutExercisesQuery(
  db: DrizzleDb,
  workoutExerciseIds: WorkoutExercise['id'][]
) {
  if (workoutExerciseIds.length === 0) {
    return db
      .select()
      .from(sets)
      .where(eq(sets.workoutExerciseId, ''))
      .orderBy(asc(sets.order));
  }

  return db
    .select()
    .from(sets)
    .where(inArray(sets.workoutExerciseId, workoutExerciseIds))
    .orderBy(asc(sets.order));
}

export function getSetsForWorkoutExercises(
  db: DrizzleDb,
  workoutExerciseIds: WorkoutExercise['id'][]
): Set[] {
  return getSetsForWorkoutExercisesQuery(db, workoutExerciseIds).all();
}

export function createWorkout(db: DrizzleDb, data: NewWorkout): Workout {
  return db.insert(workouts).values(data).returning().get();
}

export function completeWorkout(db: DrizzleDb, id: Workout['id']): void {
  db.update(workouts)
    .set({
      status: 'completed',
      completedAt: Date.now()
    })
    .where(eq(workouts.id, id))
    .run();
}

export function createWorkoutExercise(
  db: DrizzleDb,
  data: NewWorkoutExercise
): WorkoutExercise {
  return db.insert(workoutExercises).values(data).returning().get();
}

export function deleteWorkoutExercise(
  db: DrizzleDb,
  id: WorkoutExercise['id']
): void {
  db.delete(workoutExercises).where(eq(workoutExercises.id, id)).run();
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
