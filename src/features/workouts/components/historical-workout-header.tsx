import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db/schema';
import { formatWorkoutDate } from '@/src/lib/utils/date.utils';
import { View } from 'react-native';

interface HistoricalWorkoutHeaderProps {
  title: string;
  workoutName: string;
  startedAt: Workout['startedAt'];
  canSave: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function HistoricalWorkoutHeader({
  title,
  workoutName,
  startedAt,
  canSave,
  onDiscard,
  onSave
}: HistoricalWorkoutHeaderProps) {
  return (
    <View>
      <View className="border-border bg-card flex-row items-center justify-between gap-3 border-b px-4 pt-4 pb-3">
        <BackButton onPress={onDiscard} />

        <View className="flex-1">
          <Text variant="h3">{title}</Text>
        </View>

        <Button size="sm" disabled={!canSave} onPress={onSave}>
          Save
        </Button>
      </View>

      <View className="px-4 pt-4 pb-2">
        <Text variant="h2">{workoutName}</Text>
        <Text variant="caption" tone="muted" className="mt-1">
          {formatWorkoutDate(startedAt, 'full')}
        </Text>
      </View>
    </View>
  );
}
