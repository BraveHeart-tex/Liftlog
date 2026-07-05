import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { View } from 'react-native';

interface HistoricalWorkoutHeaderProps {
  workoutName: string;
  startedAt: Workout['startedAt'];
  canSave: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function HistoricalWorkoutHeader({
  workoutName,
  startedAt,
  canSave,
  onDiscard,
  onSave
}: HistoricalWorkoutHeaderProps) {
  return (
    <View className="gap-3 px-4 pt-4 pb-2">
      <View className="flex-row items-center justify-between gap-3">
        <BackButton onPress={onDiscard} />

        <View className="flex-1">
          <Text variant="h2" numberOfLines={1}>
            {workoutName}
          </Text>
          <Text variant="caption" tone="muted">
            {formatWorkoutDate(startedAt, 'full')}
          </Text>
        </View>

        <Button size="sm" disabled={!canSave} onPress={onSave}>
          Save
        </Button>
      </View>
    </View>
  );
}
