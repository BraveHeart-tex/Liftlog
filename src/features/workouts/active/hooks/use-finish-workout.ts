import { useDrizzle } from '@/src/providers/database-provider';
import { showSnackbar } from '@/src/components/ui/snackbar';
import type { Workout } from '@/src/db';
import { completeWorkout } from '@/src/features/workouts/active/active.repository';
import { useRestTimerStore } from '@/src/features/rest-timer/rest-timer.store';
import { triggerHapticSuccess } from '@/src/lib/haptics/haptics';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
import { router } from 'expo-router';
import { useCallback } from 'react';

export const useFinishWorkout = () => {
  const db = useDrizzle();

  const finishWorkout = useCallback(
    (activeWorkoutId: Workout['id']) => {
      try {
        withDomainFlowSpan(
          { operation: 'workout.finish', feature: 'workout' },
          () => {
            completeWorkout(db, activeWorkoutId);
            useRestTimerStore.getState().cancelForWorkout(activeWorkoutId);
            triggerHapticSuccess('workout completion');
            router.replace('/(tabs)/workout');
          }
        );
      } catch (error) {
        console.error('Failed to finish workout', error);
        showSnackbar({
          message: 'Could not finish workout. Your workout is still open.',
          actionLabel: 'Retry',
          onAction: () => finishWorkout(activeWorkoutId),
          variant: 'danger'
        });
      }
    },
    [db]
  );

  return finishWorkout;
};
