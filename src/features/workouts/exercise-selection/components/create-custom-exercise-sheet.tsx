import { StyledBottomSheetScrollView } from '@/src/components/styled/bottom-sheet';
import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetSafeFooter,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import type { NewExercise } from '@/src/db/schema';
import { ExerciseMetadataForm } from '@/src/features/exercises/components/exercise-metadata-form';
import { useCustomExerciseForm } from '@/src/features/exercises/hooks/use-custom-exercise-form';
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef
} from 'react';
import { PlusIcon } from 'lucide-react-native';
import { Keyboard, View } from 'react-native';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';

interface CreateCustomExerciseSheetProps {
  isOpen: boolean;
  initialName?: string;
  description?: string;
  saveLabel?: string;
  reservedNames?: string[];
  onClose: () => void;
  onSave: (exercise: NewExercise) => void;
}

const SNAP_POINTS = ['90%'];

export function CreateCustomExerciseSheet({
  isOpen,
  initialName = '',
  description = 'Add it here and attach it to this workout right away.',
  saveLabel = 'Save',
  reservedNames = [],
  onClose,
  onSave
}: CreateCustomExerciseSheetProps) {
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={SNAP_POINTS}
      androidKeyboardInputMode="adjustPan"
    >
      {({ isContentReady }) =>
        isOpen || isContentReady ? (
          <CreateCustomExerciseSheetContent
            isOpen={isOpen}
            initialName={initialName}
            description={description}
            saveLabel={saveLabel}
            reservedNames={reservedNames}
            onClose={handleClose}
            onSave={onSave}
          />
        ) : null
      }
    </BottomSheet>
  );
}

const CreateCustomExerciseSheetContent = memo(
  function CreateCustomExerciseSheetContent({
    isOpen,
    initialName = '',
    description,
    saveLabel,
    reservedNames,
    onClose,
    onSave
  }: CreateCustomExerciseSheetProps) {
    const reduceMotion = useReducedMotion();
    const scrollRef =
      useRef<ComponentRef<typeof StyledBottomSheetScrollView>>(null);
    const [errorScrollRequestId, setErrorScrollRequestId] = useState(0);
    const {
      name,
      equipment,
      trackingType,
      selectedPrimaryMuscles,
      selectedSecondaryMuscles,
      nameError,
      setName,
      setEquipment,
      setTrackingType,
      togglePrimaryMuscle,
      toggleSecondaryMuscle,
      submit,
      reset
    } = useCustomExerciseForm({ initialName, reservedNames });

    useEffect(() => {
      reset();
      setErrorScrollRequestId(0);
    }, [isOpen, reset]);

    const handleClose = () => {
      onClose();
    };

    const handleSave = () => {
      const newExercise = submit();

      if (!newExercise) {
        setErrorScrollRequestId(current => current + 1);

        return;
      }

      Keyboard.dismiss();
      onSave(newExercise);
      reset();
    };

    const canCreateExercise = Boolean(name.trim()) && Boolean(trackingType);

    return (
      <>
        <BottomSheetHeader>
          <BottomSheetTitle>Create custom exercise</BottomSheetTitle>
          <BottomSheetDescription>{description}</BottomSheetDescription>
        </BottomSheetHeader>

        <StyledBottomSheetScrollView
          ref={scrollRef}
          contentContainerClassName="px-4 pb-4 mt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <ExerciseMetadataForm
            inputVariant="bottom-sheet"
            name={name}
            equipment={equipment}
            trackingType={trackingType}
            selectedPrimaryMuscles={selectedPrimaryMuscles}
            selectedSecondaryMuscles={selectedSecondaryMuscles}
            nameError={nameError}
            errorScrollRequestId={errorScrollRequestId}
            onScrollToError={y =>
              scrollRef.current?.scrollTo({ y, animated: !reduceMotion })
            }
            setName={setName}
            setEquipment={setEquipment}
            setTrackingType={setTrackingType}
            togglePrimaryMuscle={togglePrimaryMuscle}
            toggleSecondaryMuscle={toggleSecondaryMuscle}
          />
        </StyledBottomSheetScrollView>

        <BottomSheetSafeFooter className="border-border flex-col gap-0 border-t">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" onPress={handleClose}>
                Cancel
              </Button>
            </View>
            <View className="flex-1">
              <Button
                disabled={!canCreateExercise}
                leftIcon={<Icon as={PlusIcon} tone="primaryForeground" />}
                onPress={handleSave}
              >
                {saveLabel}
              </Button>
            </View>
          </View>
        </BottomSheetSafeFooter>
      </>
    );
  }
);
