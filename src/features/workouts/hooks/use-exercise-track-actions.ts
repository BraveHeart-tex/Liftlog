import { useDrizzle } from '@/src/components/database-provider';
import type { Set } from '@/src/db/schema';
import {
  computeEstimated1RM,
  getPersonalRecordsByExercise,
  maybeRebuildPersonalRecords,
  rebuildPersonalRecordsForExercise
} from '@/src/features/progress/repository';
import {
  createSet,
  deleteSet,
  updateSet
} from '@/src/features/workouts/repository';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import type { SetValues, WorkoutExerciseWithSets } from '../components/types';

type UseExerciseTrackActionsParams = {
  item: WorkoutExerciseWithSets;
  editingSetId: Set['id'] | null;
  setEditingSetId: (setId: Set['id'] | null) => void;
};

export function useExerciseTrackActions({
  item,
  editingSetId,
  setEditingSetId
}: UseExerciseTrackActionsParams) {
  const db = useDrizzle();
  const exerciseId = item.workoutExercise.exerciseId;

  const checkAndCreatePR = useCallback(
    (setId: Set['id'], weightKg: number, reps: number): boolean => {
      if (weightKg <= 0 || reps <= 0) {
        rebuildPersonalRecordsForExercise(db, exerciseId);

        return false;
      }

      const estimated1rm = computeEstimated1RM(weightKg, reps);
      const currentPR = getPersonalRecordsByExercise(db, exerciseId)[0];
      const isNewPR = !currentPR || estimated1rm > currentPR.estimated1rm;

      rebuildPersonalRecordsForExercise(db, exerciseId);

      if (!isNewPR) {
        return false;
      }

      return getPersonalRecordsByExercise(db, exerciseId)[0]?.setId === setId;
    },
    [db, exerciseId]
  );

  const checkAndCreatePRForNewSet = useCallback(
    (setId: Set['id'], weightKg: number, reps: number): boolean => {
      if (weightKg <= 0 || reps <= 0) {
        return false;
      }

      const estimated1rm = computeEstimated1RM(weightKg, reps);

      maybeRebuildPersonalRecords(db, exerciseId, estimated1rm);

      return getPersonalRecordsByExercise(db, exerciseId)[0]?.setId === setId;
    },
    [db, exerciseId]
  );

  const addSet = useCallback(
    ({ weightKg, reps }: SetValues) => {
      const newSet = createSet(db, {
        workoutExerciseId: item.workoutExercise.id,
        weightKg,
        reps,
        order: item.sets.length,
        status: 'completed',
        completedAt: Date.now()
      });

      const isPR = checkAndCreatePRForNewSet(newSet.id, weightKg, reps);

      if (isPR) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [checkAndCreatePRForNewSet, db, item.sets.length, item.workoutExercise.id]
  );

  const updateExistingSet = useCallback(
    ({ setId, weightKg, reps }: SetValues & { setId: Set['id'] }) => {
      updateSet(db, setId, {
        weightKg,
        reps,
        status: 'completed',
        completedAt: Date.now()
      });
      const isPR = checkAndCreatePR(setId, weightKg, reps);

      if (isPR) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setEditingSetId(null);
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
