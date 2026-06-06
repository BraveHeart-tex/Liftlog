import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import {
  formatTrackingValue,
  getSetValues,
  type TrackingType
} from '@/src/features/progress/tracking';
import { cn } from '@/src/lib/utils/cn';
import { getDisplaySetGroups } from '@/src/lib/utils/set';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { View } from 'react-native';

interface WorkoutSetSummaryProps {
  completedSets: Set[];
  weightUnit: WeightUnit;
  trackingType?: TrackingType;
  personalRecordSetIds?: ReadonlySet<string>;
  emptyText?: string;
  className?: string;
}

type DisplaySetGroup = ReturnType<typeof getDisplaySetGroups>[number];

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
  className
}: WorkoutSetSummaryProps) {
  const displayGroups = getDisplaySetGroups(
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
          const setLabel =
            group.type === 'range'
              ? `${group.startIndex}-${group.endIndex}`
              : `${group.startIndex}`;

          return (
            <View
              key={group.setIds.join('-')}
              className={cn(
                'flex-row items-center justify-between py-3 pr-2',
                !isLast && 'border-border border-b',
                isLast && 'pb-0'
              )}
            >
              <Text variant="small" tone="muted">
                {setLabel}
              </Text>
              <View className="flex-row items-center gap-2">
                {groupHasPersonalRecord(group, personalRecordSetIds) ? (
                  <PersonalRecordBadge />
                ) : null}
                <Text variant="small" className="text-foreground font-medium">
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
    <View className="border-success bg-success/15 rounded-md border px-1.5 py-0.5">
      <Text variant="caption" className="text-success font-medium">
        PR
      </Text>
    </View>
  );
}
