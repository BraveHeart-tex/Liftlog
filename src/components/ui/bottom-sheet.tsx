import { cn } from '@/src/lib/utils/cn';
import { colors } from '@/src/theme/tokens';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps
} from '@gorhom/bottom-sheet';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactNode
} from 'react';
import { ScrollView, Text, View } from 'react-native';

type BottomSheetComponentProps = {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: string[];
  children: ReactNode;
  className?: string;
};

type BottomSheetSectionProps = {
  children: ReactNode;
  className?: string;
};

const DEFAULT_SNAP_POINTS = ['50%', '90%'];

const SheetBackground = memo(function SheetBackground({
  pointerEvents,
  style
}: BottomSheetBackgroundProps) {
  return (
    <View
      pointerEvents={pointerEvents}
      style={style}
      className="bg-card rounded-t-xl"
    />
  );
});

const SheetHandle = memo(function SheetHandle() {
  return (
    <View className="items-center pt-3 pb-1">
      <View className="bg-muted h-1.5 w-12 rounded-full" />
    </View>
  );
});

export function BottomSheet({
  isOpen,
  onClose,
  snapPoints = DEFAULT_SNAP_POINTS,
  children,
  className
}: BottomSheetComponentProps) {
  const sheetRef = useRef<ComponentRef<typeof GorhomBottomSheet>>(null);
  const resolvedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    sheetRef.current?.close();
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.72}
        pressBehavior="close"
        style={[props.style, { backgroundColor: colors.background }]}
      />
    ),
    []
  );

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      animateOnMount={false}
      backdropComponent={renderBackdrop}
      backgroundComponent={SheetBackground}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleComponent={SheetHandle}
      index={-1}
      onClose={onClose}
      snapPoints={resolvedSnapPoints}
    >
      <View className={className}>{children}</View>
    </GorhomBottomSheet>
  );
}

export function BottomSheetHeader({
  children,
  className
}: BottomSheetSectionProps) {
  return <View className={cn('px-4 pt-4 pb-2', className)}>{children}</View>;
}

export function BottomSheetTitle({
  children,
  className
}: BottomSheetSectionProps) {
  return (
    <Text className={cn('text-h3 text-foreground', className)}>{children}</Text>
  );
}

export function BottomSheetDescription({
  children,
  className
}: BottomSheetSectionProps) {
  return (
    <Text className={cn('text-small text-muted-foreground mt-1', className)}>
      {children}
    </Text>
  );
}

export function BottomSheetContent({
  children,
  className
}: BottomSheetSectionProps) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      contentContainerClassName={className}
    >
      {children}
    </ScrollView>
  );
}
