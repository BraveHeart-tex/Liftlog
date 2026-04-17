import Constants from 'expo-constants';
import { Switch, View } from 'react-native';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks';
import { SETTINGS_DEFAULTS } from '@/src/features/settings/repository';
import { colors } from '@/src/theme/tokens';

const SWITCH_COLORS = {
  track: {
    false: colors.border,
    true: colors.primary
  },
  thumb: colors.primaryForeground
};

export default function SettingsScreen() {
  const { weightUnit, restTimerDuration, setWeightUnit, setRestTimerDuration } =
    useSettings();

  return (
    <Screen scroll>
      {/* no TextInput on this screen — stepper uses buttons only */}
      <View>
        <Text variant="h1">Settings</Text>
        <Text variant="small" tone="muted" className="mt-2">
          App preferences and configuration
        </Text>
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
                  trackColor={SWITCH_COLORS.track}
                  thumbColor={SWITCH_COLORS.thumb}
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
