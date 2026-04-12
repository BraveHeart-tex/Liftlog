import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import type { Set } from '@/src/db/schema';
import {
  createSet,
  deleteSet,
  updateSet
} from '@/src/features/workouts/repository';
import { formatTime } from '@/src/lib/utils/format-time';
import { TimerIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { timerRef } from './rest-timer-sheet';
import { SetEntryRow } from './set-entry-row';
import { SetForm } from './set-form';
import type { SetValues, WorkoutExerciseWithSets } from './types';

type ExerciseTrackTabProps = {
  db: DrizzleDb;
  item: WorkoutExerciseWithSets;
  onOpenRestTimer: () => void;
};

export function ExerciseTrackTab({
  db,
  item,
  onOpenRestTimer
}: ExerciseTrackTabProps) {
  const [editingSetId, setEditingSetId] = useState<Set['id'] | null>(null);
  const [timerTriggerLabel, setTimerTriggerLabel] =
    useState(getTimerTriggerLabel);
  const editingSet = item.sets.find(set => set.id === editingSetId);

  useEffect(() => {
    setTimerTriggerLabel(getTimerTriggerLabel());

    const intervalId = setInterval(() => {
      setTimerTriggerLabel(getTimerTriggerLabel());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

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

      <Pressable
        className="mt-3 flex-row items-center gap-2 self-start"
        onPress={onOpenRestTimer}
      >
        <Icon icon={TimerIcon} size={14} className="text-muted-foreground" />
        <Text variant="small" tone="muted">
          {timerTriggerLabel}
        </Text>
      </Pressable>

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
    </StyledScrollView>
  );
}

function getTimerTriggerLabel(): string {
  if (!timerRef.isRunning) {
    return 'Rest timer';
  }

  const remaining = Math.max(
    0,
    Math.ceil(((timerRef.endTime ?? Date.now()) - Date.now()) / 1000)
  );

  if (remaining <= 0) {
    return 'Rest complete';
  }

  return `Rest · ${formatTime(remaining)}`;
}
