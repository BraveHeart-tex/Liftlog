import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { XIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DiscardWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkoutName?: string;
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
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetHeader className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <BottomSheetTitle>Replace active workout?</BottomSheetTitle>
          <BottomSheetDescription>
            {activeWorkoutName
              ? `Starting ${templateName ?? 'this template'} will discard ${activeWorkoutName}.`
              : 'Start this template workout.'}
          </BottomSheetDescription>
        </View>
        <Button variant="ghost" size="icon" onPress={onClose}>
          <Icon icon={XIcon} size={20} className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="border-border mt-4 border-t" />

      <View
        className="flex-row gap-3 px-4 pt-4"
        style={{
          paddingBottom: insets.bottom + 8
        }}
      >
        <View className="flex-1">
          <Button variant="ghost" className="w-full" onPress={onResume}>
            Resume workout
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="destructive"
            className="w-full"
            onPress={onDiscardAndStart}
          >
            Discard and start
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
};
