import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Text } from '@/src/components/ui/text';
import {
  useExerciseTrackActions,
  useExerciseTrackTab
} from '@/src/features/workouts/hooks';
import { View } from 'react-native';
import { SetEntryRow } from './set-entry-row';
import { SetForm } from './set-form';
import type { WorkoutExerciseWithSets } from './types';

type ExerciseTrackTabProps = {
  item: WorkoutExerciseWithSets;
};

export function ExerciseTrackTab({ item }: ExerciseTrackTabProps) {
  const { editingSetId, editingSet, setEditingSetId, prSetIds } =
    useExerciseTrackTab(item);
  const {
    addSet: handleAddSet,
    updateSet: handleUpdateSet,
    deleteSet: handleDeleteSet
  } = useExerciseTrackActions({ item, editingSetId, setEditingSetId });

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
