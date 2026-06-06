import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { EllipsisVerticalIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface ActiveWorkoutHeaderProps {
  workoutName: string;
  duration: string;
  canFinish: boolean;
  onOpenActions: () => void;
  onFinish: () => void;
}

export function ActiveWorkoutHeader({
  workoutName,
  duration,
  canFinish,
  onOpenActions,
  onFinish
}: ActiveWorkoutHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-2 px-4 pt-4 pb-2">
      <BackButton />

      <View className="flex-1">
        <Text variant="h2" numberOfLines={1}>
          {workoutName}
        </Text>
        <Text variant="caption" tone="muted">
          {duration}
        </Text>
      </View>

      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel="Workout actions"
        onPress={onOpenActions}
      >
        <Icon
          icon={EllipsisVerticalIcon}
          size="lg"
          className="text-foreground"
        />
      </Button>

      <Button
        variant="primary"
        size="sm"
        disabled={!canFinish}
        onPress={onFinish}
      >
        Finish
      </Button>
    </View>
  );
}
