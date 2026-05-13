import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  getRecentExerciseIdsQuery,
  getWorkoutExercisesQuery
} from '@/src/features/workouts/repository';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useEffect, useMemo, useState } from 'react';
import { useIsRestTimerRunning } from './use-is-rest-timer-running';

interface UseActiveWorkoutContentParams {
  activeWorkout: Workout;
  exerciseRows: ExerciseListItem[];
}

export function useActiveWorkoutContent({
  activeWorkout,
  exerciseRows
}: UseActiveWorkoutContentParams) {
  const db = useDrizzle();
  const [now, setNow] = useState(() => Date.now());
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isRestTimerOpen, setIsRestTimerOpen] = useState(false);
  const isRestTimerRunning = useIsRestTimerRunning();
  const workoutExerciseResult = useLiveWithFallback(
    getWorkoutExercisesQuery(db, activeWorkout.id),
    [db, activeWorkout.id]
  );
  const selectedExerciseIds = useMemo(
    () =>
      workoutExerciseResult.data.map(
        workoutExercise => workoutExercise.exerciseId
      ),
    [workoutExerciseResult.data]
  );
  const selectedExerciseIdsKey = selectedExerciseIds.join('|');
  const recentExerciseRowResult = useLiveWithFallback(
    getRecentExerciseIdsQuery(db, selectedExerciseIds),
    [db, selectedExerciseIdsKey]
  );
  const recentExerciseIds = useMemo(() => {
    const seenExerciseIds = new Set<ExerciseListItem['id']>();
    const exerciseIds: ExerciseListItem['id'][] = [];

    for (const row of recentExerciseRowResult.data) {
      if (seenExerciseIds.has(row.exerciseId)) {
        continue;
      }

      seenExerciseIds.add(row.exerciseId);
      exerciseIds.push(row.exerciseId);
    }

    return exerciseIds;
  }, [recentExerciseRowResult.data]);

  const exerciseById = useMemo(
    () =>
      new Map<ExerciseListItem['id'], ExerciseListItem>(
        exerciseRows.map(exercise => [exercise.id, exercise])
      ),
    [exerciseRows]
  );

  useEffect(() => {
    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeWorkout]);

  return {
    now,
    isExercisePickerOpen,
    setIsExercisePickerOpen,
    isRestTimerOpen,
    setIsRestTimerOpen,
    workoutExerciseRows: workoutExerciseResult.data,
    recentExerciseIds,
    isLoadingWorkoutExercises: !workoutExerciseResult.isLive,
    exerciseById,
    isRestTimerRunning
  };
}
