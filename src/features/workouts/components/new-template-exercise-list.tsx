import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import {
  ReorderableList,
  type ReorderableListRenderItem
} from '@/src/components/ui/reorderable-list';
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
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

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
  const shouldShowDragHandle = blocks.length > 1;

  const renderExercise = useCallback<
    ReorderableListRenderItem<SupersetBlock<TemplateExerciseEditorRow>>
  >(
    ({ item, index, isDragging, isReordering }) => {
      const canLinkWithNext =
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
                isDragging={isDragging}
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
              isReordering={isReordering}
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
    [blocks, onDeleteExercise, onReorderExercises, rows, shouldShowDragHandle]
  );

  const keyExtractor = useCallback(
    (block: SupersetBlock<TemplateExerciseEditorRow>) => block.id,
    []
  );

  return (
    <ReorderableList
      className="mt-2 flex-1 px-4"
      data={blocks}
      keyExtractor={keyExtractor}
      onReorder={data => onReorderExercises(flattenSupersetBlocks(data))}
      renderItem={renderExercise}
    />
  );
}
