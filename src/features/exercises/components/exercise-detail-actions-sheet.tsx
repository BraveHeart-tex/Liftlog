import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import {
  ArchiveIcon,
  PencilIcon,
  SlidersHorizontalIcon,
  Trash2Icon
} from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExerciseDetailActionsSheetProps {
  isOpen: boolean;
  removeActionLabel: 'Archive' | 'Delete';
  onClose: () => void;
  onRename: () => void;
  onEditDetails: () => void;
  onRemove: () => void;
}

export function ExerciseDetailActionsSheet({
  isOpen,
  removeActionLabel,
  onClose,
  onRename,
  onEditDetails,
  onRemove
}: ExerciseDetailActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const RemoveIcon = removeActionLabel === 'Archive' ? ArchiveIcon : Trash2Icon;

  const handleRename = () => {
    onClose();
    requestAnimationFrame(onRename);
  };

  const handleEditDetails = () => {
    onClose();
    requestAnimationFrame(onEditDetails);
  };

  const handleRemove = () => {
    onClose();
    requestAnimationFrame(onRemove);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetHeader className="items-center">
        <BottomSheetTitle className="text-center">
          Exercise actions
        </BottomSheetTitle>
      </BottomSheetHeader>

      <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
        <PressableSurface
          accessibilityLabel="Rename exercise"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleRename}
        >
          <Icon icon={PencilIcon} size={20} className="text-foreground" />
          <Text variant="bodyMedium" className="text-center">
            Rename
          </Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel="Edit exercise details"
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleEditDetails}
        >
          <Icon
            icon={SlidersHorizontalIcon}
            size={20}
            className="text-foreground"
          />
          <Text variant="bodyMedium" className="text-center">
            Edit details
          </Text>
        </PressableSurface>

        <View className="border-border my-1 border-t" />

        <PressableSurface
          accessibilityLabel={`${removeActionLabel} exercise`}
          className="min-h-14 flex-row items-center justify-center gap-3 rounded-lg px-3 py-3"
          onPress={handleRemove}
        >
          <Icon icon={RemoveIcon} size={20} className="text-danger" />
          <Text variant="bodyMedium" tone="danger" className="text-center">
            {removeActionLabel}
          </Text>
        </PressableSurface>
      </View>
    </BottomSheet>
  );
}
