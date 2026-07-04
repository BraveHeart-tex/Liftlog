import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { NotebookPen, PencilIcon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutDetailActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function WorkoutDetailActionsSheet({
  isOpen,
  onClose,
  onEdit,
  onRename,
  onDelete
}: WorkoutDetailActionsSheetProps) {
  const insets = useSafeAreaInsets();

  const handleEdit = () => {
    onClose();
    requestAnimationFrame(onEdit);
  };

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
          Workout actions
        </BottomSheetTitle>
      </BottomSheetHeader>

      <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
        <PressableSurface
          accessibilityLabel="Edit workout"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleEdit}
        >
          <Icon as={NotebookPen} size="lg" tone="foreground" />
          <Text variant="bodyMedium" className="text-center">
            Edit workout
          </Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel="Rename workout"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleRename}
        >
          <Icon as={PencilIcon} size="lg" tone="foreground" />
          <Text variant="bodyMedium" className="text-center">
            Rename workout
          </Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel="Delete workout"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleDelete}
        >
          <Icon as={Trash2Icon} size="lg" tone="danger" />
          <Text variant="bodyMedium" tone="danger" className="text-center">
            Delete workout
          </Text>
        </PressableSurface>
      </View>
    </BottomSheet>
  );
}
