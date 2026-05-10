import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import { cn } from '@/src/lib/utils/cn';
import { getDisplaySetGroups } from '@/src/lib/utils/set';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';
import { View, type StyleProp, type ViewStyle } from 'react-native';

interface WorkoutExerciseSummaryProps {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
  personalRecordSetIds?: ReadonlySet<string>;
  emptyText?: string;
  className?: string;
}

interface WorkoutSetSummaryProps {
  completedSets: Set[];
  weightUnit: WeightUnit;
  personalRecordSetIds?: ReadonlySet<string>;
  emptyText?: string;
  className?: string;
}

type DisplaySetGroup = ReturnType<typeof getDisplaySetGroups>[number];

type RenderItem =
  | { kind: 'pair'; left: DisplaySetGroup; right?: DisplaySetGroup }
  | { kind: 'range'; group: DisplaySetGroup };

function toRenderItems(groups: DisplaySetGroup[]): RenderItem[] {
  const items: RenderItem[] = [];
  let i = 0;

  while (i < groups.length) {
    const cur = groups[i];

    if (cur.type === 'range') {
      items.push({ kind: 'range', group: cur });
      i++;
    } else {
      const next = groups[i + 1];

      if (next?.type === 'single') {
        items.push({ kind: 'pair', left: cur, right: next });
        i += 2;
      } else {
        items.push({ kind: 'pair', left: cur });
        i++;
      }
    }
  }

  return items;
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

export function WorkoutExerciseSummary({
  exerciseName,
  completedSets,
  weightUnit,
  personalRecordSetIds,
  emptyText,
  className
}: WorkoutExerciseSummaryProps) {
  const exerciseVolume = completedSets.reduce(
    (sum, set) => sum + set.weightKg * set.reps,
    0
  );

  return (
    <View className={cn('gap-3', className)}>
      <View>
        <Text variant="h3">{exerciseName}</Text>
        {completedSets.length > 0 ? (
          <Text variant="small" tone="muted" className="mt-0.5">
            {completedSets.length} sets ·{' '}
            {formatWeightForUnit(exerciseVolume, weightUnit, {
              useGrouping: true,
              maximumFractionDigits: 0
            })}{' '}
            {weightUnit}
          </Text>
        ) : null}
      </View>

      <WorkoutSetSummary
        completedSets={completedSets}
        weightUnit={weightUnit}
        personalRecordSetIds={personalRecordSetIds}
        emptyText={emptyText}
      />
    </View>
  );
}

export function WorkoutSetSummary({
  completedSets,
  weightUnit,
  personalRecordSetIds,
  emptyText,
  className
}: WorkoutSetSummaryProps) {
  const displayGroups = getDisplaySetGroups(completedSets, {
    personalRecordSetIds
  });
  const renderItems = toRenderItems(displayGroups);

  return (
    <View className={cn('gap-2', className)}>
      {renderItems.length > 0 ? (
        renderItems.map(item => {
          if (item.kind === 'range') {
            return (
              <RangeSetRow
                key={item.group.setIds.join('-')}
                group={item.group}
                weightUnit={weightUnit}
                hasPersonalRecord={groupHasPersonalRecord(
                  item.group,
                  personalRecordSetIds
                )}
              />
            );
          }

          return (
            <View key={item.left.setIds[0]} className="flex-row gap-2">
              <SingleSetPill
                group={item.left}
                weightUnit={weightUnit}
                hasPersonalRecord={groupHasPersonalRecord(
                  item.left,
                  personalRecordSetIds
                )}
                style={{ flex: 1 }}
              />
              {item.right ? (
                <SingleSetPill
                  group={item.right}
                  weightUnit={weightUnit}
                  hasPersonalRecord={groupHasPersonalRecord(
                    item.right,
                    personalRecordSetIds
                  )}
                  style={{ flex: 1 }}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )}
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

function SetBadge({ index }: { index: number }) {
  return (
    <View className="bg-secondary dark:bg-primary/20 mr-2.5 h-6 w-6 shrink-0 items-center justify-center rounded-full">
      <Text
        variant="caption"
        className="text-secondary-foreground dark:text-primary-foreground"
      >
        {index}
      </Text>
    </View>
  );
}

function SingleSetPill({
  group,
  weightUnit,
  hasPersonalRecord,
  style
}: {
  group: DisplaySetGroup;
  weightUnit: WeightUnit;
  hasPersonalRecord?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className="bg-muted flex-row items-center rounded-xl px-2.5 py-2"
      style={style}
    >
      <SetBadge index={group.startIndex} />
      <Text variant="small" className="text-foreground font-medium">
        {formatWeightForUnit(group.weightKg, weightUnit)}
      </Text>
      <Text variant="small" className="mr-1.5 ml-0.5">
        {weightUnit}
      </Text>
      <Text variant="small" tone="muted" className="mr-1">
        ×
      </Text>
      <Text variant="small" className="text-foreground font-medium">
        {group.reps}
      </Text>
      {hasPersonalRecord ? (
        <View className="ml-auto">
          <PersonalRecordBadge />
        </View>
      ) : null}
    </View>
  );
}

function RangeSetRow({
  group,
  weightUnit,
  hasPersonalRecord
}: {
  group: DisplaySetGroup;
  weightUnit: WeightUnit;
  hasPersonalRecord?: boolean;
}) {
  return (
    <View className="bg-muted flex-row items-center justify-between rounded-xl px-3 py-2.5">
      <Text variant="small" tone="muted">
        Sets {group.startIndex}-{group.endIndex}
      </Text>
      <View className="flex-row items-center gap-1">
        {hasPersonalRecord ? <PersonalRecordBadge /> : null}
        <Text variant="small" className="text-foreground font-medium">
          {formatWeightForUnit(group.weightKg, weightUnit)} {weightUnit}
        </Text>
        <Text variant="small">
          × {group.reps} rep{group.reps > 1 && 's'}
        </Text>
      </View>
    </View>
  );
}
