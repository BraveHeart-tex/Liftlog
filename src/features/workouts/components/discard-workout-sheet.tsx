import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetSafeFooter,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PlayIcon, Trash2Icon, XIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface DiscardWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkoutName: string;
  templateName?: string;
  onResume: () => void;
  onDiscardAndStart: () => void;
}

export const DiscardWorkoutSheet = ({
  isOpen,
  onClose,
  activeWorkoutName,
  templateName,
  onResume,
  onDiscardAndStart
}: DiscardWorkoutSheetProps) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetHeader className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <BottomSheetTitle>Replace active workout?</BottomSheetTitle>
          <BottomSheetDescription>
            {`Starting ${templateName ?? 'this template'} will discard ${activeWorkoutName}.`}
          </BottomSheetDescription>
        </View>
        <Button variant="secondary" size="icon" onPress={onClose}>
          <Icon as={XIcon} size="lg" tone="foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="border-border mt-4 border-t" />

      <BottomSheetSafeFooter>
        <View className="flex-1">
          <Button
            variant="ghost"
            className="w-full"
            leftIcon={<Icon as={PlayIcon} tone="foreground" />}
            onPress={onResume}
          >
            Resume workout
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="destructive"
            className="w-full"
            leftIcon={<Icon as={Trash2Icon} tone="danger" />}
            onPress={onDiscardAndStart}
          >
            Discard and start
          </Button>
        </View>
      </BottomSheetSafeFooter>
    </BottomSheet>
  );
};
