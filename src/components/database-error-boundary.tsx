import { EmptyState } from '@/src/components/ui/empty-state';
import { Component, type ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
  children: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
}

export class DatabaseErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Database initialization failed', error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="bg-background p-safe flex-1">
          <EmptyState
            className="bg-background"
            title="Database unavailable"
            description="Failed to initialize the database. Please restart the app and try again."
          />
        </View>
      );
    }

    return this.props.children;
  }
}
