import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  formatSupersetExerciseLabel,
  getSupersetLetter
} from '@/src/features/workouts/superset.utils';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { Repeat2Icon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type SupersetExercisePosition = 1 | 2;

interface SupersetExerciseGroupProps {
  supersetLabel: string;
  className?: string;
  renderRow: (params: {
    label: string;
    position: SupersetExercisePosition;
  }) => ReactNode;
}

export function SupersetExerciseGroup({
  supersetLabel,
  className,
  renderRow
}: SupersetExerciseGroupProps) {
  const supersetLetter = getSupersetLetter(supersetLabel);

  return (
    <View
      className={cn(
        'border-border bg-card overflow-hidden rounded-lg border',
        className
      )}
    >
      <View className="px-4 pt-4">
        <View className="bg-primary/15 flex-row items-center gap-2 self-start rounded-full px-3 py-2">
          <Icon
            as={Repeat2Icon}
            size={iconSizes.sm}
            tone="primary"
            strokeWidth={2.25}
          />
          <Text variant="bodyMedium" tone="primary">
            {supersetLabel}
          </Text>
        </View>
      </View>

      <View className="relative pt-2 pb-2">
        <View className="bg-border absolute top-12 bottom-12 left-7 w-px" />

        <View>
          {renderRow({
            label: formatSupersetExerciseLabel(supersetLetter, 1),
            position: 1
          })}
        </View>

        <View className="bg-border/70 mr-3 ml-14 h-px" />

        <View>
          {renderRow({
            label: formatSupersetExerciseLabel(supersetLetter, 2),
            position: 2
          })}
        </View>
      </View>
    </View>
  );
}
