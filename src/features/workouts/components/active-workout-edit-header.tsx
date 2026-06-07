import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { View } from 'react-native';

interface ActiveWorkoutEditHeaderProps {
  workoutName: string;
  onDone: () => void;
}

export function ActiveWorkoutEditHeader({
  workoutName,
  onDone
}: ActiveWorkoutEditHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 px-4 pt-4 pb-2">
      <View className="flex-1">
        <Text variant="h2" numberOfLines={1}>
          {workoutName}
        </Text>
      </View>

      <Button variant="ghost" size="sm" onPress={onDone}>
        Done
      </Button>
    </View>
  );
}
