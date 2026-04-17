import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import { personalRecords, type Set } from '@/src/db/schema';
import {
  computeEstimated1RM,
  createPersonalRecord,
  getLatestPersonalRecord
} from '@/src/features/progress/repository';
import {
  createSet,
  deleteSet,
  updateSet
} from '@/src/features/workouts/repository';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
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

  function checkAndCreatePR(setId: Set['id'], weightKg: number, reps: number) {
    if (weightKg <= 0 || reps <= 0) {
      return;
    }

    const estimated1rm = computeEstimated1RM(weightKg, reps);
    const currentPR = getLatestPersonalRecord(db, exerciseId);
    const isNewPR = !currentPR || estimated1rm > currentPR.estimated1rm;

    if (!isNewPR) {
      return;
    }

    createPersonalRecord(db, {
      exerciseId,
      setId,
      weightKg,
      reps,
      estimated1rm,
      achievedAt: Date.now()
    });
  }

  const handleAddSet = ({ weightKg, reps }: SetValues) => {
    const newSet = createSet(db, {
      workoutExerciseId: item.workoutExercise.id,
      weightKg,
      reps,
      order: item.sets.length,
      status: 'completed',
      completedAt: Date.now()
    });

    checkAndCreatePR(newSet.id, weightKg, reps);
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
    checkAndCreatePR(setId, weightKg, reps);
    setEditingSetId(null);
  };

  const handleDeleteSet = (setId: Set['id']) => {
    deleteSet(db, setId);

    if (setId === editingSetId) {
      setEditingSetId(null);
    }
  };

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
