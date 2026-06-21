import { useDrizzle } from '@/src/components/database-provider';
import type { Set } from '@/src/db/schema';
import {
  getPersonalRecordsByExercise,
  maybeRebuildPersonalRecords,
  rebuildPersonalRecordsForExercise
} from '@/src/features/progress/repository';
import {
  getSetScore,
  resolveTrackingType
} from '@/src/features/progress/tracking';
import {
  createSet,
  deleteSet,
  updateSet
} from '@/src/features/workouts/repository';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync
} from 'expo-haptics';
import { scheduleIdleTask } from '@/src/lib/utils/schedule-idle-task';
import { useCallback } from 'react';
import type {
  SetValues,
  WorkoutExerciseWithSets
} from '@/src/features/workouts/components/types';

type AddSetValues = SetValues & { order: Set['order'] };

interface UseExerciseTrackActionsParams {
  item: WorkoutExerciseWithSets;
  editingSetId: Set['id'] | null;
  setEditingSetId: (setId: Set['id'] | null) => void;
  completedAt?: number;
  enableFeedback?: boolean;
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
  rebuildProgressOnChange = true
}: UseExerciseTrackActionsParams) {
  const db = useDrizzle();
  const exerciseId = item.workoutExercise.exerciseId;
  const trackingType = resolveTrackingType(item.exercise?.trackingType);

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

  const checkAndCreatePR = useCallback(
    (setId: Set['id'], values: SetValues): boolean => {
      const score = getSetScore(trackingType, {
        weightKg: values.weightKg ?? null,
        reps: values.reps ?? null,
        distanceMeters: values.distanceMeters ?? null,
        durationMs: values.durationMs ?? null,
        durationSeconds: null
      });

      if (score === null) {
        rebuildPersonalRecordsForExercise(db, exerciseId);

        return false;
      }

      const currentPR = getPersonalRecordsByExercise(db, exerciseId)[0];
      const isNewPR = !currentPR || score > currentPR.score;

      rebuildPersonalRecordsForExercise(db, exerciseId);

      if (!isNewPR) {
        return false;
      }

      return getPersonalRecordsByExercise(db, exerciseId)[0]?.setId === setId;
    },
    [db, exerciseId, trackingType]
  );

  const checkAndCreatePRForNewSet = useCallback(
    (setId: Set['id'], values: SetValues): boolean => {
      const score = getSetScore(trackingType, {
        weightKg: values.weightKg ?? null,
        reps: values.reps ?? null,
        distanceMeters: values.distanceMeters ?? null,
        durationMs: values.durationMs ?? null,
        durationSeconds: null
      });

      if (score === null) {
        return false;
      }

      maybeRebuildPersonalRecords(db, exerciseId, score);

      return getPersonalRecordsByExercise(db, exerciseId)[0]?.setId === setId;
    },
    [db, exerciseId, trackingType]
  );

  const addSet = useCallback(
    ({ order, ...values }: AddSetValues) => {
      const newSet = createSet(db, {
        workoutExerciseId: item.workoutExercise.id,
        ...getSetStorageValues(values),
        order,
        status: 'completed',
        completedAt: completedAt ?? Date.now()
      });

      if (!rebuildProgressOnChange) {
        return newSet;
      }

      scheduleIdleTask(() => {
        try {
          const isPR = checkAndCreatePRForNewSet(newSet.id, values);

          triggerFeedback(isPR);
        } catch (error) {
          console.error('Failed to update personal records for new set', error);
        }
      });

      return newSet;
    },
    [
      checkAndCreatePRForNewSet,
      completedAt,
      db,
      item.workoutExercise.id,
      rebuildProgressOnChange,
      triggerFeedback
    ]
  );

  const updateExistingSet = useCallback(
    ({ setId, ...values }: SetValues & { setId: Set['id'] }) => {
      const updatedSet = updateSet(db, setId, {
        ...getSetStorageValues(values),
        status: 'completed',
        completedAt: completedAt ?? Date.now()
      });

      if (!rebuildProgressOnChange) {
        setEditingSetId(null);

        return updatedSet;
      }

      scheduleIdleTask(() => {
        try {
          const isPR = checkAndCreatePR(setId, values);

          triggerFeedback(isPR);
        } catch (error) {
          console.error('Failed to update personal records for set', error);
        }
      });
      setEditingSetId(null);

      return updatedSet;
    },
    [
      checkAndCreatePR,
      completedAt,
      db,
      rebuildProgressOnChange,
      setEditingSetId,
      triggerFeedback
    ]
  );

  const deleteExistingSet = useCallback(
    (setId: Set['id']) => {
      deleteSet(db, setId);

      if (rebuildProgressOnChange) {
        scheduleIdleTask(() => {
          try {
            rebuildPersonalRecordsForExercise(db, exerciseId);
          } catch (error) {
            console.error(
              'Failed to update personal records after deleting set',
              error
            );
          }
        });
      }

      if (setId === editingSetId) {
        setEditingSetId(null);
      }
    },
    [db, editingSetId, exerciseId, rebuildProgressOnChange, setEditingSetId]
  );

  return {
    addSet,
    updateSet: updateExistingSet,
    deleteSet: deleteExistingSet
  };
}
