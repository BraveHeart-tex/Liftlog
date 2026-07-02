import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { formatWorkoutDate } from '@/src/lib/utils/date';
import { EllipsisVerticalIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface WorkoutDetailHeaderProps {
  name: string;
  startedAt: number;
  actionsDisabled?: boolean;
  onOpenActions: () => void;
}

export function WorkoutDetailHeader({
  name,
  startedAt,
  actionsDisabled = false,
  onOpenActions
}: WorkoutDetailHeaderProps) {
  return (
    <View className="flex-row items-center gap-3">
      <BackButton />

      <View className="flex-1">
        <Text variant="h1" numberOfLines={2}>
          {name}
        </Text>

        <Text variant="small" tone="muted" className="mt-1">
          {formatWorkoutDate(startedAt, 'full')}
        </Text>
      </View>

      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel="Workout actions"
        disabled={actionsDisabled}
        onPress={onOpenActions}
      >
        <Icon as={EllipsisVerticalIcon} size="lg" tone="foreground" />
      </Button>
    </View>
  );
}
