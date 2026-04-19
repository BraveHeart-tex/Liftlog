import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import {
  SETTINGS_DEFAULTS,
  useSettings,
  type ThemePreference
} from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import Constants from 'expo-constants';
import { Pressable, Switch, View } from 'react-native';

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
    setWeightUnit,
    setRestTimerDuration,
    setThemePreference
  } = useSettings();
  const { colors } = useAppTheme();

  const switchColors = {
    track: {
      false: colors.border,
      true: colors.primary
    },
    thumb: colors.primaryForeground
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
                  <Pressable
                    key={option.value}
                    className={cn(
                      'min-h-16 flex-1 justify-center rounded-lg border px-3 py-3',
                      'border-border bg-card',
                      isSelected && 'border-primary'
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setThemePreference(option.value)}
                  >
                    <Text
                      variant="small"
                      className={cn(
                        'text-center',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {option.label}
                    </Text>
                    <Text
                      variant="caption"
                      className={cn(
                        'mt-1 text-center',
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
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
                  value={weightUnit === 'lb'}
                  onValueChange={value => setWeightUnit(value ? 'lb' : 'kg')}
                  trackColor={switchColors.track}
                  thumbColor={switchColors.thumb}
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
