import {
  StyledBottomSheetBackdrop,
  StyledBottomSheetScrollView
} from '@/src/components/styled/bottom-sheet';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import {
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  type BottomSheetFooterProps
} from '@gorhom/bottom-sheet';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { Keyboard, Platform, View } from 'react-native';
import type { PanGestureHandlerProps } from 'react-native-gesture-handler';

interface BottomSheetRenderState {
  isContentReady: boolean;
}

type BottomSheetChildren =
  | ReactNode
  | ((state: BottomSheetRenderState) => ReactNode);

interface BottomSheetComponentProps {
  isOpen: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  keyboardBehavior?: 'interactive' | 'extend' | 'fillParent';
  androidKeyboardInputMode?: 'adjustPan' | 'adjustResize';
  activeOffsetY?: PanGestureHandlerProps['activeOffsetY'];
  children: BottomSheetChildren;
  footer?: ReactNode;
  className?: string;
  enableContentPanningGesture?: boolean;
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
  activeOffsetY,
  children,
  footer,
  className,
  enableContentPanningGesture
}: BottomSheetComponentProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const { colors } = useAppTheme();

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
    setIsContentReady(false);
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const handleChange = useCallback((index: number) => {
    setIsContentReady(index >= 0);
  }, []);

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

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} style={{ backgroundColor: colors.card }}>
        {footer}
      </BottomSheetFooter>
    ),
    [colors.card, footer]
  );

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.present();

      return;
    }

    setIsContentReady(false);
    sheetRef.current?.dismiss();
  }, [isOpen]);

  const renderedChildren =
    typeof children === 'function' ? children({ isContentReady }) : children;

  return (
    <BottomSheetModal
      ref={sheetRef}
      android_keyboardInputMode={resolvedAndroidKeyboardInputMode}
      activeOffsetY={activeOffsetY}
      backdropComponent={renderBackdrop}
      backgroundComponent={SheetBackground}
      enableDynamicSizing={enableDynamicSizing}
      enableDismissOnClose
      enableBlurKeyboardOnGesture
      enablePanDownToClose={enablePanDownToClose}
      footerComponent={footer ? renderFooter : undefined}
      handleComponent={SheetHandle}
      index={0}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={'restore'}
      onChange={handleChange}
      onDismiss={handleDismiss}
      snapPoints={resolvedSnapPoints}
      enableContentPanningGesture={enableContentPanningGesture}
    >
      {enableDynamicSizing ? (
        <BottomSheetView style={undefined} className={className}>
          {renderedChildren}
        </BottomSheetView>
      ) : (
        renderedChildren
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
      contentContainerClassName={cn('px-4 pb-safe-offset-4', className)}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </StyledBottomSheetScrollView>
  );
}

export function BottomSheetSafeContent({
  children,
  className
}: BottomSheetSectionProps) {
  return (
    <View className={cn('pb-safe-offset-2 px-4 pt-2', className)}>
      {children}
    </View>
  );
}

export function BottomSheetSafeFooter({
  children,
  className
}: BottomSheetSectionProps) {
  return (
    <View
      className={cn('pb-safe-offset-2 flex-row gap-3 px-4 pt-4', className)}
    >
      {children}
    </View>
  );
}
