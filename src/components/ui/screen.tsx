import { cn } from "@/src/lib/utils/cn";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
  withPadding?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
};

const SCREEN_PADDING_CLASS_NAME = "px-4 py-6";

export function Screen({
  children,
  className,
  contentClassName,
  scroll = false,
  withPadding = true,
  edges = ["top"],
  footer,
  keyboardShouldPersistTaps = "handled",
}: ScreenProps) {
  const sharedContentClassName = cn(
    withPadding && SCREEN_PADDING_CLASS_NAME,
    contentClassName,
  );

  const content = !scroll ? (
    <View className={cn("flex-1", sharedContentClassName)}>
      {children}
    </View>
  ) : footer ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      contentContainerClassName={cn(sharedContentClassName, "pb-4")}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  ) : (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      contentContainerClassName={sharedContentClassName}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      className={cn("bg-background", className)}
      edges={edges}
    >
      {content}
      {footer ? (
        <View className="border-t border-border bg-background px-4 py-4">
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
