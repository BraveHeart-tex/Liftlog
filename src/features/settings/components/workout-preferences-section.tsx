import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { Text } from '@/src/components/ui/text';
import { RestTimerSettingSheet } from '@/src/features/settings/components/rest-timer-setting-sheet';
import { useSettings } from '@/src/features/settings/hooks';
import type { WeightUnit } from '@/src/lib/utils/weight';
import { iconSizes } from '@/src/theme/sizes';
import { ChevronDown } from 'lucide-react-native';
import { useCallback, useState } from 'react';

import { View } from 'react-native';

const WEIGHT_UNIT_OPTIONS: {
  label: string;
  value: WeightUnit;
}[] = [
  { label: 'kg', value: 'kg' },
  { label: 'lb', value: 'lb' }
];

export const WorkoutPreferencesSection = () => {
  const [isTimerSheetOpen, setIsTimerSheetOpen] = useState(false);
  const { weightUnit, formattedRestTimerDuration, setWeightUnit } =
    useSettings();
  const openTimerSheet = useCallback(() => setIsTimerSheetOpen(true), []);
  const closeTimerSheet = useCallback(() => setIsTimerSheetOpen(false), []);

  return (
    <>
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
                indicatorClassName="bg-card"
              />
            </View>
            <View className="border-border flex-row items-center justify-between border-t pt-4">
              <Text variant="bodyMedium" className="flex-1">
                Default Rest Timer
              </Text>
              <View className="ml-4 flex-row items-center gap-2">
                <Button
                  variant="secondary"
                  onPress={openTimerSheet}
                  rightIcon={
                    <Icon
                      as={ChevronDown}
                      size={iconSizes.sm}
                      tone="secondaryForeground"
                    />
                  }
                  textClassName="text-small"
                >
                  {formattedRestTimerDuration}
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
      <RestTimerSettingSheet
        isOpen={isTimerSheetOpen}
        onClose={closeTimerSheet}
      />
    </>
  );
};
