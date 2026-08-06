import { EmptyState } from '@/src/components/ui/empty-state';
import { ExerciseNameMigrationConflictError } from '@/src/db/exercise-name-migration';
import { Component, type ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
  children: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error?: unknown;
}

export class DatabaseErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    console.error('Database initialization failed', error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      const exerciseNameConflict =
        this.state.error instanceof ExerciseNameMigrationConflictError
          ? this.state.error
          : undefined;
      const conflictingNames = exerciseNameConflict?.conflicts
        .map(conflict =>
          conflict.exercises.map(exercise => `“${exercise.name}”`).join(' / ')
        )
        .join('; ');

      return (
        <View className="bg-background p-safe flex-1">
          <EmptyState
            className="bg-background"
            title={
              exerciseNameConflict
                ? 'Exercise names need attention'
                : 'Database unavailable'
            }
            description={
              exerciseNameConflict
                ? `The database upgrade was blocked by duplicate exercise names: ${conflictingNames}. Please contact support.`
                : 'Failed to initialize the database. Please restart the app and try again.'
            }
          />
        </View>
      );
    }

    return this.props.children;
  }
}
