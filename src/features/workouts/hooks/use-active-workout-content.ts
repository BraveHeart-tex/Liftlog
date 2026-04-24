import type { Workout } from '@/src/db/schema';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { timerRef } from '@/src/features/workouts/components/rest-timer-sheet';
import {
  getWorkoutExercises,
  getWorkoutExercisesQuery
} from '@/src/features/workouts/repository';
import { useDrizzle } from '@/src/components/database-provider';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useEffect, useMemo, useState } from 'react';

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
  const [timerIndicatorTick, setTimerIndicatorTick] = useState(0);
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimerIndicatorTick(tick => tick + 1);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const isRestTimerRunning =
    timerRef.isRunning &&
    timerRef.endTime !== null &&
    timerRef.endTime > Date.now() &&
    timerIndicatorTick >= 0;

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
