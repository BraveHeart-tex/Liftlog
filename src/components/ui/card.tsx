import type { ReactElement, ReactNode } from "react";
import { Text, View } from "react-native";
import { cn } from "@/src/lib/utils/cn";

type TextChild = string | number | ReactElement<unknown, typeof Text>;
type TextChildren = TextChild | TextChild[];

type CardProps<TChildren = ReactNode> = {
  children: TChildren;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-lg border border-border bg-card",
        className,
      )}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <View className={cn("p-4 pb-0", className)}>{children}</View>;
}

/**
 * Expects text-only children: strings, numbers, or nested <Text> elements.
 * Prevents passing Views or other non-text content into React Native Text.
 */
export function CardTitle({ children, className }: CardProps<TextChildren>) {
  return (
    <Text className={cn("text-h3 text-foreground", className)}>
      {children}
    </Text>
  );
}

/**
 * Expects text-only children: strings, numbers, or nested <Text> elements.
 * Prevents passing Views or other non-text content into React Native Text.
 */
export function CardDescription({ children, className }: CardProps<TextChildren>) {
  return (
    <Text
      className={cn(
        "mt-1 text-small text-muted-foreground",
        className,
      )}
    >
      {children}
    </Text>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <View className={cn("p-4", className)}>{children}</View>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <View
      className={cn("p-4 pt-0 flex-row items-center", className)}
    >
      {children}
    </View>
  );
}
