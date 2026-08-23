import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import type { NewExercise } from '@/src/db/schema';
import { ExerciseMetadataForm } from '@/src/features/exercises/components/exercise-metadata-form';
import { ExerciseNameConflictError } from '@/src/features/exercises/exercise.repository';
import { useCustomExerciseForm } from '@/src/features/exercises/hooks/use-custom-exercise-form';
import { useExerciseActions } from '@/src/features/exercises/hooks/use-exercise-actions';
import { triggerHapticSuccess } from '@/src/lib/haptics/haptics';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Keyboard, View, type ScrollView } from 'react-native';

export function NewExerciseScreen() {
  const reduceMotion = useReducedMotion();
  const { createCustomExercise } = useExerciseActions();
  const scrollRef = useRef<ScrollView>(null);
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
    reportNameConflict,
    submit: buildExercise
  } = useCustomExerciseForm();

  const createExercise = (newExercise: NewExercise) => {
    const createdExercise = createCustomExercise(newExercise);
    triggerHapticSuccess('custom exercise creation');

    router.replace(
      {
        pathname: '/exercises/[id]',
        params: { id: createdExercise.id }
      },
      { withAnchor: true }
    );
  };

  const submit = () => {
    const newExercise = buildExercise();

    if (!newExercise) {
      setErrorScrollRequestId(current => current + 1);

      return;
    }

    Keyboard.dismiss();

    try {
      createExercise(newExercise);
    } catch (error) {
      if (error instanceof ExerciseNameConflictError) {
        reportNameConflict();
        setErrorScrollRequestId(current => current + 1);

        return;
      }

      throw error;
    }
  };

  const canCreateExercise = Boolean(name.trim()) && Boolean(trackingType);

  return (
    <Screen
      scroll
      edges={[]}
      scrollRef={scrollRef}
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button variant="secondary" onPress={() => router.back()}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button
              disabled={!canCreateExercise}
              leftIcon={<Icon as={PlusIcon} tone="primaryForeground" />}
              onPress={submit}
            >
              Create exercise
            </Button>
          </View>
        </View>
      }
    >
      <View>
        <View>
          <ExerciseMetadataForm
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
        </View>
      </View>
    </Screen>
  );
}
