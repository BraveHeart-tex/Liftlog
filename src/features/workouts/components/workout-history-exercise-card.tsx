import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import { getDisplaySetGroups } from '@/src/lib/utils/set';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';
import { View } from 'react-native';

interface WorkoutHistoryExerciseCardProps {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
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

export const WorkoutHistoryExerciseCard = ({
  exerciseName,
  completedSets,
  weightUnit
}: WorkoutHistoryExerciseCardProps) => {
  const displayGroups = getDisplaySetGroups(completedSets);
  const renderItems = toRenderItems(displayGroups);
  const exerciseVolume = completedSets.reduce(
    (sum, set) => sum + set.weightKg * set.reps,
    0
  );

  return (
    <Card className="mt-3">
      <CardContent className="gap-3">
        <View>
          <Text variant="h3">{exerciseName}</Text>
          <Text variant="small" tone="muted" className="mt-0.5">
            {completedSets.length} sets ·{' '}
            {formatWeightForUnit(exerciseVolume, weightUnit, {
              useGrouping: true,
              maximumFractionDigits: 0
            })}{' '}
            {weightUnit}
          </Text>
        </View>

        <View className="gap-2">
          {renderItems.map(item => {
            if (item.kind === 'range') {
              return (
                <RangeSetRow
                  key={item.group.setIds.join('-')}
                  group={item.group}
                  weightUnit={weightUnit}
                />
              );
            }

            return (
              <View key={item.left.setIds[0]} className="flex-row gap-2">
                <SingleSetPill
                  group={item.left}
                  weightUnit={weightUnit}
                  style={{ flex: 1 }}
                />
                {item.right ? (
                  <SingleSetPill
                    group={item.right}
                    weightUnit={weightUnit}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
};

function SetBadge({ index }: { index: number }) {
  return (
    <View className="bg-secondary mr-2.5 h-6 w-6 shrink-0 items-center justify-center rounded-full">
      <Text variant="caption" className="text-secondary-foreground">
        {index}
      </Text>
    </View>
  );
}

function SingleSetPill({
  group,
  weightUnit,
  style
}: {
  group: DisplaySetGroup;
  weightUnit: WeightUnit;
  style?: object;
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
      <Text variant="small" tone="muted" className="mr-1.5 ml-0.5">
        {weightUnit}
      </Text>
      <Text variant="small" tone="muted" className="mr-1">
        x
      </Text>
      <Text variant="small" className="text-foreground font-medium">
        {group.reps}
      </Text>
    </View>
  );
}

function RangeSetRow({
  group,
  weightUnit
}: {
  group: DisplaySetGroup;
  weightUnit: WeightUnit;
}) {
  return (
    <View className="bg-muted flex-row items-center justify-between rounded-xl px-3 py-2.5">
      <Text variant="small" tone="muted">
        Sets {group.startIndex}-{group.endIndex}
      </Text>
      <View className="flex-row items-center gap-1">
        <Text variant="small" className="text-foreground font-medium">
          {formatWeightForUnit(group.weightKg, weightUnit)} {weightUnit}
        </Text>
        <Text variant="small" tone="muted">
          x {group.reps} each
        </Text>
      </View>
    </View>
  );
}
