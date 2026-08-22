import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { FloatingField } from '@/src/components/ui/floating-field';
import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import {
  TemplateExerciseEditor,
  type TemplateExerciseEditorRow
} from '@/src/features/workouts/components/template-exercise-editor';
import { useSaveWorkoutTemplate } from '@/src/features/workouts/hooks/use-save-workout-template';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { router } from 'expo-router';
import { BookmarkIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';

export function NewTemplateContent() {
  const navigation = useNavigation();
  const saveWorkoutTemplate = useSaveWorkoutTemplate();
  const isSavingRef = useRef(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<
    TemplateExerciseEditorRow[]
  >([]);
  const hasChanges = name.trim().length > 0 || selectedExercises.length > 0;
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
          exerciseId: exercise.exercise.id,
          order,
          supersetId: exercise.supersetId
        }))
      );
      router.back();
    } catch {
      isSavingRef.current = false;
      setIsSaving(false);
      showSnackbar({
        message: 'Could not save template. Please try again.',
        variant: 'danger'
      });
    }
  };

  usePreventRemove(hasChanges, ({ data }) => {
    if (isSavingRef.current) {
      navigation.dispatch(data.action);

      return;
    }

    void confirmDialog({
      title: 'Discard template?',
      message: 'Your changes will be lost if you leave this screen.',
      confirmLabel: 'Discard',
      destructive: true
    }).then(confirmed => {
      if (confirmed) {
        navigation.dispatch(data.action);
      }
    });
  });

  return (
    <Screen
      withPadding={false}
      edges={[]}
      footer={
        <Button
          fullWidth
          disabled={!canSave}
          loading={isSaving}
          leftIcon={<Icon as={BookmarkIcon} tone="primaryForeground" />}
          onPress={saveTemplate}
        >
          Save template
        </Button>
      }
    >
      <View className="px-4 pt-6">
        <FloatingField
          label="Template name"
          inputProps={{
            value: name,
            onChangeText: setName,
            placeholder: 'e.g. Push day',
            autoCapitalize: 'sentences',
            returnKeyType: 'done',
            accessibilityLabel: 'Template name'
          }}
        />
      </View>

      <View className="mt-6 flex-1">
        <TemplateExerciseEditor
          rows={selectedExercises}
          onChange={setSelectedExercises}
        />
      </View>
    </Screen>
  );
}
