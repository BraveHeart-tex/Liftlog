import {
  BottomSheet,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import type { WorkoutExercise } from '@/src/db/schema';
import { useSaveWorkoutTemplate } from '@/src/features/workouts/hooks';
import { XIcon } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SaveWorkoutTemplateSheetProps {
  isOpen: boolean;
  initialName: string;
  workoutExerciseRows: Pick<WorkoutExercise, 'exerciseId' | 'order'>[];
  onClose: () => void;
}

type BottomSheetInputRef = ComponentRef<typeof BottomSheetInput>;

export function SaveWorkoutTemplateSheet({
  isOpen,
  initialName,
  workoutExerciseRows,
  onClose
}: SaveWorkoutTemplateSheetProps) {
  const insets = useSafeAreaInsets();
  const templateInputRef = useRef<BottomSheetInputRef>(null);
  const isSavingTemplateRef = useRef(false);
  const [templateName, setTemplateName] = useState('');
  const [templateError, setTemplateError] = useState<string | undefined>();
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const saveWorkoutTemplate = useSaveWorkoutTemplate();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTemplateName(initialName);
    setTemplateError(undefined);
  }, [initialName, isOpen]);

  const handleClose = () => {
    Keyboard.dismiss();
    isSavingTemplateRef.current = false;
    setTemplateName(initialName);
    setTemplateError(undefined);
    setIsSavingTemplate(false);
    onClose();
  };

  const submitTemplate = () => {
    if (isSavingTemplateRef.current || workoutExerciseRows.length === 0) {
      return;
    }

    isSavingTemplateRef.current = true;
    setIsSavingTemplate(true);
    setTemplateError(undefined);

    try {
      saveWorkoutTemplate(templateName, workoutExerciseRows);
    } catch {
      setTemplateError('Could not save template. Try again.');
      isSavingTemplateRef.current = false;
      setIsSavingTemplate(false);

      return;
    }

    handleClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
    >
      <BottomSheetHeader className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <BottomSheetTitle>Save as template</BottomSheetTitle>
          <BottomSheetDescription>
            Save this workout&apos;s exercise order so you can start it again in
            one tap.
          </BottomSheetDescription>
        </View>
        <Button variant="ghost" size="icon" onPress={handleClose}>
          <Icon icon={XIcon} size={20} className="text-foreground" />
        </Button>
      </BottomSheetHeader>

      <View className="px-4 pt-4">
        <BottomSheetInput
          ref={templateInputRef}
          label="Template name"
          value={templateName}
          onChangeText={nextName => {
            setTemplateName(nextName);
            setTemplateError(undefined);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={80}
          error={templateError}
          blurOnSubmit={false}
          submitBehavior="submit"
          onSubmitEditing={submitTemplate}
        />
      </View>

      <View className="border-border mt-4 border-t" />
      <View
        className="flex-row gap-3 px-4 pt-4"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <View className="flex-1">
          <Button variant="ghost" className="w-full" onPress={handleClose}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button
            className="w-full"
            loading={isSavingTemplate}
            onPress={submitTemplate}
          >
            Save template
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
