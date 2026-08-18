import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import {
  ReorderableHandle,
  ReorderableList,
  type ReorderableListRenderItem
} from '@/src/components/ui/reorderable-list';
import { NewTemplateExerciseRow } from '@/src/features/workouts/components/new-template-exercise-row';
import { PairWithNextControl } from '@/src/features/workouts/components/pair-with-next-control';
import { SupersetExerciseGroup } from '@/src/features/workouts/components/superset-exercise-group';
import type { TemplateExerciseEditorRow } from '@/src/features/workouts/components/template-exercise-editor';
import {
  flattenSupersetBlocks,
  formatSupersetLabel,
  groupSupersetBlocks,
  linkAdjacentSupersetRows,
  unlinkSupersetRows,
  type SupersetBlock
} from '@/src/features/workouts/superset.utils';
import { iconSizes } from '@/src/theme/sizes';
import { GripIcon, UnlinkIcon } from 'lucide-react-native';
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
        ? formatSupersetLabel(
            blocks.slice(0, index).filter(block => block.supersetId).length
          )
        : undefined;
      const content = item.supersetId ? (
        <SupersetExerciseGroup
          rows={item.rows}
          supersetLabel={supersetLabel ?? 'Superset'}
          renderHeaderActions={
            <>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-0 px-0 py-0"
                textClassName="text-danger text-sm"
                leftIcon={
                  <Icon as={UnlinkIcon} size={iconSizes.xs} tone="danger" />
                }
                onPress={() =>
                  onReorderExercises(unlinkSupersetRows(rows, item.supersetId!))
                }
              >
                Unlink
              </Button>
              {shouldShowDragHandle ? (
                <ReorderableHandle>
                  {({ onPressIn }) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDragging}
                      accessibilityLabel={`Drag ${supersetLabel}`}
                      onPressIn={onPressIn}
                    >
                      <Icon
                        as={GripIcon}
                        size={iconSizes.sm}
                        tone="mutedForeground"
                      />
                    </Button>
                  )}
                </ReorderableHandle>
              ) : null}
            </>
          }
          renderRow={({ row }) => {
            return (
              <NewTemplateExerciseRow
                key={row.id}
                exercise={row.exercise}
                isDragging={false}
                className="flex-1"
                onDelete={() => onDeleteExercise(row.id)}
                shouldShowDragHandle={false}
              />
            );
          }}
        />
      ) : (
        <View className="border-border border-b pb-2">
          {item.rows.map(row => (
            <NewTemplateExerciseRow
              key={row.id}
              exercise={row.exercise}
              isDragging={isDragging}
              onDelete={() => onDeleteExercise(row.id)}
              shouldShowDragHandle={shouldShowDragHandle}
            />
          ))}
        </View>
      );

      return (
        <View className="py-2">
          {content}

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
