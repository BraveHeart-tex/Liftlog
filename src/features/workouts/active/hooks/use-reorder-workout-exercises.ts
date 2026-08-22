import { useDrizzle } from '@/src/providers/database-provider';
import type { Workout, WorkoutExercise } from '@/src/db/schema';
import {
  saveActiveWorkoutExerciseDraft,
  updateWorkoutExerciseOrderAndSupersets,
  type ActiveWorkoutExerciseDraftBaselineRow,
  type ActiveWorkoutExerciseDraftRow,
  type StagedCustomExercise
} from '@/src/features/workouts/active/active.repository';
import { useCallback } from 'react';

export function useSaveWorkoutExerciseEdits(workoutId: Workout['id']) {
  const db = useDrizzle();

  return useCallback(
    (
      rows: Pick<WorkoutExercise, 'id' | 'supersetId'>[],
      baselineRows: Pick<WorkoutExercise, 'id' | 'order' | 'supersetId'>[]
    ) => {
      updateWorkoutExerciseOrderAndSupersets(db, workoutId, rows, baselineRows);
    },
    [db, workoutId]
  );
}

export function useSaveActiveWorkoutExerciseDraft(workoutId: Workout['id']) {
  const db = useDrizzle();

  return useCallback(
    (
      rows: ActiveWorkoutExerciseDraftRow[],
      baselineRows: ActiveWorkoutExerciseDraftBaselineRow[],
      stagedCustomExercises: StagedCustomExercise[]
    ) => {
      saveActiveWorkoutExerciseDraft(db, {
        workoutId,
        rows,
        baselineRows,
        stagedCustomExercises
      });
    },
    [db, workoutId]
  );
}
