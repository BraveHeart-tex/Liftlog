import { useDrizzle } from '@/src/components/database-provider';
import { createWorkout } from '@/src/features/workouts/repository';
import { formatWorkoutName } from '@/src/lib/utils/workout';
import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

const activeWorkoutRoute = '/(tabs)/workout/active' as Href;

export function useStartWorkout() {
  const db = useDrizzle();

  const startWorkout = useCallback(() => {
    createWorkout(db, {
      name: formatWorkoutName(new Date()),
      status: 'in_progress'
    });

    router.push(activeWorkoutRoute);
  }, [db]);

  const resumeWorkout = useCallback(() => {
    router.push(activeWorkoutRoute);
  }, []);

  return {
    startWorkout,
    resumeWorkout
  };
}
