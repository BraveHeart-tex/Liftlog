import { StyledFlashList } from '@/src/components/styled/flash-list';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { ExerciseHistoryProgression } from '@/src/features/workouts/active/components/exercise-history-progression';
import type { useExerciseHistory } from '@/src/features/workouts/active/hooks/use-exercise-history';
import { formatExerciseHistorySessionMetadata } from '@/src/features/workouts/active/exercise-history-format.utils';
import {
  formatTrackingValue,
  getSetScore,
  getSetValues,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { cn } from '@/src/lib/utils/cn.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { ChevronDownIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, type TextStyle } from 'react-native';

function formatWorkoutDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(timestamp));
}

const tabularNumericStyle = {
  fontVariant: ['tabular-nums']
} satisfies TextStyle;

type ExerciseHistoryData = ReturnType<typeof useExerciseHistory>;
type ExerciseHistoryEntry = ExerciseHistoryData['history'][number];

interface ExerciseHistoryListProps {
  exerciseId: string;
  history: ExerciseHistoryData['history'];
  latestPersonalRecord: ExerciseHistoryData['latestPersonalRecord'];
  monthlyProgression: ExerciseHistoryData['monthlyProgression'];
  points: ExerciseHistoryData['progressPoints'];
  prSetIds: ExerciseHistoryData['prSetIds'];
  trackingType: TrackingType;
  weightUnit: WeightUnit;
  totalSessions: number;
  isProgressLoading: boolean;
  hasMoreHistory: ExerciseHistoryData['hasMoreHistory'];
  isLoadingMore: ExerciseHistoryData['isLoadingMore'];
  loadMore: ExerciseHistoryData['loadMore'];
  loadMoreError: ExerciseHistoryData['loadMoreError'];
  retryLoadMore: ExerciseHistoryData['retryLoadMore'];
}

function getBestSet(
  sets: ExerciseHistoryEntry['sets'],
  trackingType: TrackingType
) {
  return sets.reduce<ExerciseHistoryEntry['sets'][number] | undefined>(
    (best, set) => {
      if (!best) {
        return set;
      }

      const score = getSetScore(trackingType, set);
      const bestScore = getSetScore(trackingType, best);

      if (score === null) {
        return best;
      }

      return bestScore === null || score > bestScore ? set : best;
    },
    undefined
  );
}

function SessionSets({
  entry,
  prSetIds,
  trackingType,
  weightUnit
}: {
  entry: ExerciseHistoryEntry;
  prSetIds: ReadonlySet<string>;
  trackingType: TrackingType;
  weightUnit: WeightUnit;
}) {
  return (
    <View className="pb-3 pl-1">
      {entry.sets.map((set, index) => {
        const isPr = prSetIds.has(set.id);

        return (
          <View key={set.id} className="h-9 flex-row items-center">
            <Text variant="small" tone="muted" className="w-11">
              {index + 1}
            </Text>
            <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">
              {isPr ? (
                <View className="border-success bg-success/15 rounded-md border px-2 py-1">
                  <Text variant="caption" className="text-success font-medium">
                    PR
                  </Text>
                </View>
              ) : null}
              <Text
                variant="small"
                className="text-foreground font-medium"
                style={tabularNumericStyle}
              >
                {formatTrackingValue(
                  trackingType,
                  getSetValues(set),
                  weightUnit
                )}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ExerciseHistoryList({
  exerciseId,
  history,
  latestPersonalRecord,
  monthlyProgression,
  points,
  prSetIds,
  trackingType,
  weightUnit,
  totalSessions,
  isProgressLoading,
  hasMoreHistory,
  isLoadingMore,
  loadMore,
  loadMoreError,
  retryLoadMore
}: ExerciseHistoryListProps) {
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Set<string>>(
    () => new Set(history.slice(0, 2).map(entry => entry.workout.id))
  );
  const initializedExerciseIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (initializedExerciseIdRef.current === exerciseId) {
      setExpandedWorkoutIds(current => {
        const visibleIds = new Set(history.map(entry => entry.workout.id));
        const next = new Set(
          Array.from(current).filter(workoutId => visibleIds.has(workoutId))
        );

        return next.size === current.size ? current : next;
      });

      return;
    }

    initializedExerciseIdRef.current = exerciseId;
    setExpandedWorkoutIds(
      new Set(history.slice(0, 2).map(entry => entry.workout.id))
    );
  }, [exerciseId, history]);

  const toggleExpanded = useCallback((workoutId: string) => {
    setExpandedWorkoutIds(current => {
      const next = new Set(current);

      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }

      return next;
    });
  }, []);

  const renderHistoryEntry = ({ item }: { item: ExerciseHistoryEntry }) => {
    const isExpanded = expandedWorkoutIds.has(item.workout.id);
    const bestSet = getBestSet(item.sets, trackingType);
    const isBestSetPr = bestSet ? prSetIds.has(bestSet.id) : false;

    return (
      <View className="border-border border-t">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${formatWorkoutDate(item.workout.startedAt)} session`}
          accessibilityState={{ expanded: isExpanded }}
          className="min-h-14 flex-row items-center gap-2 py-3"
          onPress={() => toggleExpanded(item.workout.id)}
        >
          <View className="min-w-0 flex-1">
            <Text variant="bodyMedium" numberOfLines={1}>
              {formatWorkoutDate(item.workout.startedAt)}
            </Text>
            <Text variant="caption" tone="muted" className="mt-0.5">
              {formatExerciseHistorySessionMetadata(
                item.sets,
                trackingType,
                weightUnit
              )}
            </Text>
          </View>
          <View className="max-w-[45%] items-end">
            <Text variant="caption" tone="muted">
              Best set
            </Text>
            <Text
              variant="small"
              className={cn(
                'mt-0.5 text-right font-medium',
                isBestSetPr && 'text-success'
              )}
              numberOfLines={1}
              style={tabularNumericStyle}
            >
              {bestSet
                ? `${formatTrackingValue(
                    trackingType,
                    getSetValues(bestSet),
                    weightUnit
                  )}${isBestSetPr ? ' · PR' : ''}`
                : '—'}
            </Text>
          </View>
          <Icon
            as={ChevronDownIcon}
            size="sm"
            tone="mutedForeground"
            className={cn(isExpanded && 'rotate-180')}
          />
        </Pressable>

        {isExpanded ? (
          <SessionSets
            entry={item}
            prSetIds={prSetIds}
            trackingType={trackingType}
            weightUnit={weightUnit}
          />
        ) : null}
      </View>
    );
  };

  const sessionCount = Math.max(totalSessions, history.length);

  return (
    <StyledFlashList
      data={history}
      extraData={expandedWorkoutIds}
      renderItem={renderHistoryEntry}
      keyExtractor={item => item.workout.id}
      className="flex-1"
      contentContainerClassName="px-4 pb-8"
      ListHeaderComponent={
        <View>
          <ExerciseHistoryProgression
            points={points}
            monthlyProgression={monthlyProgression}
            latestPersonalRecord={latestPersonalRecord}
            trackingType={trackingType}
            weightUnit={weightUnit}
            isLoading={isProgressLoading}
          />
          <View className="mt-8 min-h-11 flex-row items-center justify-between gap-3">
            <Text variant="h3">Sessions</Text>
            <Text variant="caption" tone="muted">
              {sessionCount} {sessionCount === 1 ? 'workout' : 'workouts'}
            </Text>
          </View>
        </View>
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
        <EmptyState className="mt-6 py-4">
          <EmptyState.Title variant="bodyMedium">
            No history yet
          </EmptyState.Title>
          <EmptyState.Description>
            Complete sets to see your history here.
          </EmptyState.Description>
        </EmptyState>
      }
    />
  );
}
