import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import {
  formatTrackingValue,
  getSetValues,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  formatDisplaySetPosition,
  getDisplaySetGroups,
  type DisplaySetGroup
} from '@/src/features/workouts/shared/set-display.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { View, type TextStyle } from 'react-native';

const tabularNumericStyle = {
  fontVariant: ['tabular-nums']
} satisfies TextStyle;

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
    <View className={className}>
      {displayGroups.length > 0 ? (
        displayGroups.map((group, index) => {
          const isLast = index === displayGroups.length - 1;
          const setLabel = formatDisplaySetPosition(group);

          return (
            <View
              key={group.setIds.join('-')}
              className={cn(
                'flex-row items-center py-2',
                showDividers && !isLast && 'border-border border-b',
                isLast && 'pb-0'
              )}
            >
              <Text
                variant="small"
                tone="muted"
                className="w-12"
                style={tabularNumericStyle}
              >
                {setLabel}
              </Text>
              <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">
                {groupHasPersonalRecord(group, personalRecordSetIds) ? (
                  <PersonalRecordBadge />
                ) : null}
                <Text
                  variant="small"
                  className="text-foreground min-w-0 text-right font-medium"
                  style={tabularNumericStyle}
                >
                  {formatTrackingValue(
                    trackingType,
                    getSetValues(group.set),
                    weightUnit
                  )}
                </Text>
              </View>
            </View>
          );
        })
      ) : emptyText ? (
        <Text variant="small" tone="muted">
          {emptyText}
        </Text>
      ) : null}
    </View>
  );
}

function PersonalRecordBadge() {
  return (
    <View className="border-success bg-success/15 rounded-md border px-2 py-1">
      <Text variant="caption" className="text-success font-medium">
        PR
      </Text>
    </View>
  );
}
