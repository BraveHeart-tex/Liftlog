import { Component, type ReactNode } from 'react';
import { Text, View } from 'react-native';

export class DatabaseErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Database error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="bg-background flex-1 items-center justify-center px-6">
          <Text className="text-h3 text-foreground">Something went wrong</Text>
          <Text className="text-small text-muted-foreground mt-2 text-center">
            Failed to initialize the database
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
