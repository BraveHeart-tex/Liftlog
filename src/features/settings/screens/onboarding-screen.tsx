import { Button } from '@/src/components/ui/button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { useOnboardingActions } from '@/src/features/settings/hooks/use-onboarding-actions';
import { cn } from '@/src/lib/utils/cn.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

const weightUnitOptions: WeightUnit[] = ['kg', 'lb'];

export function OnboardingScreen() {
  const [weightUnitPreference, setWeightUnitPreference] =
    useState<WeightUnit>('kg');

  const { getStarted, isStarting } = useOnboardingActions({
    weightUnitPreference
  });

  return (
    <Screen
      scroll
      contentClassName="justify-center"
      keyboardShouldPersistTaps="handled"
      footer={
        <Button fullWidth disabled={isStarting} onPress={getStarted}>
          Continue to Workout
        </Button>
      }
    >
      <View className="gap-10">
        <View>
          <Text variant="h1">Log workouts without the friction</Text>
          <Text variant="small" tone="muted" className="mt-2">
            No account. Works offline. Stored on this device.
          </Text>
        </View>

        <View>
          <Text variant="small">Choose your units</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            You can change this later in Settings.
          </Text>
          <View
            accessibilityLabel="Weight unit"
            accessibilityRole="radiogroup"
            className="border-border bg-card mt-4 w-56 flex-row rounded-md border p-1"
          >
            {weightUnitOptions.map(unit => {
              const isSelected = weightUnitPreference === unit;

              return (
                <Pressable
                  key={unit}
                  onPress={() => {
                    setWeightUnitPreference(unit);
                  }}
                  accessibilityLabel={unit === 'kg' ? 'Kilograms' : 'Pounds'}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    'min-h-12 flex-1 items-center justify-center rounded-sm px-4',
                    isSelected && 'bg-primary'
                  )}
                >
                  <Text
                    variant="bodyMedium"
                    className={cn(
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    {unit}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}
