import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { joinClassNames } from "@/src/lib/utils/joinClassNames";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={joinClassNames(
        "rounded-lg border border-border bg-card",
        className,
      )}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <View className={joinClassNames("p-4 pb-0", className)}>{children}</View>;
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <Text className={joinClassNames("text-h3 text-foreground", className)}>
      {children}
    </Text>
  );
}

export function CardDescription({ children, className }: CardProps) {
  return (
    <Text
      className={joinClassNames(
        "mt-1 text-small text-muted-foreground",
        className,
      )}
    >
      {children}
    </Text>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <View className={joinClassNames("p-4", className)}>{children}</View>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <View
      className={joinClassNames("p-4 pt-0 flex-row items-center", className)}
    >
      {children}
    </View>
  );
}
