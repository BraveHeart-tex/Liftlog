import { EmptyState } from '@/src/components/ui/empty-state';
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Component, type ReactNode } from 'react';

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
        <SafeAreaView style={{ flex: 1 }} className="bg-background">
          <EmptyState
            className="bg-background"
            title="Database unavailable"
            description="Failed to initialize the database. Please restart the app and try again."
          />
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
