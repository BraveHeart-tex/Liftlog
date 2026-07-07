import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { NewTemplateExerciseRow } from '@/src/features/workouts/components/new-template-exercise-row';
import { PairWithNextControl } from '@/src/features/workouts/components/pair-with-next-control';
import type { TemplateExerciseEditorRow } from '@/src/features/workouts/components/template-exercise-editor';
import {
  flattenSupersetBlocks,
  formatSupersetLetter,
  groupSupersetBlocks,
  linkAdjacentSupersetRows,
  unlinkSupersetRows,
  type SupersetBlock
} from '@/src/features/workouts/superset.utils';
import { iconSizes } from '@/src/theme/sizes';
import { UnlinkIcon } from 'lucide-react-native';
import type { ComponentRef } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable, {
  type DragStartParams,
  type SortableGridDragEndParams,
  type SortableGridRenderItem
} from 'react-native-sortables';

const DRAG_ACTIVATION_DELAY_MS = 0;

interface NewTemplateExerciseListProps {
  rows: TemplateExerciseEditorRow[];
  onDeleteExercise: (rowId: TemplateExerciseEditorRow['id']) => void;
  onReorderExercises: (rows: TemplateExerciseEditorRow[]) => void;
}

export function NewTemplateExerciseList({
  rows,
  onDeleteExercise,
  onReorderExercises
}: NewTemplateExerciseListProps) {
  const blocks = useMemo(() => groupSupersetBlocks(rows), [rows]);
  const [draggingBlockKey, setDraggingBlockKey] = useState<string | null>(null);
  const shouldShowDragHandle = blocks.length > 1;
  const scrollableRef =
    useAnimatedRef<ComponentRef<typeof Animated.ScrollView>>();

  const renderExercise = useCallback<
    SortableGridRenderItem<SupersetBlock<TemplateExerciseEditorRow>>
  >(
    ({ item, index }) => {
      const canLinkWithNext =
        !draggingBlockKey &&
        item.rows.length === 1 &&
        blocks[index + 1]?.rows.length === 1 &&
        !item.rows[0].supersetId &&
        !blocks[index + 1].rows[0].supersetId;
      const supersetLabel = item.supersetId
        ? formatSupersetLetter(
            blocks.slice(0, index).filter(block => block.supersetId).length
          )
        : undefined;

      return (
        <View className="py-2">
          <View className="border-border border-b pb-2">
            {item.supersetId ? (
              <View className="mb-1 flex-row items-center justify-between">
                <Text variant="caption" tone="muted">
                  Superset {supersetLabel}
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-0 px-0 py-0"
                  textClassName="text-danger text-sm"
                  leftIcon={
                    <Icon as={UnlinkIcon} size={iconSizes.xs} tone="danger" />
                  }
                  onPress={() =>
                    onReorderExercises(
                      unlinkSupersetRows(rows, item.supersetId!)
                    )
                  }
                >
                  Unlink
                </Button>
              </View>
            ) : null}

            {item.rows.map((row, rowIndex) => (
              <NewTemplateExerciseRow
                key={row.id}
                exercise={row.exercise}
                isDragging={false}
                label={supersetLabel}
                onDelete={() => onDeleteExercise(row.id)}
                shouldShowDragHandle={
                  shouldShowDragHandle && rowIndex === item.rows.length - 1
                }
              />
            ))}
          </View>

          {canLinkWithNext ? (
            <PairWithNextControl
              onPress={() =>
                onReorderExercises(
                  linkAdjacentSupersetRows(rows, item.rows[0].id)
                )
              }
            />
          ) : null}
        </View>
      );
    },
    [
      blocks,
      draggingBlockKey,
      onDeleteExercise,
      onReorderExercises,
      rows,
      shouldShowDragHandle
    ]
  );

  const handleDragEnd = useCallback(
    ({
      data,
      fromIndex,
      toIndex
    }: SortableGridDragEndParams<SupersetBlock<TemplateExerciseEditorRow>>) => {
      setDraggingBlockKey(null);

      if (fromIndex !== toIndex) {
        onReorderExercises(flattenSupersetBlocks(data));
      }
    },
    [onReorderExercises]
  );

  const handleDragStart = useCallback(({ key }: DragStartParams) => {
    setDraggingBlockKey(key);
  }, []);

  const keyExtractor = useCallback(
    (block: SupersetBlock<TemplateExerciseEditorRow>) => block.id,
    []
  );

  return (
    <Animated.ScrollView className="mt-2 flex-1 px-4" ref={scrollableRef}>
      <Sortable.Grid
        columns={1}
        customHandle
        data={blocks}
        dimensionsAnimationType="none"
        dragActivationDelay={DRAG_ACTIVATION_DELAY_MS}
        activationAnimationDuration={120}
        dropAnimationDuration={120}
        itemEntering={null}
        itemExiting={null}
        keyExtractor={keyExtractor}
        renderItem={renderExercise}
        scrollableRef={scrollableRef}
        strategy="insert"
        overDrag="vertical"
        activeItemScale={1.02}
        activeItemOpacity={0.96}
        inactiveItemOpacity={1}
        inactiveItemScale={1}
        hapticsEnabled={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </Animated.ScrollView>
  );
}
