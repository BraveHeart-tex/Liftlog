import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { cn } from '@/src/lib/utils/cn';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  type ScrollViewProps,
  View
} from 'react-native';
import { type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from './safe-area-view';

interface ScreenProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
  withPadding?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
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
  keyboardShouldPersistTaps = 'handled'
}: ScreenProps) {
  const insets = useSafeAreaInsets();
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
      className="flex-1"
      contentContainerClassName={scrollContentClassName}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </StyledScrollView>
  ) : (
    <StyledScrollView
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
    </SafeAreaView>
  );
}
