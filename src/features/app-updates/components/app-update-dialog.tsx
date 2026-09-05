import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetSafeFooter,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import type { AvailableUpdate } from '@/src/features/app-updates/app-update.types';
import { useMemo } from 'react';
import { View } from 'react-native';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AppUpdateDialogProps {
  update: AvailableUpdate;
  isOpen: boolean;
  onLater: () => void;
  onUpdate: () => void;
}

export function AppUpdateDialog({
  update,
  isOpen,
  onLater,
  onUpdate
}: AppUpdateDialogProps) {
  const notes = useMemo(
    () => update.manifest.releaseNotes.trim() || 'Bug fixes and improvements.',
    [update.manifest.releaseNotes]
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onLater} enableDynamicSizing>
      <BottomSheetHeader>
        <BottomSheetTitle>Update available</BottomSheetTitle>
        <BottomSheetDescription>
          LiftLog {update.manifest.versionName} is ready to download.
        </BottomSheetDescription>
      </BottomSheetHeader>
      <BottomSheetContent className="gap-3">
        <View className="gap-1">
          <Text variant="bodyMedium">Release notes</Text>
          <Text variant="small" tone="muted">
            {notes}
          </Text>
        </View>
        <Text variant="small" tone="muted">
          APK size: {formatBytes(update.apkSizeBytes)}
        </Text>
      </BottomSheetContent>
      <BottomSheetSafeFooter className="flex-row gap-3">
        <Button
          variant="secondary"
          containerClassName="flex-1"
          onPress={onLater}
        >
          Later
        </Button>
        <Button containerClassName="flex-1" onPress={onUpdate}>
          Update
        </Button>
      </BottomSheetSafeFooter>
    </BottomSheet>
  );
}
