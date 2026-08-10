import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { RefreshCwIcon } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    const errorLabel = this.props.screenName
      ? `Screen error [${this.props.screenName}]`
      : 'App error';

    console.error(`${errorLabel}:`, error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="bg-background flex-1">
          <EmptyState
            kind="error"
            title="Something went wrong"
            description="An unexpected error occurred."
            actions={
              <Button
                variant="secondary"
                leftIcon={
                  <Icon as={RefreshCwIcon} tone="secondaryForeground" />
                }
                onPress={this.handleReset}
              >
                Try again
              </Button>
            }
          />
        </View>
      );
    }

    return this.props.children;
  }
}
