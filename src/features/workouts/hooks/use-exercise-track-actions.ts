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
import * as Haptics from 'expo-haptics';
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
}

export function useExerciseTrackActions({
  item,
  editingSetId,
  setEditingSetId
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
        durationSeconds: values.durationSeconds ?? null
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
        durationSeconds: values.durationSeconds ?? null
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
        ...values,
        order,
        status: 'completed',
        completedAt: Date.now()
      });

      const isPR = checkAndCreatePRForNewSet(newSet.id, values);

      if (isPR) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return newSet;
    },
    [checkAndCreatePRForNewSet, db, item.workoutExercise.id]
  );

  const updateExistingSet = useCallback(
    ({ setId, ...values }: SetValues & { setId: Set['id'] }) => {
      const updatedSet = updateSet(db, setId, {
        weightKg: null,
        reps: null,
        distanceMeters: null,
        durationSeconds: null,
        ...values,
        status: 'completed',
        completedAt: Date.now()
      });
      const isPR = checkAndCreatePR(setId, values);

      if (isPR) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setEditingSetId(null);

      return updatedSet;
    },
    [checkAndCreatePR, db, setEditingSetId]
  );

  const deleteExistingSet = useCallback(
    (setId: Set['id']) => {
      deleteSet(db, setId);
      rebuildPersonalRecordsForExercise(db, exerciseId);

      if (setId === editingSetId) {
        setEditingSetId(null);
      }
    },
    [db, editingSetId, exerciseId, setEditingSetId]
  );

  return {
    addSet,
    updateSet: updateExistingSet,
    deleteSet: deleteExistingSet
  };
}
