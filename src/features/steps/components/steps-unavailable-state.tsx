import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { HealthConnectAvailability } from '@/src/features/steps/health-connect';
import { HeartIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface StepsUnavailableStateProps {
  availability: HealthConnectAvailability;
}

export function StepsUnavailableState({
  availability
}: StepsUnavailableStateProps) {
  const title =
    availability === 'provider_update_required'
      ? 'Health Connect update required'
      : 'Step tracking unavailable';
  const description =
    availability === 'unsupported'
      ? 'LiftLog reads steps through Health Connect, which is available on supported Android devices.'
      : availability === 'provider_update_required'
        ? 'Update Health Connect on this device, then return to LiftLog to connect your step data.'
        : 'This device does not currently support Health Connect step data.';

  return (
    <View className="flex-1 justify-center pt-16 pb-16">
      <View className="items-center">
        <View className="bg-card h-40 w-40 items-center justify-center rounded-full">
          <Icon as={HeartIcon} size={56} tone="mutedForeground" />
        </View>

        <Text variant="h1" className="mt-7 text-center">
          {title}
        </Text>
        <Text variant="body" tone="muted" className="mt-4 max-w-80 text-center">
          {description}
        </Text>
      </View>

      <View className="bg-card mt-10 rounded-lg px-5 py-4">
        <Text variant="bodyMedium">Your workouts still work</Text>
        <Text variant="small" tone="muted" className="mt-2">
          You can keep logging workouts without step tracking.
        </Text>
      </View>
    </View>
  );
}
