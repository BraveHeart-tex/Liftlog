import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import {
  deleteWorkout,
  saveHistoricalWorkoutEditDraft
} from '@/src/features/workouts/workout.repository';
import { withDomainFlowSpan } from '@/src/lib/observability/observability-span';
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
