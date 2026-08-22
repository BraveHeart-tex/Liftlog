import { useDrizzle } from '@/src/providers/database-provider';
import type { Workout } from '@/src/db/schema';
import {
  deleteWorkout,
  saveHistoricalWorkoutEditDraft
} from '@/src/features/workouts/history/history.repository';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
import { triggerHapticSuccess } from '@/src/lib/haptics/haptics';
import { useCallback } from 'react';

export function useHistoricalWorkoutEditActions() {
  const db = useDrizzle();

  const saveDraft = useCallback(
    ({
      sourceWorkoutId,
      draftWorkoutId
    }: {
      sourceWorkoutId: Workout['id'];
      draftWorkoutId: Workout['id'];
    }) => {
      return withDomainFlowSpan(
        { operation: 'workout.save', feature: 'workout' },
        () => {
          const savedDraft = saveHistoricalWorkoutEditDraft(db, {
            sourceWorkoutId,
            draftWorkoutId
          });

          if (!savedDraft) {
            return undefined;
          }

          triggerHapticSuccess('historical workout edit save');

          return savedDraft.workout;
        }
      );
    },
    [db]
  );

  const discardDraft = useCallback(
    (draftWorkoutId: Workout['id']) => deleteWorkout(db, draftWorkoutId),
    [db]
  );

  return {
    saveDraft,
    discardDraft
  };
}
