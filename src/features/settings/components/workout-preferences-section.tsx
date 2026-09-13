import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import { RestTimerSettingSheet } from '@/src/features/settings/components/rest-timer-setting-sheet';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import { useRestTimerNotificationPreference } from '@/src/features/settings/hooks/use-rest-timer-notification-preference';
import { Switch } from '@/src/components/ui/switch';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { iconSizes } from '@/src/theme/sizes';
import { ChevronDown, ExternalLink } from 'lucide-react-native';
import { useCallback, useState } from 'react';

import { Platform, View } from 'react-native';

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
  const notificationPreference = useRestTimerNotificationPreference();
  const openTimerSheet = useCallback(() => setIsTimerSheetOpen(true), []);
  const closeTimerSheet = useCallback(() => setIsTimerSheetOpen(false), []);
  const handleWeightUnitChange = useCallback(
    (nextUnit: WeightUnit) => {
      try {
        setWeightUnit(nextUnit);
      } catch (error) {
        console.error('Failed to save weight unit', error);
        showSnackbar({
          message: 'Could not save weight unit. Please try again.',
          variant: 'danger'
        });
      }
    },
    [setWeightUnit]
  );

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
                onChange={handleWeightUnitChange}
                accessibilityMode="radioGroup"
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
            {Platform.OS === 'android' ? (
              <View className="border-border border-t pt-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text variant="bodyMedium">Rest timer notifications</Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      {notificationPreference.state}
                      {notificationPreference.timingMayBeDelayed
                        ? ' - Timing may be delayed'
                        : ''}
                    </Text>
                  </View>
                  <Switch
                    checked={notificationPreference.enabled}
                    disabled={notificationPreference.state === 'Enabling'}
                    onCheckedChange={value => {
                      void notificationPreference.setEnabled(value);
                    }}
                  />
                </View>
                {notificationPreference.state === 'Blocked' ? (
                  <Button
                    variant="secondary"
                    className="mt-3"
                    textClassName="text-small text-primary"
                    rightIcon={
                      <Icon
                        as={ExternalLink}
                        tone="primary"
                        size={iconSizes.sm}
                      />
                    }
                    onPress={() =>
                      void notificationPreference.openNotificationSettings()
                    }
                  >
                    Open notification settings
                  </Button>
                ) : null}
                {notificationPreference.timingMayBeDelayed ? (
                  <Button
                    variant="secondary"
                    className="mt-3"
                    textClassName="text-small text-primary"
                    onPress={notificationPreference.openExactAlarmSettings}
                  >
                    Open Alarms and reminders
                  </Button>
                ) : null}
              </View>
            ) : null}
          </CardContent>
        </Card>
      </View>
      {isTimerSheetOpen ? (
        <RestTimerSettingSheet isOpen onClose={closeTimerSheet} />
      ) : null}
    </>
  );
};
