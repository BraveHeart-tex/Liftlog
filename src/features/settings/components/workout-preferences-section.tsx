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
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import type { WeightUnit } from '@/src/lib/utils/weight.utils';
import { iconSizes } from '@/src/theme/sizes';
import { ChevronDown, ExternalLink } from 'lucide-react-native';
import { useCallback, useState } from 'react';

import { Platform, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated';

const notificationActionEntering = FadeIn.duration(MOTION_DURATION_MS.standard);
const notificationActionExiting = FadeOut.duration(MOTION_DURATION_MS.exit);
const notificationLayout = LinearTransition.duration(
  MOTION_DURATION_MS.standard
);
const AnimatedCard = Animated.createAnimatedComponent(Card);

const WEIGHT_UNIT_OPTIONS: {
  label: string;
  value: WeightUnit;
}[] = [
  { label: 'kg', value: 'kg' },
  { label: 'lb', value: 'lb' }
];

export const WorkoutPreferencesSection = () => {
  const reduceMotion = useReducedMotion();
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
        <AnimatedCard layout={reduceMotion ? undefined : notificationLayout}>
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
              <Animated.View
                className="border-border border-t pt-4"
                layout={reduceMotion ? undefined : notificationLayout}
              >
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
                    disabled={notificationPreference.isEnabling}
                    onCheckedChange={value => {
                      void notificationPreference.setEnabled(value);
                    }}
                  />
                </View>
                {notificationPreference.state === 'Blocked' ||
                notificationPreference.state === 'On' ? (
                  <Animated.View
                    className="mt-3"
                    entering={
                      reduceMotion ? undefined : notificationActionEntering
                    }
                    exiting={
                      reduceMotion ? undefined : notificationActionExiting
                    }
                    layout={reduceMotion ? undefined : notificationLayout}
                  >
                    <Button
                      variant="secondary"
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
                      {notificationPreference.state === 'On'
                        ? 'Rest timer notification settings'
                        : 'Open notification settings'}
                    </Button>
                  </Animated.View>
                ) : null}
                {notificationPreference.timingMayBeDelayed ? (
                  <Animated.View
                    className="mt-3"
                    entering={
                      reduceMotion ? undefined : notificationActionEntering
                    }
                    exiting={
                      reduceMotion ? undefined : notificationActionExiting
                    }
                    layout={reduceMotion ? undefined : notificationLayout}
                  >
                    <Button
                      variant="secondary"
                      textClassName="text-small text-primary"
                      onPress={notificationPreference.openExactAlarmSettings}
                    >
                      Open Alarms and reminders
                    </Button>
                  </Animated.View>
                ) : null}
              </Animated.View>
            ) : null}
          </CardContent>
        </AnimatedCard>
      </View>
      {isTimerSheetOpen ? (
        <RestTimerSettingSheet isOpen onClose={closeTimerSheet} />
      ) : null}
    </>
  );
};
