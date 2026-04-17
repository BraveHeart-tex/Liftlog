import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import {
  personalRecords,
  type PersonalRecord,
  type Set
} from '@/src/db/schema';
import {
  computeEstimated1RM,
  rebuildPersonalRecordsForExercise
} from '@/src/features/progress/repository';
import {
  createSet,
  deleteSet,
  updateSet
} from '@/src/features/workouts/repository';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SetEntryRow } from './set-entry-row';
import { SetForm } from './set-form';
import type { SetValues, WorkoutExerciseWithSets } from './types';

type ExerciseTrackTabProps = {
  db: DrizzleDb;
  item: WorkoutExerciseWithSets;
};

function getPersonalRecordsByExerciseQuery(db: DrizzleDb, exerciseId: string) {
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.achievedAt));
}

function getLatestPersonalRecord(
  db: DrizzleDb,
  exerciseId: string
): PersonalRecord | undefined {
  return getPersonalRecordsByExerciseQuery(db, exerciseId).get();
}

export function ExerciseTrackTab({ db, item }: ExerciseTrackTabProps) {
  const [editingSetId, setEditingSetId] = useState<Set['id'] | null>(null);
  const editingSet = item.sets.find(set => set.id === editingSetId);
  const exerciseId = item.workoutExercise.exerciseId;
  const { data: prRows = [] } = useLiveQuery(
    getPersonalRecordsByExerciseQuery(db, exerciseId),
    [db, exerciseId]
  );
  const prSetIds = useMemo(
    () => new Set(prRows.map(personalRecord => personalRecord.setId)),
    [prRows]
  );

  const handleAddSet = ({ weightKg, reps }: SetValues) => {
    const newSet = createSet(db, {
      workoutExerciseId: item.workoutExercise.id,
      weightKg,
      reps,
      order: item.sets.length,
      status: 'completed',
      completedAt: Date.now()
    });

    const isPR = checkAndCreatePR(newSet.id, weightKg, reps);

    if (isPR) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleUpdateSet = ({
    setId,
    weightKg,
    reps
  }: SetValues & { setId: Set['id'] }) => {
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
  };

  const handleDeleteSet = (setId: Set['id']) => {
    deleteSet(db, setId);
    rebuildPersonalRecordsForExercise(db, exerciseId);

    if (setId === editingSetId) {
      setEditingSetId(null);
    }
  };

  function checkAndCreatePR(
    setId: Set['id'],
    weightKg: number,
    reps: number
  ): boolean {
    if (weightKg <= 0 || reps <= 0) {
      rebuildPersonalRecordsForExercise(db, exerciseId);

      return false;
    }

    const estimated1rm = computeEstimated1RM(weightKg, reps);
    const currentPR = getLatestPersonalRecord(db, exerciseId);
    const isNewPR = !currentPR || estimated1rm > currentPR.estimated1rm;

    rebuildPersonalRecordsForExercise(db, exerciseId);

    if (!isNewPR) {
      return false;
    }

    return getLatestPersonalRecord(db, exerciseId)?.setId === setId;
  }

  return (
    <StyledScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <SetForm
        editingSet={editingSet}
        onAddSet={handleAddSet}
        onUpdateSet={handleUpdateSet}
        onClear={() => setEditingSetId(null)}
        onDeleteSet={handleDeleteSet}
      />

      <View className="mt-4">
        <Text variant="caption" tone="muted">
          Sets
        </Text>

        {item.sets.length > 0 ? (
          <View className="mt-2">
            {item.sets.map((set, index) => (
              <SetEntryRow
                key={set.id}
                set={set}
                setNumber={index + 1}
                isPR={prSetIds.has(set.id)}
                isEditing={set.id === editingSetId}
                onEdit={() =>
                  setEditingSetId(prev => (prev === set.id ? null : set.id))
                }
                onDeleteSet={() => handleDeleteSet(set.id)}
              />
            ))}
          </View>
        ) : (
          <Text variant="small" tone="muted" className="mt-2">
            No sets logged yet.
          </Text>
        )}
      </View>
    </StyledScrollView>
  );
}
