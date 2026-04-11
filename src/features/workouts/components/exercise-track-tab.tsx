import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import type { Set } from '@/src/db/schema';
import {
  createSet,
  deleteSet,
  updateSet
} from '@/src/features/workouts/repository';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SetEntryRow } from './set-entry-row';
import { SetForm } from './set-form';
import type { SetValues, WorkoutExerciseWithSets } from './types';

type ExerciseTrackTabProps = {
  db: DrizzleDb;
  item: WorkoutExerciseWithSets;
};

export function ExerciseTrackTab({ db, item }: ExerciseTrackTabProps) {
  const [editingSetId, setEditingSetId] = useState<Set['id'] | null>(null);
  const editingSet = item.sets.find(set => set.id === editingSetId);

  const handleAddSet = ({ weightKg, reps }: SetValues) => {
    createSet(db, {
      workoutExerciseId: item.workoutExercise.id,
      weightKg,
      reps,
      order: item.sets.length,
      status: 'completed',
      completedAt: Date.now()
    });
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
    setEditingSetId(null);
  };

  const handleDeleteSet = (setId: Set['id']) => {
    deleteSet(db, setId);

    if (setId === editingSetId) {
      setEditingSetId(null);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
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
    </ScrollView>
  );
}
