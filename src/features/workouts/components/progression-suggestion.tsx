import { Icon } from '@/src/components/ui/icon';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/components/workout-components.types';
import { useExerciseTrackTab } from '@/src/features/workouts/hooks/use-exercise-track-tab';
import { formatWeightForUnit } from '@/src/lib/utils/weight.utils';
import { iconSizes } from '@/src/theme/sizes';
import { Link } from 'expo-router';
import { ChevronRightIcon, TrendingUpIcon } from 'lucide-react-native';
import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';

interface ProgressionSuggestionProps {
  workoutExerciseId: string;
}

interface ProgressionSuggestionContainerProps {
  item: WorkoutExerciseWithSets;
  historyBeforeStartedAt?: number;
  children: ReactNode;
}

type ProgressionSuggestionContextValue = ReturnType<typeof useExerciseTrackTab>;

const ProgressionSuggestionContext = createContext<
  ProgressionSuggestionContextValue | undefined
>(undefined);

export function useProgressionSuggestionContext() {
  const context = useContext(ProgressionSuggestionContext);

  if (!context) {
    throw new Error(
      'useProgressionSuggestionContext must be used within ProgressionSuggestionContainer'
    );
  }

  return context;
}

export function ProgressionSuggestionSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading progression suggestion"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      className="border-border bg-card mb-5 rounded-lg border p-3"
    >
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />

        <View className="min-w-0 flex-1 gap-1">
          <Skeleton className="h-4 w-32 rounded-sm" />
          <Skeleton className="h-3 w-24 rounded-sm" />
        </View>

        <Skeleton className="h-4 w-16 rounded-sm" />
      </View>
    </View>
  );
}

export function ProgressionSuggestion({
  workoutExerciseId
}: ProgressionSuggestionProps) {
  const { historyPreview, progressionSuggestion: suggestion } =
    useProgressionSuggestionContext();
  const { weightUnit } = useSettings();

  if (!historyPreview) {
    return null;
  }

  const suggestedLabel = suggestion
    ? `${formatWeightForUnit(suggestion.suggestedWeightKg, weightUnit)} ${weightUnit} x ${
        suggestion.suggestedReps
      }`
    : null;

  return (
    <View className="border-border bg-card mb-5 rounded-lg border p-3">
      <View className="flex-row items-center gap-3">
        <View className="bg-primary/10 h-8 w-8 items-center justify-center rounded-lg">
          <Icon as={TrendingUpIcon} tone="primary" size="sm" />
        </View>

        <View className="min-w-0 flex-1">
          <Text variant="small" numberOfLines={1} weight="medium">
            {historyPreview.completedSetSummary}
          </Text>
          {suggestedLabel ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Suggested: {suggestedLabel}
            </Text>
          ) : null}
        </View>

        <Link
          href={{
            pathname: '/(tabs)/workout/exercise/[workoutExerciseId]/history',
            params: { workoutExerciseId }
          }}
          dangerouslySingular
        >
          <View className="flex-row items-center gap-1">
            <Text tone="primary" variant="small" weight="medium">
              History
            </Text>
            <Icon as={ChevronRightIcon} tone="primary" size={iconSizes.sm} />
          </View>
        </Link>
      </View>
    </View>
  );
}

export function ProgressionSuggestionContainer({
  item,
  historyBeforeStartedAt,
  children
}: ProgressionSuggestionContainerProps) {
  const progressionState = useExerciseTrackTab(item, historyBeforeStartedAt);

  return (
    <ProgressionSuggestionContext.Provider value={progressionState}>
      <View className="w-full flex-1">
        {progressionState.isHistoryLoading ? (
          <ProgressionSuggestionSkeleton />
        ) : (
          <ProgressionSuggestion workoutExerciseId={item.workoutExercise.id} />
        )}
        {children}
      </View>
    </ProgressionSuggestionContext.Provider>
  );
}
