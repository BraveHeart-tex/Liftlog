import type { Set } from '@/src/db';
import {
  formatTrackingValue,
  getSetValues,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import {
  formatDisplaySetPosition,
  getDisplaySetGroups,
  getWeightRepsVolume
} from '@/src/features/workouts/shared/set-display.utils';
import {
  formatWeightForUnit,
  type WeightUnit
} from '@/src/lib/utils/weight.utils';

export interface WorkoutSetSummaryUiModel {
  id: string;
  positionLabel: string;
  valueLabel: string;
  isPersonalRecord?: boolean;
}

export interface WorkoutExerciseSummaryUiModel {
  exerciseName: string;
  setCountLabel?: string;
  latestSetLabel?: string;
  volumeLabel?: string;
  setRows: WorkoutSetSummaryUiModel[];
}

interface MapWorkoutExerciseSummaryOptions {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
}

export function mapWorkoutExerciseSummary({
  exerciseName,
  completedSets,
  weightUnit,
  trackingType,
  personalRecordSetIds
}: MapWorkoutExerciseSummaryOptions): WorkoutExerciseSummaryUiModel {
  const displayGroups = getDisplaySetGroups(
    completedSets,
    { personalRecordSetIds },
    trackingType
  );
  const latestSet = completedSets.at(-1);

  return {
    exerciseName,
    setCountLabel:
      completedSets.length > 0
        ? `${completedSets.length} ${completedSets.length === 1 ? 'set' : 'sets'}`
        : undefined,
    latestSetLabel: latestSet
      ? formatTrackingValue(trackingType, getSetValues(latestSet), weightUnit)
      : undefined,
    volumeLabel:
      completedSets.length > 0 && trackingType === 'weight_reps'
        ? `${formatWeightForUnit(
            getWeightRepsVolume(completedSets),
            weightUnit,
            {
              useGrouping: true,
              maximumFractionDigits: 0
            }
          )} ${weightUnit} total`
        : undefined,
    setRows:
      displayGroups.length > 1
        ? displayGroups.map(group => {
            const isPersonalRecord = group.setIds.some(
              setId => personalRecordSetIds?.has(setId) ?? false
            );

            return {
              id: group.setIds.join('-'),
              positionLabel: formatDisplaySetPosition(group),
              valueLabel: formatTrackingValue(
                trackingType,
                getSetValues(group.set),
                weightUnit
              ),
              ...(isPersonalRecord ? { isPersonalRecord: true } : {})
            };
          })
        : []
  };
}
