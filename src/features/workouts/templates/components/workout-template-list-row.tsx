import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import type { WorkoutStartTemplateItem } from '@/src/features/workouts/templates/hooks/use-workout-templates';
import { iconSizes } from '@/src/theme/sizes';
import { ChevronRightIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface WorkoutTemplateListRowProps {
  item: WorkoutStartTemplateItem;
  onPress: (templateId: string) => void;
}

export function WorkoutTemplateListRow({
  item,
  onPress
}: WorkoutTemplateListRowProps) {
  return (
    <PressableSurface
      className="border-border flex-row items-center border-b py-4"
      accessibilityLabel={`Open ${item.template.name} template`}
      onPress={() => onPress(item.template.id)}
    >
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="bodyMedium" numberOfLines={1}>
          {item.template.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text variant="small" tone="muted" numberOfLines={1}>
            {item.exerciseCount === 1
              ? '1 exercise'
              : `${item.exerciseCount} exercises`}
          </Text>

          <Text variant="small" tone="muted">
            ·
          </Text>

          <Text
            variant="small"
            tone="muted"
            numberOfLines={1}
            className="flex-1"
          >
            {item.exerciseSummary}
          </Text>
        </View>
      </View>

      <Icon
        as={ChevronRightIcon}
        tone="mutedForeground"
        size={iconSizes.md}
        className="ml-4 shrink-0"
      />
    </PressableSurface>
  );
}
