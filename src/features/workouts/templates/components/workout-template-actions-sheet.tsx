import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetSafeContent,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { PencilIcon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';

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

      <BottomSheetSafeContent>
        <PressableSurface
          accessibilityLabel="Rename template"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleRename}
        >
          <Icon as={PencilIcon} size="lg" tone="foreground" />
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
          <Icon as={Trash2Icon} size="lg" tone="danger" />
          <Text variant="bodyMedium" tone="danger" className="text-center">
            Delete template
          </Text>
        </PressableSurface>
      </BottomSheetSafeContent>
    </BottomSheet>
  );
}
