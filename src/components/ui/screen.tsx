import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { cn } from '@/src/lib/utils/cn';
import { useEffect, useState, type ReactNode, type Ref } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  View,
  type KeyboardEvent,
  type ScrollView,
  type ScrollViewProps
} from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from './safe-area-view';

interface ScreenProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
  withPadding?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  scrollRef?: Ref<ScrollView>;
  /**
   * Determines when the keyboard should stay visible after a tap.
   *
   * - `'never'` (default): tapping outside the focused input dismisses the
   *   keyboard, and children will not receive the tap.
   * - `'always'`: the keyboard does not dismiss automatically, and children can
   *   receive taps.
   * - `'handled'`: the keyboard does not dismiss automatically when the tap is
   *   handled by a child or captured by an ancestor.
   * - `false`: deprecated, use `'never'` instead.
   * - `true`: deprecated, use `'always'` instead.
   */
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
}

export function Screen({
  children,
  className,
  contentClassName,
  scroll = false,
  withPadding = true,
  edges = ['top'],
  footer,
  scrollRef,
  keyboardShouldPersistTaps = 'handled'
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const [androidKeyboardOffset, setAndroidKeyboardOffset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android' || !footer) {
      return;
    }

    const handleKeyboardShow = (event: KeyboardEvent) => {
      setAndroidKeyboardOffset(
        Math.max(0, event.endCoordinates.height - insets.bottom + 12)
      );
    };

    const handleKeyboardHide = () => {
      setAndroidKeyboardOffset(0);
    };

    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      handleKeyboardShow
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      handleKeyboardHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [footer, insets.bottom]);

  const sharedContentClassName = cn(
    !scroll && withPadding && 'px-4 py-6',
    contentClassName
  );

  const scrollContentClassName = cn(
    'flex-grow',
    withPadding && (footer ? 'px-4 pt-6 pb-6' : 'px-4 py-6'),
    sharedContentClassName
  );

  const content = !scroll ? (
    <View className={cn('flex-1', sharedContentClassName)}>{children}</View>
  ) : footer ? (
    <StyledScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerClassName={scrollContentClassName}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </StyledScrollView>
  ) : (
    <StyledScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerClassName={scrollContentClassName}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </StyledScrollView>
  );

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className={cn('bg-background', className)}
      edges={edges}
    >
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {content}
          {footer ? (
            <View
              className="border-border bg-background border-t px-4 pt-4"
              style={{ paddingBottom: insets.bottom + 12 }}
            >
              {footer}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1">
          {content}
          {footer ? (
            <View
              className="border-border bg-background border-t px-4 pt-4"
              style={{
                marginBottom: androidKeyboardOffset,
                paddingBottom: insets.bottom + 12
              }}
            >
              {footer}
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}
