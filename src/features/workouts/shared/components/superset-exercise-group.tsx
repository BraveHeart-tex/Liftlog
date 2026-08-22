import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  formatSupersetExerciseLabel,
  getSupersetLetter
} from '@/src/features/workouts/shared/superset.utils';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { Repeat2Icon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type SupersetExercisePosition = 1 | 2;

interface SupersetExerciseGroupProps<TRow> {
  rows: readonly TRow[];
  supersetLabel: string;
  className?: string;
  renderHeaderActions?: ReactNode;
  rowInteraction?: {
    onPress: (row: TRow) => void;
    onLongPress?: (row: TRow) => void;
    getAccessibilityLabel: (row: TRow) => string;
  };
  renderRow: (params: {
    row: TRow;
    position: SupersetExercisePosition;
  }) => ReactNode;
}

export function SupersetExerciseGroup<TRow>({
  rows,
  supersetLabel,
  className,
  renderHeaderActions,
  rowInteraction,
  renderRow
}: SupersetExerciseGroupProps<TRow>) {
  const supersetLetter = getSupersetLetter(supersetLabel);
  const firstRow = rows[0];
  const secondRow = rows[1];

  if (firstRow === undefined || secondRow === undefined) {
    return null;
  }

  const renderGroupRow = (row: TRow, position: SupersetExercisePosition) => {
    const rowContent = (pressed: boolean) => (
      <View
        className={cn(
          'flex-row items-center gap-3 px-4',
          pressed && 'bg-secondary'
        )}
      >
        <View className="w-10 shrink-0">
          <Text variant="body" tone="muted">
            {formatSupersetExerciseLabel(supersetLetter, position)}
          </Text>
        </View>
        <View className="min-w-0 flex-1">{renderRow({ row, position })}</View>
      </View>
    );

    if (!rowInteraction) {
      return rowContent(false);
    }

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rowInteraction.getAccessibilityLabel(row)}
        className="w-full"
        onPress={() => rowInteraction.onPress(row)}
        onLongPress={
          rowInteraction.onLongPress
            ? () => rowInteraction.onLongPress?.(row)
            : undefined
        }
      >
        {({ pressed }) => rowContent(pressed)}
      </Pressable>
    );
  };

  return (
    <View
      className={cn(
        'border-border bg-card overflow-hidden rounded-2xl border',
        className
      )}
    >
      <View className="border-border flex-row items-center justify-between gap-2 border-b px-4 py-3">
        <View className="flex-row items-center gap-2">
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
        {renderGroupRow(firstRow, 1)}

        <View className="bg-border/70 mx-4 ml-14 h-px" />

        {renderGroupRow(secondRow, 2)}
      </View>
    </View>
  );
}
