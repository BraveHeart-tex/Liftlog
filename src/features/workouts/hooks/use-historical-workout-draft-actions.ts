import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import {
  deleteWorkout,
  saveHistoricalWorkoutDraft
} from '@/src/features/workouts/workout.repository';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
import { triggerHapticSuccess } from '@/src/lib/haptics/haptics';
import { useCallback } from 'react';

export function useHistoricalWorkoutDraftActions() {
  const db = useDrizzle();

  const saveDraft = useCallback(
    (workoutId: Workout['id']) => {
      return withDomainFlowSpan(
        { operation: 'workout.save', feature: 'workout' },
        () => {
          const savedDraft = saveHistoricalWorkoutDraft(db, workoutId);

          if (!savedDraft) {
            return undefined;
          }

          triggerHapticSuccess('historical workout save');

          return savedDraft.workout;
        }
      );
    },
    [db]
  );

  const discardDraft = useCallback(
    (workoutId: Workout['id']) => deleteWorkout(db, workoutId),
    [db]
  );

  return {
    saveDraft,
    discardDraft
  };
}
