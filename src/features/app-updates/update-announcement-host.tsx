import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { router, usePathname, type Href } from 'expo-router';
import { Download } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  shouldShowUpdateAnnouncement,
  UPDATE_DETAILS_ROUTE
} from './update-announcement';
import { useAppUpdates } from './update-provider';

export function UpdateAnnouncementHost() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { state, dismissUpdate } = useAppUpdates();

  if (
    Platform.OS !== 'android' ||
    !shouldShowUpdateAnnouncement(state, pathname)
  ) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 z-40 px-4"
      style={{ top: insets.top + 12 }}
    >
      <View className="border-border bg-popover min-h-14 flex-row items-center gap-2 rounded-lg border p-2 shadow-xl">
        <PressableSurface
          accessibilityLabel={`View update details for version ${state.release!.versionName}`}
          containerClassName="min-w-0 flex-1"
          className="min-h-12 w-full flex-row items-center gap-3 rounded-md px-2 py-2"
          pressedClassName="bg-muted"
          onPress={() => router.navigate(UPDATE_DETAILS_ROUTE as Href)}
        >
          <View className="bg-primary/15 h-9 w-9 items-center justify-center rounded-full">
            <Icon as={Download} size="sm" tone="primary" />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="bodyMedium" weight="semiBold" numberOfLines={1}>
              Update available
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Version {state.release!.versionName} - View details
            </Text>
          </View>
        </PressableSurface>
        <Button
          variant="ghost"
          size="sm"
          accessibilityLabel={`Dismiss version ${state.release!.versionName} update announcement`}
          containerClassName="shrink-0"
          className="min-h-12 px-3"
          textClassName="text-primary text-small"
          onPress={dismissUpdate}
        >
          Later
        </Button>
      </View>
    </View>
  );
}
