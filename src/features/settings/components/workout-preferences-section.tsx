import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks';
import type { WeightUnit } from '@/src/lib/utils/weight';

import { View } from 'react-native';

const WEIGHT_UNIT_OPTIONS: {
  label: string;
  value: WeightUnit;
}[] = [
  { label: 'kg', value: 'kg' },
  { label: 'lb', value: 'lb' }
];

export const WorkoutPreferencesSection = () => {
  const { weightUnit, restTimerDuration, setWeightUnit, setRestTimerDuration } =
    useSettings();

  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        Workout Preferences
      </Text>
      <Card>
        <CardContent className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text variant="bodyMedium" className="flex-1">
              Weight unit
            </Text>
            <SegmentedControl
              value={weightUnit}
              options={WEIGHT_UNIT_OPTIONS}
              onChange={setWeightUnit}
              className="bg-muted ml-4 w-32"
              indicatorClassName="bg-card!"
            />
          </View>
          <View className="border-border flex-row items-center justify-between border-t pt-4">
            <Text variant="bodyMedium" className="flex-1">
              Default Rest Timer
            </Text>
            <View className="ml-4 flex-row items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                disabled={restTimerDuration <= 10}
                onPress={() =>
                  setRestTimerDuration(Math.max(10, restTimerDuration - 10))
                }
              >
                <Text variant="h3">−</Text>
              </Button>
              <Text variant="bodyMedium" className="w-12 text-center">
                {restTimerDuration}s
              </Text>
              <Button
                variant="secondary"
                size="icon"
                disabled={restTimerDuration >= 3600}
                onPress={() =>
                  setRestTimerDuration(Math.min(3600, restTimerDuration + 10))
                }
              >
                <Text variant="h3">+</Text>
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};
