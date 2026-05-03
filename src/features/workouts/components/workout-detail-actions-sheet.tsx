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

interface WorkoutDetailActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function WorkoutDetailActionsSheet({
  isOpen,
  onClose,
  onRename,
  onDelete
}: WorkoutDetailActionsSheetProps) {
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
      <BottomSheetHeader>
        <BottomSheetTitle>Workout actions</BottomSheetTitle>
      </BottomSheetHeader>

      <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
        <PressableSurface
          accessibilityLabel="Rename workout"
          className="min-h-14 flex-row items-center gap-3 rounded-lg px-3 py-3"
          onPress={handleRename}
        >
          <Icon icon={PencilIcon} size={20} className="text-foreground" />
          <Text variant="bodyMedium">Rename workout</Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel="Delete workout"
          className="min-h-14 flex-row items-center gap-3 rounded-lg px-3 py-3"
          onPress={handleDelete}
        >
          <Icon icon={Trash2Icon} size={20} className="text-danger" />
          <Text variant="bodyMedium" tone="danger">
            Delete workout
          </Text>
        </PressableSurface>
      </View>
    </BottomSheet>
  );
}
