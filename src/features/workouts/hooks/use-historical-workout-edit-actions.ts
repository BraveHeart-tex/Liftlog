import { useDrizzle } from '@/src/components/database-provider';
import type { Workout } from '@/src/db/schema';
import { rebuildPersonalRecordsForExercise } from '@/src/features/progress/progress.repository';
import {
  deleteWorkout,
  saveHistoricalWorkoutEditDraft
} from '@/src/features/workouts/workout.repository';
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
      const savedDraft = saveHistoricalWorkoutEditDraft(db, {
        sourceWorkoutId,
        draftWorkoutId
      });

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
    (draftWorkoutId: Workout['id']) => deleteWorkout(db, draftWorkoutId),
    [db]
  );

  return {
    saveDraft,
    discardDraft
  };
}
