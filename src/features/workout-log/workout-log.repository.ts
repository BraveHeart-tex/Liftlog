import type { DrizzleDb } from '@/src/db/client';
import {
  sets,
  workoutExercises,
  workouts,
  type Workout
} from '@/src/db/schema';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';

export interface WorkoutCalendarDateRange {
  endAt: number;
  endDateKey: string;
  startAt: number;
  startDateKey: string;
}

export interface CompletedWorkoutLogRow {
  workout: Workout;
  setCount: number;
}

export function getCompletedWorkoutCountRowsQuery(
  db: DrizzleDb,
  dateRange: WorkoutCalendarDateRange
) {
  return db
    .select({
      dateKey: workouts.dateKey,
      workoutCount: count(workouts.id)
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.status, 'completed'),
        gte(workouts.dateKey, dateRange.startDateKey),
        lte(workouts.dateKey, dateRange.endDateKey)
      )
    )
    .groupBy(workouts.dateKey)
    .orderBy(desc(workouts.dateKey));
}

export function getCompletedWorkoutLogRowsForDateKeyQuery(
  db: DrizzleDb,
  dateKey: Workout['dateKey']
) {
  return db
    .select({
      workout: workouts,
      setCount: count(sets.id)
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
    .where(and(eq(workouts.status, 'completed'), eq(workouts.dateKey, dateKey)))
    .groupBy(workouts.id)
    .orderBy(desc(workouts.completedAt), desc(workouts.startedAt));
}
