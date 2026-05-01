import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import {
  getWorkoutExercises,
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
    () => getWorkoutExercisesQuery(db, activeWorkout.id),
    () => getWorkoutExercises(db, activeWorkout.id),
    [db, activeWorkout.id]
  );

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
    isLoadingWorkoutExercises: !workoutExerciseResult.isLive,
    exerciseById,
    isRestTimerRunning
  };
}
