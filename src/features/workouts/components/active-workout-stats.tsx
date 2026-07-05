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
    <View className="bg-muted my-4 flex-row rounded-md">
      <View className="border-r-muted-foreground/20 flex-1 gap-1 border-r-[0.5px] py-2">
        <Text className="text-center" variant="bodyMedium">
          {exerciseCount}
        </Text>
        <Text variant="overline" className="text-center" tone="muted">
          {pluralizeUnit(exerciseCount, 'Exercise')}
        </Text>
      </View>

      <View className="flex-1 gap-1 py-2">
        <Text className="text-center" variant="bodyMedium">
          {completedSetCount}
        </Text>
        <Text variant="overline" className="text-center" tone="muted">
          {pluralizeUnit(completedSetCount, 'Set')}
        </Text>
      </View>
    </View>
  );
}
