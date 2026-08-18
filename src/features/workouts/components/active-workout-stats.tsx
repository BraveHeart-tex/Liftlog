import { Text } from '@/src/components/ui/text';
import { pluralizeUnit } from '@/src/lib/utils/string.utils';
import { View } from 'react-native';

interface ActiveWorkoutStatsProps {
  completedSetCount: number;
  exerciseCount: number;
}

export function ActiveWorkoutStats({
  completedSetCount,
  exerciseCount
}: ActiveWorkoutStatsProps) {
  return (
    <View className="flex-row">
      <Text variant="bodyMedium" tone="muted">
        {exerciseCount}
      </Text>
      <Text variant="small" tone="muted" className="ml-1">
        {pluralizeUnit(exerciseCount, 'exercise')}
      </Text>
      <Text variant="small" tone="muted" className="mx-2">
        ·
      </Text>
      <Text variant="bodyMedium" tone="muted">
        {completedSetCount}
      </Text>
      <Text variant="small" tone="muted" className="ml-1">
        {pluralizeUnit(completedSetCount, 'set')}
      </Text>
    </View>
  );
}
