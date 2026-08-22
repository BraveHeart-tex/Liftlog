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
  const inputProps = {
    value: name,
    onChangeText: onChangeName,
    placeholder: 'Incline Bench Press',
    autoCapitalize: 'words' as const,
    autoCorrect: false,
    returnKeyType: 'done' as const,
    accessibilityLabel: 'Name',
    className: 'h-11'
  };

  return (
    <View onLayout={onLayout}>
      <Field>
        <FieldLabel>Name</FieldLabel>
        {inputVariant === 'bottom-sheet' ? (
          <BottomSheetInput
            {...inputProps}
            invalid={Boolean(error)}
            ref={onInputRef}
          />
        ) : (
          <Input {...inputProps} invalid={Boolean(error)} ref={onInputRef} />
        )}
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    </View>
  );
}
