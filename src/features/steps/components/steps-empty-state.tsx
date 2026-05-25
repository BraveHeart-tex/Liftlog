import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { HeartIcon, PlusIcon } from 'lucide-react-native';
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
    <View className="flex-1 justify-center pt-16 pb-16">
      <View className="items-center">
        <View className="bg-card h-40 w-40 items-center justify-center rounded-full">
          <Icon icon={HeartIcon} size={56} className="text-primary" />
          <View className="bg-primary border-background absolute right-3 bottom-4 h-12 w-12 items-center justify-center rounded-full border-4">
            <Icon
              icon={PlusIcon}
              size="lg"
              className="text-primary-foreground"
            />
          </View>
        </View>

        <Text variant="h1" className="mt-7 text-center">
          Connect Health Data
        </Text>
        <Text variant="body" tone="muted" className="mt-4 max-w-80 text-center">
          See today&apos;s progress, weekly trends, and goal consistency from
          your Health Connect step data.
        </Text>
      </View>

      <Button
        size="lg"
        className="mt-10 w-full"
        loading={isSyncing}
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
  );
}
