import { cn } from '@/src/lib/utils/cn';
import type { ReactNode } from 'react';
import { ScrollView, type StyleProp, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

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

const SCREEN_CONTENT_PADDING_STYLE = {
  paddingHorizontal: 16,
  paddingVertical: 24
} satisfies ViewStyle;

const SCREEN_FOOTER_CONTENT_PADDING_STYLE = {
  paddingHorizontal: 16,
  paddingTop: 24,
  paddingBottom: 16
} satisfies ViewStyle;

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
  const scrollContentStyle: StyleProp<ViewStyle> = [
    { flexGrow: 1 },
    withPadding &&
      (footer
        ? SCREEN_FOOTER_CONTENT_PADDING_STYLE
        : SCREEN_CONTENT_PADDING_STYLE)
  ];

  const content = !scroll ? (
    <View className={cn('flex-1', sharedContentClassName)}>{children}</View>
  ) : footer ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={scrollContentStyle}
      contentContainerClassName={sharedContentClassName}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  ) : (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={scrollContentStyle}
      contentContainerClassName={sharedContentClassName}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
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
