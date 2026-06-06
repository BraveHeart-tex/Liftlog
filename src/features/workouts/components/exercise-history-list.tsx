import { StyledFlashList } from '@/src/components/styled/flash-list';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  formatPersonalRecordValue,
  formatScore,
  type TrackingType
} from '@/src/features/progress/tracking';
import type { useExerciseHistory } from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import type { WeightUnit } from '@/src/lib/utils/weight';
import {
  MinusIcon,
  StarIcon,
  TrendingDownIcon,
  TrendingUpIcon
} from 'lucide-react-native';
import { View } from 'react-native';
import { WorkoutSetSummary } from './workout-set-summary';

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
}

function formatSignedScore(
  trackingType: TrackingType,
  value: number,
  unit: WeightUnit
) {
  const formattedValue = formatScore(trackingType, Math.abs(value), unit);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';

  return `${sign}${formattedValue}`;
}

function getProgressionIcon(delta: number | null) {
  if (delta === null || delta === 0) {
    return MinusIcon;
  }

  return delta > 0 ? TrendingUpIcon : TrendingDownIcon;
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
}: Omit<ExerciseHistoryListProps, 'history' | 'prSetIds'>) {
  const progressionDelta = monthlyProgression?.delta ?? null;
  const ProgressionIcon = getProgressionIcon(progressionDelta);
  const progressionToneClassName =
    getProgressionToneClassName(progressionDelta);

  return (
    <View className="pt-4">
      <View className="flex-row gap-3">
        <View className="border-border bg-card min-w-0 flex-1 rounded-lg border px-3 py-3">
          <View className="flex-row items-center gap-2">
            <Icon icon={StarIcon} className="text-warning" size="md" />
            <View className="min-w-0 flex-1">
              <Text variant="bodyMedium" numberOfLines={1}>
                {latestPersonalRecord
                  ? formatPersonalRecordValue(latestPersonalRecord, weightUnit)
                  : 'No PR yet'}
              </Text>
              <Text variant="caption" tone="muted" className="mt-1">
                Latest PR
              </Text>
            </View>
          </View>
        </View>

        <View className="border-border bg-card min-w-0 flex-1 rounded-lg border px-3 py-3">
          <View className="flex-row items-center gap-2">
            <Icon
              icon={ProgressionIcon}
              className={progressionToneClassName}
              size="md"
            />
            <View className="min-w-0 flex-1">
              <Text
                variant="bodyMedium"
                numberOfLines={1}
                className={cn(monthlyProgression && progressionToneClassName)}
              >
                {monthlyProgression
                  ? `${formatSignedScore(
                      trackingType,
                      monthlyProgression.delta,
                      weightUnit
                    )} from last month`
                  : 'No last month data'}
              </Text>
              <Text variant="caption" tone="muted" className="mt-1">
                Progression
              </Text>
            </View>
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
  weightUnit
}: ExerciseHistoryListProps) {
  const renderHistoryEntry = ({ item }: { item: ExerciseHistoryEntry }) => (
    <View className="border-border bg-card mt-4 rounded-lg border p-4">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <Text variant="body" className="flex-1">
          {formatWorkoutDate(item.workout.startedAt)}
        </Text>
        <Text variant="small" tone="muted">
          {item.sets.length} sets
        </Text>
      </View>

      <WorkoutSetSummary
        completedSets={item.sets}
        weightUnit={weightUnit}
        trackingType={trackingType}
        personalRecordSetIds={prSetIds}
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
      ListEmptyComponent={
        <View className="mt-6 items-center">
          <Text variant="h3" className="text-center">
            No history yet
          </Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            Complete sets to see your history here.
          </Text>
        </View>
      }
    />
  );
}
