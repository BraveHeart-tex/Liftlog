import { Component, ReactNode } from "react";
import { Text, View } from "react-native";

export class DatabaseErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Database error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Text className="text-h3 text-foreground">Something went wrong</Text>
          <Text className="mt-2 text-small text-muted-foreground text-center">
            Failed to initialize the database
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
