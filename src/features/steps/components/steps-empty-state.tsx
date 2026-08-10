import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { HeartIcon, HeartPulseIcon, PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface StepsEmptyStateProps {
  isSyncing: boolean;
  onConnect: () => void;
}

export function StepsEmptyState({
  isSyncing,
  onConnect
}: StepsEmptyStateProps) {
  return (
    <EmptyState
      kind="empty"
      visual={
        <View className="bg-card h-40 w-40 items-center justify-center rounded-full">
          <Icon as={HeartIcon} size={56} tone="primary" />
          <View className="bg-primary border-background absolute right-3 bottom-4 h-12 w-12 items-center justify-center rounded-full border-4">
            <Icon as={PlusIcon} size="lg" tone="primaryForeground" />
          </View>
        </View>
      }
      title="Connect Health Data"
      description="See today's progress, weekly trends, and goal consistency from your Health Connect step data."
      actions={
        <View className="w-full">
          <Button
            size="lg"
            loading={isSyncing}
            fullWidth
            leftIcon={<Icon as={HeartPulseIcon} tone="primaryForeground" />}
            onPress={onConnect}
          >
            Connect Health Connect
          </Button>

          <View className="bg-card mt-7 rounded-lg px-5 py-4">
            <Text variant="bodyMedium">Your data stays on device</Text>
            <Text variant="small" tone="muted" className="mt-2">
              LiftLog reads steps only. No data is sent to external servers.
            </Text>
          </View>
        </View>
      }
    />
  );
}
