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
import type { WorkoutExerciseWithSets } from '@/src/features/workouts/shared/workout-components.types';
import { Link2Icon, Trash2Icon } from 'lucide-react-native';
import { View } from 'react-native';

interface ActiveWorkoutExerciseActionsSheetProps {
  isOpen: boolean;
  item?: WorkoutExerciseWithSets;
  isInSuperset: boolean;
  onClose: () => void;
  onRemoveFromSuperset: () => void;
  onRemoveFromWorkout: () => void;
}

export function ActiveWorkoutExerciseActionsSheet({
  isOpen,
  item,
  isInSuperset,
  onClose,
  onRemoveFromSuperset,
  onRemoveFromWorkout
}: ActiveWorkoutExerciseActionsSheetProps) {
  if (!item) {
    return null;
  }

  const exerciseName = item.exercise?.name ?? 'Exercise';
  const loggedSetCount = item.sets.length;
  const loggedSetLabel = `${loggedSetCount} logged ${
    loggedSetCount === 1 ? 'set' : 'sets'
  }`;

  const handleRemoveFromSuperset = () => {
    onClose();
    requestAnimationFrame(onRemoveFromSuperset);
  };

  const handleRemoveFromWorkout = () => {
    onClose();
    requestAnimationFrame(onRemoveFromWorkout);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetHeader>
        <BottomSheetTitle>{exerciseName}</BottomSheetTitle>
        <BottomSheetDescription>
          {loggedSetLabel} - Changes apply when you save.
        </BottomSheetDescription>
      </BottomSheetHeader>

      <BottomSheetSafeContent className="pt-4">
        {isInSuperset ? (
          <>
            <PressableSurface
              accessibilityLabel="Remove from superset"
              className="min-h-14 flex-row items-center gap-4 rounded-lg px-2 py-3"
              onPress={handleRemoveFromSuperset}
            >
              <Icon as={Link2Icon} size="lg" tone="foreground" />
              <Text variant="bodyMedium">Remove from superset</Text>
            </PressableSurface>
            <View className="border-border my-2 border-t" />
          </>
        ) : null}

        <PressableSurface
          accessibilityLabel="Remove from workout"
          className="min-h-14 flex-row items-center gap-4 rounded-lg px-2 py-3"
          onPress={handleRemoveFromWorkout}
        >
          <Icon as={Trash2Icon} size="lg" tone="danger" />
          <Text variant="bodyMedium" tone="danger">
            Remove from workout
          </Text>
        </PressableSurface>
      </BottomSheetSafeContent>
    </BottomSheet>
  );
}
