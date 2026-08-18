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
  variant?: 'default' | 'edit';
  renderHeaderActions?: ReactNode;
  renderRow: (params: {
    label: string;
    position: SupersetExercisePosition;
  }) => ReactNode;
}

export function SupersetExerciseGroup({
  supersetLabel,
  className,
  variant = 'default',
  renderHeaderActions,
  renderRow
}: SupersetExerciseGroupProps) {
  const supersetLetter = getSupersetLetter(supersetLabel);

  return (
    <View
      className={cn(
        'border-border bg-card overflow-hidden border',
        variant === 'edit' ? 'rounded-2xl' : 'rounded-lg',
        className
      )}
    >
      <View
        className={cn(
          'flex-row items-center justify-between gap-2 px-4',
          variant === 'edit' ? 'border-border border-b py-3' : 'pt-4'
        )}
      >
        <View
          className={cn(
            'flex-row items-center gap-2',
            variant === 'default' &&
              'bg-primary/15 self-start rounded-full px-3 py-2'
          )}
        >
          <Icon
            as={Repeat2Icon}
            size={iconSizes.sm}
            tone="primary"
            strokeWidth={2.25}
          />
          <Text variant="bodyMedium" tone="primary" weight="semiBold">
            {supersetLabel}
          </Text>
        </View>
        {renderHeaderActions ? (
          <View className="shrink-0 flex-row items-center gap-1">
            {renderHeaderActions}
          </View>
        ) : null}
      </View>

      <View className="pt-2 pb-2">
        <View>
          {renderRow({
            label: formatSupersetExerciseLabel(supersetLetter, 1),
            position: 1
          })}
        </View>

        <View
          className={cn(
            'bg-border/70 h-px',
            variant === 'edit' ? 'mx-4 ml-14' : 'mr-3 ml-14'
          )}
        />

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
