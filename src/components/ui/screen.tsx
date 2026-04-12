import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { cn } from '@/src/lib/utils/cn';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from './safe-area-view';
import type { Edge } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
  withPadding?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
};

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
  const sharedContentClassName = cn(
    !scroll && withPadding && 'px-4 py-6',
    contentClassName
  );

  const scrollContentClassName = cn(
    'flex-grow',
    withPadding && (footer ? 'px-4 pt-6 pb-4' : 'px-4 py-6'),
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
      {content}
      {footer ? (
        <View className="border-border bg-background border-t px-4 py-4">
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
