import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { BookmarkIcon, PencilIcon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActiveWorkoutActionsSheetProps {
  isOpen: boolean;
  canSaveTemplate: boolean;
  onClose: () => void;
  onRename: () => void;
  onSaveTemplate: () => void;
  onDiscard: () => void;
}

export function ActiveWorkoutActionsSheet({
  isOpen,
  canSaveTemplate,
  onClose,
  onRename,
  onSaveTemplate,
  onDiscard
}: ActiveWorkoutActionsSheetProps) {
  const insets = useSafeAreaInsets();

  const handleRename = () => {
    onClose();
    requestAnimationFrame(onRename);
  };

  const handleSaveTemplate = () => {
    if (!canSaveTemplate) {
      return;
    }

    onClose();
    requestAnimationFrame(onSaveTemplate);
  };

  const handleDiscard = () => {
    onClose();
    requestAnimationFrame(onDiscard);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetHeader className="items-center">
        <BottomSheetTitle className="text-center">
          Workout actions
        </BottomSheetTitle>
      </BottomSheetHeader>

      <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
        <PressableSurface
          accessibilityLabel="Rename workout"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleRename}
        >
          <Icon icon={PencilIcon} size={20} className="text-foreground" />
          <Text variant="bodyMedium" className="text-center">
            Rename workout
          </Text>
        </PressableSurface>

        <PressableSurface
          accessibilityLabel="Save workout as template"
          disabled={!canSaveTemplate}
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleSaveTemplate}
        >
          <Icon icon={BookmarkIcon} size={20} className="text-foreground" />
          <Text variant="bodyMedium" className="text-center">
            Save as template
          </Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel="Discard workout"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleDiscard}
        >
          <Icon icon={Trash2Icon} size={20} className="text-danger" />
          <Text variant="bodyMedium" tone="danger" className="text-center">
            Discard workout
          </Text>
        </PressableSurface>
      </View>
    </BottomSheet>
  );
}
