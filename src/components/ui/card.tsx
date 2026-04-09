import type { ReactElement, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/src/lib/utils/cn';

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
    <Text className={cn('text-h3 text-foreground', className)}>{children}</Text>
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
    <Text className={cn('text-small text-muted-foreground mt-1', className)}>
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
