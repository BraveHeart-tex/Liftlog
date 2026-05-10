import { StyledFlashList } from '@/src/components/styled/flash-list';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { Exercise } from '@/src/db/schema';
import { useSettings } from '@/src/features/settings/hooks';
import { useExerciseHistoryTab } from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';
import {
  MinusIcon,
  StarIcon,
  TrendingDownIcon,
  TrendingUpIcon
} from 'lucide-react-native';
import { View } from 'react-native';
import { WorkoutSetSummary } from './workout-exercise-summary';

interface ExerciseHistoryTabProps {
  exerciseId: Exercise['id'];
  onVerticalScrollStart?: () => void;
  onVerticalScrollEnd?: () => void;
}

function formatWorkoutDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(timestamp));
}

type ExerciseHistoryEntry = ReturnType<
  typeof useExerciseHistoryTab
>['history'][number];

type LatestPersonalRecord = ReturnType<
  typeof useExerciseHistoryTab
>['latestPersonalRecord'];

type MonthlyProgression = ReturnType<
  typeof useExerciseHistoryTab
>['monthlyProgression'];

function formatSignedWeight(valueKg: number, unit: WeightUnit) {
  const formattedValue = formatWeightForUnit(Math.abs(valueKg), unit);
  const sign = valueKg > 0 ? '+' : valueKg < 0 ? '-' : '';

  return `${sign}${formattedValue} ${unit}`;
}

function getProgressionIcon(deltaKg: number | null) {
  if (deltaKg === null || deltaKg === 0) {
    return MinusIcon;
  }

  return deltaKg > 0 ? TrendingUpIcon : TrendingDownIcon;
}

function getProgressionToneClassName(deltaKg: number | null) {
  if (deltaKg === null || deltaKg === 0) {
    return 'text-progress-same';
  }

  return deltaKg > 0 ? 'text-progress-up' : 'text-progress-down';
}

function ExerciseHistoryWidgets({
  latestPersonalRecord,
  monthlyProgression,
  weightUnit
}: {
  latestPersonalRecord: LatestPersonalRecord;
  monthlyProgression: MonthlyProgression;
  weightUnit: WeightUnit;
}) {
  const progressionDelta = monthlyProgression?.deltaKg ?? null;
  const ProgressionIcon = getProgressionIcon(progressionDelta);
  const progressionToneClassName =
    getProgressionToneClassName(progressionDelta);

  return (
    <View className="pt-4">
      <View className="flex-row gap-3">
        <View className="border-border bg-card min-w-0 flex-1 rounded-lg border px-3 py-3">
          <View className="flex-row items-center gap-2">
            <Icon icon={StarIcon} className="text-warning" size={18} />
            <View className="min-w-0 flex-1">
              <Text variant="bodyMedium" numberOfLines={1}>
                {latestPersonalRecord
                  ? `${formatWeightForUnit(
                      latestPersonalRecord.weightKg,
                      weightUnit
                    )} ${weightUnit} × ${latestPersonalRecord.reps}`
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
              size={18}
            />
            <View className="min-w-0 flex-1">
              <Text
                variant="bodyMedium"
                numberOfLines={1}
                className={cn(monthlyProgression && progressionToneClassName)}
              >
                {monthlyProgression
                  ? `${formatSignedWeight(
                      monthlyProgression.deltaKg,
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

export function ExerciseHistoryTab({
  exerciseId,
  onVerticalScrollStart,
  onVerticalScrollEnd
}: ExerciseHistoryTabProps) {
  const { weightUnit } = useSettings();
  const { history, latestPersonalRecord, monthlyProgression, prSetIds } =
    useExerciseHistoryTab(exerciseId);

  const renderHistoryEntry = ({ item }: { item: ExerciseHistoryEntry }) => (
    <View className="border-border bg-card mt-4 rounded-lg border p-4">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <Text variant="h3" className="flex-1">
          {formatWorkoutDate(item.workout.startedAt)}
        </Text>
        <Text variant="small" tone="muted">
          {item.sets.length} sets
        </Text>
      </View>

      <WorkoutSetSummary
        completedSets={item.sets}
        weightUnit={weightUnit}
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
            weightUnit={weightUnit}
          />
        ) : null
      }
      directionalLockEnabled={true}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
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
      onScrollBeginDrag={onVerticalScrollStart}
      onScrollEndDrag={onVerticalScrollEnd}
      onMomentumScrollEnd={onVerticalScrollEnd}
    />
  );
}
