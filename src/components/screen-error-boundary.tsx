import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';

type Props = {
  children: ReactNode;
  screenName?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    console.error(
      `Screen error [${this.props.screenName ?? 'unknown'}]:`,
      error
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="bg-background flex-1 items-center justify-center px-6">
          <Text variant="h3" className="text-center">
            Something went wrong
          </Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            An unexpected error occurred on this screen.
          </Text>
          <Button
            variant="secondary"
            className="mt-6"
            onPress={this.handleReset}
          >
            Try again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
