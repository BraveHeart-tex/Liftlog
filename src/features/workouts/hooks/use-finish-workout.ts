import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db';
import { completeWorkout } from '@/src/features/workouts/repository';
import { NotificationFeedbackType, notificationAsync } from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback } from 'react';

export const useFinishWorkout = () => {
  const db = useDrizzle();

  const finishWorkout = useCallback(
    (activeWorkoutId: Workout['id']) => {
      completeWorkout(db, activeWorkoutId);
      notificationAsync(NotificationFeedbackType.Success);
      router.replace('/(tabs)/workout');
    },
    [db]
  );

  return finishWorkout;
};
