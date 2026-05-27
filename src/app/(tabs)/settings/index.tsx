import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Screen } from '@/src/components/ui/screen';
import { Switch } from '@/src/components/ui/switch';
import { Text } from '@/src/components/ui/text';
import { ThemeOptionCard } from '@/src/features/settings/components/theme-option-card';
import {
  SETTINGS_DEFAULTS,
  useSettings,
  type ThemePreference
} from '@/src/features/settings/hooks';
import { openStepHealthConnectSettings } from '@/src/features/steps/health-connect';
import {
  requestStepNotificationPermission,
  stopStepNotification
} from '@/src/features/steps/notifications';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import Constants from 'expo-constants';
import { Alert, Platform, View } from 'react-native';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  description: string;
}[] = [
  {
    value: 'system',
    label: 'System',
    description: 'Match your device'
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Bright interface'
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dim interface'
  }
];

export default function SettingsScreen() {
  const {
    weightUnit,
    restTimerDuration,
    themePreference,
    healthConnectStepsEnabled,
    stepsNotificationEnabled,
    stepGoal,
    setWeightUnit,
    setRestTimerDuration,
    setThemePreference,
    setHealthConnectStepsEnabled,
    setStepsNotificationEnabled,
    setStepGoal
  } = useSettings();
  const { colors } = useAppTheme();
  const shouldShowStepsSettings = Platform.OS === 'android';

  const switchColors = {
    track: {
      false: colors.border,
      true: colors.primary
    },
    thumb: colors.primaryForeground
  };

  const handleStepsNotificationChange = async (isEnabled: boolean) => {
    if (!isEnabled) {
      setStepsNotificationEnabled(false);
      await stopStepNotification();

      return;
    }

    const isGranted = await requestStepNotificationPermission();

    if (!isGranted) {
      Alert.alert(
        'Step tracking permissions needed',
        "Allow notifications and activity recognition to keep today's steps visible."
      );

      return;
    }

    setStepsNotificationEnabled(true);
  };

  return (
    <Screen scroll>
      <View>
        <Text variant="h1">Settings</Text>
        <Text variant="small" tone="muted" className="mt-2">
          App preferences and configuration
        </Text>
      </View>

      <View className="mt-6">
        <Text variant="caption" tone="muted" className="mb-3">
          Appearance
        </Text>
        <Card>
          <CardContent>
            <View>
              <Text variant="bodyMedium">Theme</Text>
              <Text variant="caption" tone="muted" className="mt-1">
                Choose how LiftLog should look
              </Text>
            </View>
            <View className="mt-4 flex-row gap-2">
              {THEME_OPTIONS.map(option => {
                const isSelected = themePreference === option.value;

                return (
                  <ThemeOptionCard
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    isSelected={isSelected}
                    onPress={() => setThemePreference(option.value)}
                  />
                );
              })}
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="mt-6">
        <Text variant="caption" tone="muted" className="mb-3">
          Units
        </Text>
        <Card>
          <CardContent>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text variant="bodyMedium">Weight unit</Text>
                <Text variant="caption" tone="muted" className="mt-1">
                  Used for all weight inputs and display
                </Text>
              </View>
              <View className="ml-4 flex-row items-center gap-2">
                <Text
                  variant="small"
                  className={
                    weightUnit === SETTINGS_DEFAULTS.weightUnit
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }
                >
                  kg
                </Text>
                <Switch
                  checked={weightUnit === 'lb'}
                  onCheckedChange={value => setWeightUnit(value ? 'lb' : 'kg')}
                />

                <Text
                  variant="small"
                  className={
                    weightUnit === 'lb'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }
                >
                  lb
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="mt-6">
        <Text variant="caption" tone="muted" className="mb-3">
          Rest timer
        </Text>
        <Card>
          <CardContent>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text variant="bodyMedium">Default duration</Text>
                <Text variant="caption" tone="muted" className="mt-1">
                  Used when starting the rest timer
                </Text>
              </View>
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

      {shouldShowStepsSettings ? (
        <View className="mt-6">
          <Text variant="caption" tone="muted" className="mb-3">
            Steps
          </Text>
          <Card>
            <CardContent>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text variant="bodyMedium">Health Connect steps</Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    Cache daily step totals from Health Connect
                  </Text>
                </View>
                <Switch
                  checked={healthConnectStepsEnabled}
                  onCheckedChange={setHealthConnectStepsEnabled}
                />
              </View>

              <View className="border-border mt-4 border-t pt-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text variant="bodyMedium">Daily goal</Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      Used for progress bars and notification progress
                    </Text>
                  </View>
                  <View className="ml-4 flex-row items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      disabled={stepGoal <= 1000}
                      onPress={() =>
                        setStepGoal(Math.max(1000, stepGoal - 500))
                      }
                    >
                      <Text variant="h3">−</Text>
                    </Button>
                    <Text variant="bodyMedium" className="w-16 text-center">
                      {new Intl.NumberFormat().format(stepGoal)}
                    </Text>
                    <Button
                      variant="secondary"
                      size="icon"
                      disabled={stepGoal >= 50000}
                      onPress={() =>
                        setStepGoal(Math.min(50000, stepGoal + 500))
                      }
                    >
                      <Text variant="h3">+</Text>
                    </Button>
                  </View>
                </View>
              </View>

              <View className="border-border mt-4 border-t pt-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text variant="bodyMedium">
                      Persistent step notification
                    </Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      Keep today&apos;s step count visible on Android
                    </Text>
                  </View>
                  <Switch
                    checked={stepsNotificationEnabled}
                    onCheckedChange={value => {
                      void handleStepsNotificationChange(value);
                    }}
                  />
                </View>
              </View>

              <Button
                variant="secondary"
                className="mt-4 w-full"
                onPress={openStepHealthConnectSettings}
              >
                Open Health Connect settings
              </Button>
            </CardContent>
          </Card>
        </View>
      ) : null}

      <View className="mt-6">
        <Text variant="caption" tone="muted" className="mb-3">
          About
        </Text>
        <Card>
          <CardContent>
            <View className="flex-row items-center justify-between py-1">
              <Text variant="bodyMedium">Version</Text>
              <Text variant="body" tone="muted">
                {Constants.expoConfig?.version ?? '1.0.0'}
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </Screen>
  );
}
