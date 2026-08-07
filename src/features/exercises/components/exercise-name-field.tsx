import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Input } from '@/src/components/ui/input';
import { View, type LayoutChangeEvent } from 'react-native';

interface FocusableInput {
  focus: () => void;
}

interface ExerciseNameFieldProps {
  name: string;
  error?: string;
  inputVariant: 'default' | 'bottom-sheet';
  onLayout: (event: LayoutChangeEvent) => void;
  onInputRef: (input: FocusableInput | null | undefined) => void;
  onChangeName?: (name: string) => void;
}

export function ExerciseNameField({
  name,
  error,
  inputVariant,
  onLayout,
  onInputRef,
  onChangeName
}: ExerciseNameFieldProps) {
  return (
    <View onLayout={onLayout}>
      {inputVariant === 'bottom-sheet' ? (
        <BottomSheetInput
          ref={onInputRef}
          label="1. Name"
          value={name}
          onChangeText={onChangeName}
          placeholder="Incline Bench Press"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          error={error}
          density="compact"
        />
      ) : (
        <Input
          ref={onInputRef}
          label="1. Name"
          value={name}
          onChangeText={onChangeName}
          placeholder="Incline Bench Press"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          error={error}
          density="compact"
        />
      )}
    </View>
  );
}
