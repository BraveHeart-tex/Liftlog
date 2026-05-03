import { Card, CardContent } from '@/src/components/ui/card';
import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db';
import { formatWeightForUnit, type WeightUnit } from '@/src/lib/utils/weight';
import { View } from 'react-native';

interface WorkoutHistoryExerciseCardProps {
  exerciseName: string;
  completedSets: Set[];
  weightUnit: WeightUnit;
}

export const WorkoutHistoryExerciseCard = ({
  exerciseName,
  completedSets,
  weightUnit
}: WorkoutHistoryExerciseCardProps) => {
  return (
    <Card className="mt-3">
      <CardContent>
        <Text variant="bodyMedium">{exerciseName}</Text>

        {completedSets.length === 0 ? (
          <Text variant="small" tone="muted" className="mt-2">
            No sets logged
          </Text>
        ) : (
          <View className="mt-3">
            {completedSets.map((set, index) => (
              <View key={set.id} className="flex-row items-center gap-3 py-1">
                <Text variant="caption" tone="muted" className="w-6">
                  {index + 1}
                </Text>
                <Text variant="caption">
                  {formatWeightForUnit(set.weightKg, weightUnit)} {weightUnit}
                </Text>
                <Text variant="caption" tone="muted">
                  x
                </Text>
                <Text variant="caption">{set.reps} reps</Text>
              </View>
            ))}
          </View>
        )}
      </CardContent>
    </Card>
  );
};
