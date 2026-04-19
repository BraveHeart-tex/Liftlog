import { useDrizzle } from '@/src/components/database-provider';
import type { Set, Workout, WorkoutExercise } from '@/src/db/schema';
import {
  getSetsForWorkoutExercises,
  getSetsForWorkoutExercisesQuery,
  getWorkoutExercisesForWorkouts,
  getWorkoutExercisesForWorkoutsQuery,
  getWorkouts,
  getWorkoutsQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useMemo } from 'react';

export function useHistoryList() {
  const db = useDrizzle();
  const workoutResult = useLiveWithFallback(
    () => getWorkoutsQuery(db),
    () => getWorkouts(db),
    [db]
  );
  const workoutRows = workoutResult.data;

  const workoutIds = useMemo(
    () => workoutRows.map(workout => workout.id),
    [workoutRows]
  );
  const workoutIdKey = useMemo(() => workoutIds.join(','), [workoutIds]);
  const workoutExerciseResult = useLiveWithFallback(
    () => getWorkoutExercisesForWorkoutsQuery(db, workoutIds),
    () => getWorkoutExercisesForWorkouts(db, workoutIds),
    [db, workoutIdKey]
  );
  const workoutExerciseRows = workoutExerciseResult.data;

  const workoutExerciseIds = useMemo(
    () => workoutExerciseRows.map(workoutExercise => workoutExercise.id),
    [workoutExerciseRows]
  );
  const workoutExerciseIdKey = useMemo(
    () => workoutExerciseIds.join(','),
    [workoutExerciseIds]
  );
  const setResult = useLiveWithFallback(
    () => getSetsForWorkoutExercisesQuery(db, workoutExerciseIds),
    () => getSetsForWorkoutExercises(db, workoutExerciseIds),
    [db, workoutExerciseIdKey]
  );

  const setCountByWorkoutId = useMemo(() => {
    const workoutIdByExerciseId = new Map<
      WorkoutExercise['id'],
      Workout['id']
    >();

    for (const workoutExercise of workoutExerciseRows) {
      workoutIdByExerciseId.set(workoutExercise.id, workoutExercise.workoutId);
    }

    const nextSetCountByWorkoutId = new Map<Workout['id'], number>();

    for (const set of setResult.data as Set[]) {
      if (set.status !== 'completed') {
        continue;
      }

      const workoutId = workoutIdByExerciseId.get(set.workoutExerciseId);

      if (!workoutId) {
        continue;
      }

      nextSetCountByWorkoutId.set(
        workoutId,
        (nextSetCountByWorkoutId.get(workoutId) ?? 0) + 1
      );
    }

    return nextSetCountByWorkoutId;
  }, [setResult.data, workoutExerciseRows]);

  return {
    workoutRows,
    setCountByWorkoutId,
    isLoading: !workoutResult.isLive
  };
}
