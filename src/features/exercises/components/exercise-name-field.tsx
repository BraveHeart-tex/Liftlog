import { FloatingField } from '@/src/components/ui/floating-field';
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
      <FloatingField
        label="Name"
        inputVariant={inputVariant}
        error={error}
        inputProps={{
          value: name,
          onChangeText: onChangeName,
          placeholder: 'Incline Bench Press',
          autoCapitalize: 'words',
          autoCorrect: false,
          returnKeyType: 'done',
          accessibilityLabel: 'Name',
          className: 'h-11 px-3 py-0'
        }}
        ref={onInputRef}
      />
    </View>
  );
}
