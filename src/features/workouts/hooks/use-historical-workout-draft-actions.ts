import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import {
  deleteWorkout,
  saveHistoricalWorkoutDraft
} from '@/src/features/workouts/workout.repository';
import { useCallback } from 'react';

export function useHistoricalWorkoutDraftActions() {
  const db = useDrizzle();

  const saveDraft = useCallback(
    (workoutId: Workout['id']) => {
      const savedDraft = saveHistoricalWorkoutDraft(db, workoutId);

      if (!savedDraft) {
        return undefined;
      }

      return savedDraft.workout;
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
