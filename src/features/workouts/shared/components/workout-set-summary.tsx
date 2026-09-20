import type { Set } from '@/src/db';
import {
  formatTrackingValue,
  getSetValues,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { WorkoutSetSummaryContent } from '@/src/features/workouts/shared/components/workout-exercise-summary-content';
import {
  formatDisplaySetPosition,
  getDisplaySetGroups,
  type DisplaySetGroup
} from '@/src/features/workouts/shared/set-display.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';

interface WorkoutSetSummaryProps {
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType?: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
  emptyText?: string;
  className?: string;
  showDividers?: boolean;
  displayGroups?: DisplaySetGroup[];
}

function groupHasPersonalRecord(
  group: DisplaySetGroup,
  personalRecordSetIds?: ReadonlySet<string>
) {
  if (!personalRecordSetIds) {
    return false;
  }

  return group.setIds.some(setId => personalRecordSetIds.has(setId));
}

export function WorkoutSetSummary({
  completedSets,
  weightUnit,
  trackingType = 'weight_reps',
  personalRecordSetIds,
  emptyText,
  className,
  showDividers = true,
  displayGroups: providedDisplayGroups
}: WorkoutSetSummaryProps) {
  const displayGroups =
    providedDisplayGroups ??
    getDisplaySetGroups(
      completedSets,
      {
        personalRecordSetIds
      },
      trackingType
    );

  return (
    <WorkoutSetSummaryContent
      rows={displayGroups.map(group => ({
        id: group.setIds.join('-'),
        positionLabel: formatDisplaySetPosition(group),
        valueLabel: formatTrackingValue(
          trackingType,
          getSetValues(group.set),
          weightUnit
        ),
        isPersonalRecord: groupHasPersonalRecord(group, personalRecordSetIds)
      }))}
      emptyText={emptyText}
      className={className}
      showDividers={showDividers}
    />
  );
}
