import { StyledFlashList } from '@/src/components/styled/flash-list';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Text } from '@/src/components/ui/text';
import {
  formatPersonalRecordValue,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import {
  formatExerciseHistorySessionMetadata,
  formatRollingProgression
} from '@/src/features/workouts/exercise-history-format.utils';
import { WorkoutSetSummary } from '@/src/features/workouts/components/workout-set-summary';
import type { useExerciseHistory } from '@/src/features/workouts/hooks/use-exercise-history';
import { cn } from '@/src/lib/utils/cn.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { View } from 'react-native';

function formatWorkoutDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(timestamp));
}

type ExerciseHistoryData = ReturnType<typeof useExerciseHistory>;

type ExerciseHistoryEntry = ExerciseHistoryData['history'][number];

interface ExerciseHistoryListProps {
  history: ExerciseHistoryData['history'];
  latestPersonalRecord: ExerciseHistoryData['latestPersonalRecord'];
  monthlyProgression: ExerciseHistoryData['monthlyProgression'];
  prSetIds: ExerciseHistoryData['prSetIds'];
  trackingType: TrackingType;
  weightUnit: WeightUnit;
  hasMoreHistory: ExerciseHistoryData['hasMoreHistory'];
  isLoadingMore: ExerciseHistoryData['isLoadingMore'];
  loadMore: ExerciseHistoryData['loadMore'];
  loadMoreError: ExerciseHistoryData['loadMoreError'];
  retryLoadMore: ExerciseHistoryData['retryLoadMore'];
}

function getProgressionToneClassName(delta: number | null) {
  if (delta === null || delta === 0) {
    return 'text-progress-same';
  }

  return delta > 0 ? 'text-progress-up' : 'text-progress-down';
}

function ExerciseHistoryWidgets({
  latestPersonalRecord,
  monthlyProgression,
  trackingType,
  weightUnit
}: Pick<
  ExerciseHistoryListProps,
  'latestPersonalRecord' | 'monthlyProgression' | 'trackingType' | 'weightUnit'
>) {
  const progressionDelta = monthlyProgression?.delta ?? null;
  const progressionToneClassName =
    getProgressionToneClassName(progressionDelta);

  return (
    <View className="pt-3 pb-1">
      <View className="border-border bg-card rounded-lg border px-3">
        <View className="flex-row items-start gap-3 py-2">
          <Text variant="caption" tone="muted" className="w-20">
            Latest PR
          </Text>
          <View className="min-w-0 flex-1">
            {latestPersonalRecord ? (
              <Text
                variant="small"
                className={cn(
                  'min-w-0 flex-1',
                  latestPersonalRecord && 'text-success'
                )}
              >
                {formatPersonalRecordValue(latestPersonalRecord, weightUnit)}
              </Text>
            ) : (
              <EmptyState
                kind="insufficient-data"
                layout="inline"
                title="No PR yet"
                className="justify-start px-0 py-0"
              />
            )}
          </View>
        </View>

        <View className="border-border flex-row items-start gap-3 border-t py-2">
          <Text variant="caption" tone="muted" className="w-20">
            Progression
          </Text>
          <View className="min-w-0 flex-1">
            {monthlyProgression ? (
              <Text
                variant="small"
                className={cn('min-w-0 flex-1', progressionToneClassName)}
              >
                {formatRollingProgression(
                  trackingType,
                  monthlyProgression.delta,
                  weightUnit
                )}
              </Text>
            ) : (
              <EmptyState
                kind="insufficient-data"
                layout="inline"
                title="No prior 30-day data"
                className="justify-start px-0 py-0"
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export function ExerciseHistoryList({
  history,
  latestPersonalRecord,
  monthlyProgression,
  prSetIds,
  trackingType,
  weightUnit,
  hasMoreHistory,
  isLoadingMore,
  loadMore,
  loadMoreError,
  retryLoadMore
}: ExerciseHistoryListProps) {
  const renderHistoryEntry = ({ item }: { item: ExerciseHistoryEntry }) => (
    <View className="border-border border-b py-3">
      <View className="mb-1 flex-row items-start justify-between gap-3">
        <Text variant="bodyMedium" className="min-w-0 flex-1">
          {formatWorkoutDate(item.workout.startedAt)}
        </Text>
        <Text
          variant="small"
          tone="muted"
          className="min-w-0 flex-shrink text-right"
        >
          {formatExerciseHistorySessionMetadata(
            item.sets,
            trackingType,
            weightUnit
          )}
        </Text>
      </View>

      <WorkoutSetSummary
        completedSets={item.sets}
        weightUnit={weightUnit}
        trackingType={trackingType}
        personalRecordSetIds={prSetIds}
        showDividers={false}
      />
    </View>
  );

  return (
    <StyledFlashList
      data={history}
      renderItem={renderHistoryEntry}
      keyExtractor={item => item.workout.id}
      className="flex-1"
      contentContainerClassName="px-4 pb-8"
      ListHeaderComponent={
        history.length > 0 ? (
          <ExerciseHistoryWidgets
            latestPersonalRecord={latestPersonalRecord}
            monthlyProgression={monthlyProgression}
            trackingType={trackingType}
            weightUnit={weightUnit}
          />
        ) : null
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onEndReached={hasMoreHistory ? loadMore : undefined}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isLoadingMore ? (
          <Button
            variant="ghost"
            loading
            disabled
            className="mt-4"
            accessibilityLabel="Loading more exercise history"
          >
            Loading more
          </Button>
        ) : loadMoreError ? (
          <Button variant="ghost" className="mt-4" onPress={retryLoadMore}>
            Retry loading history
          </Button>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          kind="empty"
          layout="section"
          title="No history yet"
          description="Complete sets to see your history here."
          className="mt-6"
        />
      }
    />
  );
}
