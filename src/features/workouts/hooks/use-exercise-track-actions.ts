import { useDrizzle } from '@/src/components/database-provider';
import type { Set } from '@/src/db/schema';
import {
  createCompletedSet,
  deleteCompletedSet,
  updateCompletedSet
} from '@/src/features/workouts/workout.repository';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync
} from 'expo-haptics';
import { useCallback } from 'react';
import type {
  SetValues,
  WorkoutExerciseWithSets
} from '@/src/features/workouts/components/workout-components.types';

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
        void notificationAsync(NotificationFeedbackType.Success);
      } else {
        void impactAsync(ImpactFeedbackStyle.Light);
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

      if (rebuildProgressOnChange && result) {
        triggerFeedback(result.isNewPersonalRecord);
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
      deleteCompletedSet(db, setId, {
        maintainPersonalRecords: rebuildProgressOnChange
      });

      if (setId === editingSetId) {
        setEditingSetId(null);
      }
    },
    [db, editingSetId, rebuildProgressOnChange, setEditingSetId]
  );

  return {
    addSet,
    updateSet: updateExistingSet,
    deleteSet: deleteExistingSet
  };
}
