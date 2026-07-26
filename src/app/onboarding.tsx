import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { useOnboardingActions } from '@/src/features/settings/hooks/use-onboarding-actions';
import { cn } from '@/src/lib/utils/cn.utils';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { ArrowRightIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

export default function OnboardingScreen() {
  const [weightUnitPreference, setWeightUnitPreference] =
    useState<WeightUnit>('kg');

  const { getStarted } = useOnboardingActions({
    weightUnitPreference
  });

  return (
    <Screen
      edges={[]}
      contentClassName="justify-between px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <View>
          <Text variant="h1">Welcome to LiftLog</Text>
          <Text variant="small" tone="muted" className="mt-2">
            Set up your profile to get started.
          </Text>
        </View>

        <View className="mt-10 gap-8">
          <View>
            <Text variant="small" className="mb-2">
              Weight unit
            </Text>
            <Text variant="caption" tone="muted" className="mb-3">
              You can change this later in settings.
            </Text>
            <View className="flex-row gap-3">
              {(['kg', 'lb'] as WeightUnit[]).map(unit => (
                <Pressable
                  key={unit}
                  onPress={() => {
                    setWeightUnitPreference(unit);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: weightUnitPreference === unit
                  }}
                  className={cn(
                    weightUnitPreference === unit
                      ? 'bg-primary border-primary'
                      : 'bg-card border-border',
                    'flex-1 items-center rounded-lg border py-4'
                  )}
                >
                  <Text
                    variant="bodyMedium"
                    className={cn(
                      weightUnitPreference === unit
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    )}
                  >
                    {unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      <Button
        className="mt-10"
        rightIcon={<Icon as={ArrowRightIcon} tone="primaryForeground" />}
        containerClassName="w-full"
        onPress={getStarted}
      >
        Get started
      </Button>
    </Screen>
  );
}
