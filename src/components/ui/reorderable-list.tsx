import { styled } from 'nativewind';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import {
  useCallback,
  useState,
  type ReactElement,
  type ReactNode
} from 'react';
import { runOnJS } from 'react-native-reanimated';
import ReorderableListBase, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
  type ReorderableListDragEndEvent,
  type ReorderableListDragStartEvent,
  type ReorderableListProps as LibraryReorderableListProps
} from 'react-native-reorderable-list';

const StyledReorderableListBase = styled(ReorderableListBase, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle'
});

const StyledReorderableList = StyledReorderableListBase as unknown as <T>(
  props: LibraryReorderableListProps<T> & {
    className?: string;
    contentContainerClassName?: string;
  }
) => ReactNode;

interface ReorderableListRenderItemInfo<T> {
  item: T;
  index: number;
  isDragging: boolean;
  isReordering: boolean;
}

export type ReorderableListRenderItem<T> = (
  info: ReorderableListRenderItemInfo<T>
) => ReactElement | null;

interface ReorderableListItemProps<T> {
  item: T;
  index: number;
  isReordering: boolean;
  renderItem: ReorderableListRenderItem<T>;
}

function ReorderableListItem<T>({
  item,
  index,
  isReordering,
  renderItem
}: ReorderableListItemProps<T>) {
  const isDragging = useIsActive();

  return renderItem({ item, index, isDragging, isReordering });
}

interface ReorderableListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: ReorderableListRenderItem<T>;
  onReorder: (data: T[]) => void;
  className?: string;
  contentContainerClassName?: string;
}

export function ReorderableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  className,
  contentContainerClassName
}: ReorderableListProps<T>) {
  const reduceMotion = useReducedMotion();
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const isReordering = draggingIndex !== null;

  const setDraggingIndexFromUI = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const clearDraggingIndexFromUI = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const handleDragStart = useCallback(
    ({ index }: ReorderableListDragStartEvent) => {
      'worklet';

      runOnJS(setDraggingIndexFromUI)(index);
    },
    [setDraggingIndexFromUI]
  );

  const handleDragEnd = useCallback(
    (_event: ReorderableListDragEndEvent) => {
      'worklet';

      runOnJS(clearDraggingIndexFromUI)();
    },
    [clearDraggingIndexFromUI]
  );

  const handleReorder = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      if (from === to) {
        return;
      }

      onReorder(reorderItems(data, from, to));
    },
    [data, onReorder]
  );

  const renderReorderableItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <ReorderableListItem
        item={item}
        index={index}
        isReordering={isReordering}
        renderItem={renderItem}
      />
    ),
    [isReordering, renderItem]
  );

  return (
    <StyledReorderableList
      animationDuration={reduceMotion ? 0 : 120}
      cellAnimations={
        reduceMotion
          ? undefined
          : { transform: [{ scale: 1.02 }], opacity: 0.96 }
      }
      className={className}
      contentContainerClassName={contentContainerClassName}
      data={data}
      extraData={draggingIndex}
      keyExtractor={keyExtractor}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onReorder={handleReorder}
      renderItem={renderReorderableItem}
      shouldUpdateActiveItem
    />
  );
}

interface ReorderableHandleRenderProps {
  onPressIn: () => void;
}

interface ReorderableHandleProps {
  children: (props: ReorderableHandleRenderProps) => ReactElement;
}

export function ReorderableHandle({
  children
}: ReorderableHandleProps): ReactElement {
  const drag = useReorderableDrag();

  return children({ onPressIn: drag });
}
