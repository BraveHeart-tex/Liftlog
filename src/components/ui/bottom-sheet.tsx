import {
  StyledBottomSheetBackdrop,
  StyledBottomSheetScrollView
} from '@/src/components/styled/bottom-sheet';
import { cn } from '@/src/lib/utils/cn';
import GorhomBottomSheet, {
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps
} from '@gorhom/bottom-sheet';
import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { Keyboard, Text, View } from 'react-native';

interface BottomSheetComponentProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  keyboardBehavior?: 'interactive' | 'extend' | 'fillParent';
  children: ReactNode;
  className?: string;
}

interface BottomSheetSectionProps {
  children: ReactNode;
  className?: string;
}

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
  snapPoints,
  enablePanDownToClose = true,
  enableDynamicSizing = false,
  keyboardBehavior = 'extend',
  children,
  className
}: BottomSheetComponentProps) {
  const resolvedSnapPoints = useMemo(() => {
    if (enableDynamicSizing) {
      return snapPoints;
    }

    return snapPoints ?? DEFAULT_SNAP_POINTS;
  }, [enableDynamicSizing, snapPoints]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <StyledBottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.72}
        pressBehavior="close"
        className="bg-background"
      />
    ),
    []
  );

  return (
    <GorhomBottomSheet
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundComponent={SheetBackground}
      enableDynamicSizing={enableDynamicSizing}
      enableBlurKeyboardOnGesture
      enablePanDownToClose={enablePanDownToClose}
      handleComponent={SheetHandle}
      index={isOpen ? 0 : -1}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={enableDynamicSizing ? 'restore' : 'restore'} // always restore
      onClose={handleClose}
      snapPoints={resolvedSnapPoints}
    >
      <BottomSheetView
        style={enableDynamicSizing ? undefined : { flex: 1 }}
        className={className}
      >
        {children}
      </BottomSheetView>
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
    <StyledBottomSheetScrollView
      contentContainerClassName={cn('px-4', className)}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </StyledBottomSheetScrollView>
  );
}
