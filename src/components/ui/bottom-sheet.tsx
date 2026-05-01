import {
  StyledBottomSheetBackdrop,
  StyledBottomSheetScrollView
} from '@/src/components/styled/bottom-sheet';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import {
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps
} from '@gorhom/bottom-sheet';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode
} from 'react';
import { Keyboard, Platform, View } from 'react-native';

interface BottomSheetComponentProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  keyboardBehavior?: 'interactive' | 'extend' | 'fillParent';
  androidKeyboardInputMode?: 'adjustPan' | 'adjustResize';
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
  androidKeyboardInputMode,
  children,
  className
}: BottomSheetComponentProps) {
  const sheetRef = useRef<BottomSheetModal>(null);

  const resolvedAndroidKeyboardInputMode =
    androidKeyboardInputMode ??
    (Platform.OS === 'android' &&
    enableDynamicSizing &&
    keyboardBehavior === 'interactive'
      ? 'adjustPan'
      : 'adjustResize');

  const resolvedSnapPoints = useMemo(() => {
    if (enableDynamicSizing) {
      return snapPoints;
    }

    return snapPoints ?? DEFAULT_SNAP_POINTS;
  }, [enableDynamicSizing, snapPoints]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <StyledBottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.75}
        pressBehavior="close"
        className="bg-background"
      />
    ),
    []
  );

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.present();

      return;
    }

    sheetRef.current?.dismiss();
  }, [isOpen]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      android_keyboardInputMode={resolvedAndroidKeyboardInputMode}
      backdropComponent={renderBackdrop}
      backgroundComponent={SheetBackground}
      enableDynamicSizing={enableDynamicSizing}
      enableDismissOnClose
      enableBlurKeyboardOnGesture
      enablePanDownToClose={enablePanDownToClose}
      handleComponent={SheetHandle}
      index={0}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={'restore'}
      onDismiss={handleDismiss}
      snapPoints={resolvedSnapPoints}
    >
      {enableDynamicSizing ? (
        <BottomSheetView style={undefined} className={className}>
          {children}
        </BottomSheetView>
      ) : (
        children
      )}
    </BottomSheetModal>
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
    <Text variant="h3" className={className}>
      {children}
    </Text>
  );
}

export function BottomSheetDescription({
  children,
  className
}: BottomSheetSectionProps) {
  return (
    <Text variant="small" tone="muted" className={cn('mt-1', className)}>
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
