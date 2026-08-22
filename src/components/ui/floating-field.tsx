import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { FieldDescription, FieldError } from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';
import type { InputProps } from '@/src/components/ui/input.shared';
import { Text } from '@/src/components/ui/text';
import {
  getFloatingFieldAnimation,
  getFloatingFieldValue,
  shouldFloatFloatingField
} from '@/src/components/ui/floating-field.shared';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  forwardRef,
  useEffect,
  useState,
  type ComponentRef,
  type ReactNode,
  type Ref
} from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

export type FloatingFieldProps = {
  label: string;
  inputProps: InputProps;
  inputVariant?: 'default' | 'bottom-sheet';
  description?: ReactNode;
  error?: ReactNode;
  className?: string;
};

type FloatingFieldInputRef = ComponentRef<typeof Input>;

export const FloatingField = forwardRef<
  FloatingFieldInputRef,
  FloatingFieldProps
>(function FloatingField(
  {
    className,
    description,
    error,
    inputProps,
    inputVariant = 'default',
    label
  },
  ref
) {
  const {
    accessibilityLabel,
    className: inputClassName,
    defaultValue,
    disabled = false,
    editable,
    invalid: inputInvalid = false,
    onBlur,
    onChangeText,
    onFocus,
    placeholder,
    value: controlledValue,
    ...restInputProps
  } = inputProps;
  const isControlled = controlledValue !== undefined;
  const [focused, setFocused] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? ''
  );
  const currentValue = getFloatingFieldValue({
    controlledValue,
    defaultValue,
    uncontrolledValue: isControlled ? undefined : uncontrolledValue
  });
  const shouldFloat = shouldFloatFloatingField({
    focused,
    value: currentValue
  });
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(shouldFloat ? 1 : 0);
  const invalid = Boolean(error) || inputInvalid;

  useEffect(() => {
    const { duration, toValue } = getFloatingFieldAnimation({
      reduceMotion: Boolean(reduceMotion),
      shouldFloat
    });

    progress.value =
      duration === 0 ? toValue : withTiming(toValue, { duration });
  }, [progress, reduceMotion, shouldFloat]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-4, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [12, -8]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.85]) }
    ]
  }));

  function handleBlur(event: Parameters<NonNullable<InputProps['onBlur']>>[0]) {
    setFocused(false);
    onBlur?.(event);
  }

  function handleChangeText(nextValue: string) {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }

    onChangeText?.(nextValue);
  }

  function handleFocus(
    event: Parameters<NonNullable<InputProps['onFocus']>>[0]
  ) {
    setFocused(true);
    onFocus?.(event);
  }

  const resolvedInputProps = {
    ...restInputProps,
    accessibilityLabel: accessibilityLabel ?? label,
    className: inputClassName,
    disabled,
    editable,
    invalid,
    onBlur: handleBlur,
    onChangeText: handleChangeText,
    onFocus: handleFocus,
    placeholder: shouldFloat && !currentValue ? placeholder : undefined,
    ...(isControlled ? { value: controlledValue } : { defaultValue })
  } satisfies InputProps;

  return (
    <View className={cn('relative w-full', className)}>
      {inputVariant === 'bottom-sheet' ? (
        <BottomSheetInput
          {...resolvedInputProps}
          ref={ref as Ref<ComponentRef<typeof BottomSheetInput>>}
        />
      ) : (
        <Input {...resolvedInputProps} ref={ref} />
      )}
      <Animated.View
        pointerEvents="none"
        accessible={false}
        className="bg-input absolute left-3 px-1"
        style={labelStyle}
      >
        <Text
          className={cn(
            'text-caption font-medium',
            invalid
              ? 'text-danger'
              : disabled || editable === false
                ? 'text-muted-foreground'
                : shouldFloat
                  ? 'text-foreground'
                  : 'text-muted-foreground'
          )}
        >
          {label}
        </Text>
      </Animated.View>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </View>
  );
});
