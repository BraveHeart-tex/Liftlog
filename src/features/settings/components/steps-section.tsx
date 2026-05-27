import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Switch } from '@/src/components/ui/switch';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks';
import { openStepHealthConnectSettings } from '@/src/features/steps/health-connect';
import {
  requestStepNotificationPermission,
  stopStepNotification
} from '@/src/features/steps/notifications';
import { iconSizes } from '@/src/theme/sizes';
import { ExternalLink } from 'lucide-react-native';
import { Alert, Platform, View } from 'react-native';

export const StepsSection = () => {
  const {
    healthConnectStepsEnabled,
    stepsNotificationEnabled,
    stepGoal,
    setHealthConnectStepsEnabled,
    setStepsNotificationEnabled,
    setStepGoal
  } = useSettings();
  const shouldShowStepsSettings = Platform.OS === 'android';

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

  return shouldShowStepsSettings ? (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-3">
        Steps
      </Text>
      <Card className="overflow-hidden">
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
              <Text variant="bodyMedium" className="flex-1">
                Step goal
              </Text>

              <View className="ml-4 flex-row items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={stepGoal <= 1000}
                  onPress={() => setStepGoal(Math.max(1000, stepGoal - 500))}
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
                  onPress={() => setStepGoal(Math.min(50000, stepGoal + 500))}
                >
                  <Text variant="h3">+</Text>
                </Button>
              </View>
            </View>
          </View>

          <View className="border-border mt-4 border-t pt-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text variant="bodyMedium">Persistent step notification</Text>
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
        </CardContent>
        <Button
          variant="secondary"
          onPress={openStepHealthConnectSettings}
          textClassName="text-small text-primary py-2"
          className="border-t-border rounded-none border-t border-b-0 border-transparent"
          rightIcon={
            <Icon
              icon={ExternalLink}
              className="text-primary"
              size={iconSizes.sm}
            />
          }
        >
          Open Health Connect settings
        </Button>
      </Card>
    </View>
  ) : null;
};
