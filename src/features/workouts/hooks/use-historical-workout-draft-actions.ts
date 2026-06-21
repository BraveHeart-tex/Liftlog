import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import { rebuildPersonalRecordsForExercise } from '@/src/features/progress/repository';
import {
  deleteWorkout,
  saveHistoricalWorkoutDraft
} from '@/src/features/workouts/repository';
import { useCallback } from 'react';

export function useHistoricalWorkoutDraftActions() {
  const db = useDrizzle();

  const saveDraft = useCallback(
    (workoutId: Workout['id']) => {
      const savedDraft = saveHistoricalWorkoutDraft(db, workoutId);

      if (!savedDraft) {
        return undefined;
      }

      for (const exerciseId of savedDraft.affectedExerciseIds) {
        rebuildPersonalRecordsForExercise(db, exerciseId);
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
