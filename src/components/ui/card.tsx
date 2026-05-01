import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import type { ReactElement, ReactNode } from 'react';
import { View } from 'react-native';

type TextChild = string | number | ReactElement<unknown, typeof Text>;

type TextChildren = TextChild | TextChild[];

type CardProps<TChildren = ReactNode> = {
  children: TChildren;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn('border-border bg-card rounded-lg border', className)}>
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <View className={cn('p-4 pb-0', className)}>{children}</View>;
}

/**
 * Expects text-only children: strings, numbers, or nested <Text> elements.
 * Prevents passing Views or other non-text content into React Native Text.
 */
export function CardTitle({ children, className }: CardProps<TextChildren>) {
  return (
    <Text variant="h3" className={className}>
      {children}
    </Text>
  );
}

/**
 * Expects text-only children: strings, numbers, or nested <Text> elements.
 * Prevents passing Views or other non-text content into React Native Text.
 */
export function CardDescription({
  children,
  className
}: CardProps<TextChildren>) {
  return (
    <Text variant="small" tone="muted" className={cn('mt-1', className)}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <View className={cn('p-4', className)}>{children}</View>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <View className={cn('flex-row items-center p-4 pt-0', className)}>
      {children}
    </View>
  );
}
