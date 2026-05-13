import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { PencilIcon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutTemplateActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function WorkoutTemplateActionsSheet({
  isOpen,
  onClose,
  onRename,
  onDelete
}: WorkoutTemplateActionsSheetProps) {
  const insets = useSafeAreaInsets();

  const handleRename = () => {
    onClose();
    requestAnimationFrame(onRename);
  };

  const handleDelete = () => {
    onClose();
    requestAnimationFrame(onDelete);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetHeader className="items-center">
        <BottomSheetTitle className="text-center">
          Template actions
        </BottomSheetTitle>
      </BottomSheetHeader>

      <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
        <PressableSurface
          accessibilityLabel="Rename template"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleRename}
        >
          <Icon icon={PencilIcon} size={20} className="text-foreground" />
          <Text variant="bodyMedium" className="text-center">
            Rename template
          </Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel="Delete template"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleDelete}
        >
          <Icon icon={Trash2Icon} size={20} className="text-danger" />
          <Text variant="bodyMedium" tone="danger" className="text-center">
            Delete template
          </Text>
        </PressableSurface>
      </View>
    </BottomSheet>
  );
}
