import { useDrizzle } from '@/src/providers/database-provider';
import type { Set } from '@/src/db/schema';
import {
  createCompletedSet,
  deleteCompletedSet,
  updateCompletedSet
} from '@/src/features/workouts/set-entry/set-entry.repository';
import {
  triggerHapticLight,
  triggerHapticSuccess,
  triggerHapticWarning
} from '@/src/lib/haptics/haptics';
import { useCallback } from 'react';
import type {
  SetValues,
  WorkoutExerciseWithSets
} from '@/src/features/workouts/shared/workout-components.types';

type AddSetValues = SetValues & { order: Set['order'] };

interface UseExerciseTrackActionsParams {
  item: WorkoutExerciseWithSets;
  editingSetId: Set['id'] | null;
  setEditingSetId: (setId: Set['id'] | null) => void;
  completedAt?: number;
  enableFeedback?: boolean;
  preserveExistingSetCompletedAt?: boolean;
  rebuildProgressOnChange?: boolean;
}

function getSetStorageValues(values: SetValues) {
  const durationSeconds =
    values.durationMs === undefined
      ? null
      : Math.round(values.durationMs / 1000);

  return {
    weightKg: values.weightKg ?? null,
    reps: values.reps ?? null,
    distanceMeters: values.distanceMeters ?? null,
    durationMs: values.durationMs ?? null,
    durationSeconds
  };
}

export function useExerciseTrackActions({
  item,
  editingSetId,
  setEditingSetId,
  completedAt,
  enableFeedback = true,
  preserveExistingSetCompletedAt = false,
  rebuildProgressOnChange = true
}: UseExerciseTrackActionsParams) {
  const db = useDrizzle();

  const triggerFeedback = useCallback(
    (isPR: boolean) => {
      if (!enableFeedback) {
        return;
      }

      if (isPR) {
        triggerHapticSuccess('personal record');
      } else {
        triggerHapticLight('set completion');
      }
    },
    [enableFeedback]
  );

  const addSet = useCallback(
    ({ order, ...values }: AddSetValues) => {
      const result = createCompletedSet(
        db,
        {
          workoutExerciseId: item.workoutExercise.id,
          ...getSetStorageValues(values),
          order,
          completedAt: completedAt ?? Date.now()
        },
        { maintainPersonalRecords: rebuildProgressOnChange }
      );

      if (rebuildProgressOnChange) {
        triggerFeedback(result.isNewPersonalRecord);
      }

      return result.set;
    },
    [
      completedAt,
      db,
      item.workoutExercise.id,
      rebuildProgressOnChange,
      triggerFeedback
    ]
  );

  const updateExistingSet = useCallback(
    ({ setId, ...values }: SetValues & { setId: Set['id'] }) => {
      const existingSet = item.sets.find(set => set.id === setId);
      const nextCompletedAt =
        preserveExistingSetCompletedAt && existingSet?.completedAt != null
          ? existingSet.completedAt
          : (completedAt ?? Date.now());
      const result = updateCompletedSet(
        db,
        setId,
        {
          ...getSetStorageValues(values),
          completedAt: nextCompletedAt
        },
        { maintainPersonalRecords: rebuildProgressOnChange }
      );

      if (rebuildProgressOnChange && result?.isNewPersonalRecord) {
        triggerFeedback(true);
      }

      setEditingSetId(null);

      return result?.set;
    },
    [
      completedAt,
      db,
      item.sets,
      preserveExistingSetCompletedAt,
      rebuildProgressOnChange,
      setEditingSetId,
      triggerFeedback
    ]
  );

  const deleteExistingSet = useCallback(
    (setId: Set['id']) => {
      const deletedSet = deleteCompletedSet(db, setId, {
        maintainPersonalRecords: rebuildProgressOnChange
      });

      if (deletedSet) {
        triggerHapticWarning('set deletion');
      }

      if (setId === editingSetId) {
        setEditingSetId(null);
      }

      return deletedSet;
    },
    [db, editingSetId, rebuildProgressOnChange, setEditingSetId]
  );

  return {
    addSet,
    updateSet: updateExistingSet,
    deleteSet: deleteExistingSet
  };
}
