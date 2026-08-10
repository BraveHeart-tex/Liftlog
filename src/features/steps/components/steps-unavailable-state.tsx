import { Icon } from '@/src/components/ui/icon';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Text } from '@/src/components/ui/text';
import type { HealthConnectAvailability } from '@/src/features/steps/health-connect.service';
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
    <EmptyState
      kind="unavailable"
      visual={
        <View className="bg-card h-40 w-40 items-center justify-center rounded-full">
          <Icon as={HeartIcon} size={56} tone="mutedForeground" />
        </View>
      }
      title={title}
      description={description}
      actions={
        <View className="w-full">
          <View className="bg-card rounded-lg px-5 py-4">
            <Text variant="bodyMedium">Your workouts still work</Text>
            <Text variant="small" tone="muted" className="mt-2">
              You can keep logging workouts without step tracking.
            </Text>
          </View>
        </View>
      }
    />
  );
}
