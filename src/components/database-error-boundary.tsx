import { Text } from '@/src/components/ui/text';
import { Component, type ReactNode } from 'react';
import { View } from 'react-native';

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
          <Text variant="h3">Something went wrong</Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            Failed to initialize the database
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
