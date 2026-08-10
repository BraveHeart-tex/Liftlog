import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db';
import { completeWorkout } from '@/src/features/workouts/workout.repository';
import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer.store';
import { triggerHapticSuccess } from '@/src/lib/haptics/haptics';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
import { router } from 'expo-router';
import { useCallback } from 'react';

export const useFinishWorkout = () => {
  const db = useDrizzle();

  const finishWorkout = useCallback(
    (activeWorkoutId: Workout['id']) => {
      withDomainFlowSpan(
        { operation: 'workout.finish', feature: 'workout' },
        () => {
          completeWorkout(db, activeWorkoutId);
          useRestTimerStore.getState().cancelForWorkout(activeWorkoutId);
          triggerHapticSuccess('workout completion');
          router.replace('/(tabs)/workout');
        }
      );
    },
    [db]
  );

  return finishWorkout;
};
