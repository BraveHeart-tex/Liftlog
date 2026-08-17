import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Field, FieldError, FieldLabel } from '@/src/components/ui/field';
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
      <Field>
        <FieldLabel>1. Name</FieldLabel>
        {inputVariant === 'bottom-sheet' ? (
          <BottomSheetInput
            ref={onInputRef}
            value={name}
            onChangeText={onChangeName}
            placeholder="Incline Bench Press"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel="1. Name"
            invalid={Boolean(error)}
            className="mt-2 h-11 px-3 py-2"
          />
        ) : (
          <Input
            ref={onInputRef}
            value={name}
            onChangeText={onChangeName}
            placeholder="Incline Bench Press"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel="1. Name"
            invalid={Boolean(error)}
            className="mt-2 h-11 px-3 py-2"
          />
        )}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    </View>
  );
}
