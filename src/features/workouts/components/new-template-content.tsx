import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { TemplateExerciseEditor } from '@/src/features/workouts/components/template-exercise-editor';
import { useSaveWorkoutTemplate } from '@/src/features/workouts/hooks';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, View } from 'react-native';

export function NewTemplateContent() {
  const saveWorkoutTemplate = useSaveWorkoutTemplate();
  const isSavingRef = useRef(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseListItem[]
  >([]);
  const canSave = name.trim().length > 0 && selectedExercises.length > 0;

  const saveTemplate = () => {
    if (!canSave || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      saveWorkoutTemplate(
        name,
        selectedExercises.map((exercise, order) => ({
          exerciseId: exercise.id,
          order
        }))
      );
      router.back();
    } catch {
      isSavingRef.current = false;
      setIsSaving(false);
      Alert.alert('Could not save template', 'Please try again.');
    }
  };

  const handleBackPress = () => {
    const hasChanges = name.trim().length > 0 || selectedExercises.length > 0;

    if (!hasChanges) {
      router.back();

      return;
    }

    Alert.alert(
      'Discard template?',
      'Your changes will be lost if you leave this screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <Screen
      withPadding={false}
      footer={
        <Button
          className="w-full"
          disabled={!canSave}
          loading={isSaving}
          onPress={saveTemplate}
        >
          Save template
        </Button>
      }
    >
      <View className="px-4 pt-6">
        <View className="flex-row items-center gap-3">
          <BackButton onPress={handleBackPress} />
          <Text variant="h1">New template</Text>
        </View>

        <Input
          wrapperClassName="mt-6"
          label="Template name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push day"
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      <View className="mt-6 flex-1">
        <TemplateExerciseEditor
          exercises={selectedExercises}
          onChange={setSelectedExercises}
        />
      </View>
    </Screen>
  );
}
