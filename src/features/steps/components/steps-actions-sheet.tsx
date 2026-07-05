import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetSafeContent,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { RefreshCwIcon, SettingsIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface StepsActionsSheetProps {
  availabilityLabel: string;
  isOpen: boolean;
  isSyncing: boolean;
  onClose: () => void;
  onManage: () => void;
  onRefresh: () => void;
}

export function StepsActionsSheet({
  availabilityLabel,
  isOpen,
  isSyncing,
  onClose,
  onManage,
  onRefresh
}: StepsActionsSheetProps) {
  const handleRefresh = () => {
    onClose();
    requestAnimationFrame(() => {
      onRefresh();
    });
  };

  const handleManage = () => {
    onClose();
    requestAnimationFrame(onManage);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetHeader className="items-center">
        <BottomSheetTitle className="text-center">Steps</BottomSheetTitle>
        <BottomSheetDescription className="text-center">
          {availabilityLabel}
        </BottomSheetDescription>
      </BottomSheetHeader>

      <BottomSheetSafeContent>
        <PressableSurface
          accessibilityLabel="Refresh steps"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          disabled={isSyncing}
          onPress={handleRefresh}
        >
          <Icon as={RefreshCwIcon} size="lg" tone="foreground" />
          <Text variant="bodyMedium" className="text-center">
            {isSyncing ? 'Syncing steps...' : 'Refresh steps'}
          </Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel="Manage Health Connect"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleManage}
        >
          <Icon as={SettingsIcon} size="lg" tone="foreground" />
          <Text variant="bodyMedium" className="text-center">
            Manage Health Connect
          </Text>
        </PressableSurface>
      </BottomSheetSafeContent>
    </BottomSheet>
  );
}
