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

      const isPR = checkAndCreatePRForNewSet(newSet.id, values);

      if (!enableFeedback) {
        return newSet;
      }

      if (isPR) {
        notificationAsync(NotificationFeedbackType.Success);
      } else {
        impactAsync(ImpactFeedbackStyle.Light);
      }

      return newSet;
    },
    [
      checkAndCreatePRForNewSet,
      completedAt,
      db,
      enableFeedback,
      item.workoutExercise.id,
      rebuildProgressOnChange
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

      const isPR = checkAndCreatePR(setId, values);

      if (!enableFeedback) {
        setEditingSetId(null);

        return updatedSet;
      }

      if (isPR) {
        notificationAsync(NotificationFeedbackType.Success);
      } else {
        impactAsync(ImpactFeedbackStyle.Light);
      }

      setEditingSetId(null);

      return updatedSet;
    },
    [
      checkAndCreatePR,
      completedAt,
      db,
      enableFeedback,
      rebuildProgressOnChange,
      setEditingSetId
    ]
  );

  const deleteExistingSet = useCallback(
    (setId: Set['id']) => {
      deleteSet(db, setId);

      if (rebuildProgressOnChange) {
        rebuildPersonalRecordsForExercise(db, exerciseId);
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
