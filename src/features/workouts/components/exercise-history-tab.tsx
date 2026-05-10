import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Text } from '@/src/components/ui/text';
import type { Exercise } from '@/src/db/schema';
import { useSettings } from '@/src/features/settings/hooks';
import { useExerciseHistoryTab } from '@/src/features/workouts/hooks';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { View } from 'react-native';

interface ExerciseHistoryTabProps {
  exerciseId: Exercise['id'];
  onVerticalScrollStart?: () => void;
  onVerticalScrollEnd?: () => void;
}

function formatWorkoutDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(timestamp));
}

export function ExerciseHistoryTab({
  exerciseId,
  onVerticalScrollStart,
  onVerticalScrollEnd
}: ExerciseHistoryTabProps) {
  const { weightUnit } = useSettings();
  const { history } = useExerciseHistoryTab(exerciseId);

  return (
    <StyledScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-8"
      directionalLockEnabled={true}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={onVerticalScrollStart}
      onScrollEndDrag={onVerticalScrollEnd}
      onMomentumScrollEnd={onVerticalScrollEnd}
    >
      {history.length === 0 ? (
        <View className="mt-6 items-center">
          <Text variant="h3" className="text-center">
            No history yet
          </Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            Complete sets to see your history here.
          </Text>
        </View>
      ) : (
        history.map(historyEntry => (
          <View key={historyEntry.workout.id}>
            <Text variant="caption" tone="muted" className="mt-4 mb-2">
              {formatWorkoutDate(historyEntry.workout.startedAt)} ·{' '}
              {historyEntry.sets.length} sets
            </Text>

            {historyEntry.sets.map((set, index) => (
              <View key={set.id} className="flex-row items-center gap-3 py-1">
                <Text variant="caption" tone="muted" className="w-6">
                  {index + 1}
                </Text>
                <Text variant="caption">
                  {formatWeightForUnit(set.weightKg, weightUnit)} {weightUnit}
                </Text>
                <Text variant="caption" tone="muted">
                  x
                </Text>
                <Text variant="caption">{set.reps} reps</Text>
              </View>
            ))}

            <View className="border-border mt-4 border-b" />
          </View>
        ))
      )}
    </StyledScrollView>
  );
}
