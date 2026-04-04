import { colors } from "@/src/theme/tokens";
import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Text, TextInput, View } from "react-native";

type NativeTextInputProps = ComponentPropsWithoutRef<typeof TextInput>;

export type InputProps = NativeTextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
  errorClassName?: string;
  disabled?: boolean;
};

function joinClassNames(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    containerClassName,
    className,
    inputClassName,
    labelClassName,
    hintClassName,
    errorClassName,
    disabled = false,
    editable,
    onBlur,
    onFocus,
    placeholderTextColor,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const isEditable = editable ?? !disabled;

  return (
    <View className={joinClassNames("w-full", className)}>
      {label ? (
        <Text
          className={joinClassNames(
            "text-small text-foreground",
            labelClassName,
          )}
        >
          {label}
        </Text>
      ) : null}

      <View
        className={joinClassNames(
          "mt-2 flex-row items-center rounded-lg border border-border bg-input px-4 py-3",
          focused && !hasError && "border-ring",
          hasError && "border-danger",
          disabled && "opacity-50",
          containerClassName,
        )}
      >
        {leftIcon ? (
          <View className="mr-3 items-center justify-center">{leftIcon}</View>
        ) : null}

        <TextInput
          ref={ref}
          className={joinClassNames(
            "flex-1 text-body text-foreground",
            inputClassName,
          )}
          editable={isEditable}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={placeholderTextColor ?? colors.mutedForeground}
          selectionColor={colors.primary}
          {...props}
        />

        {rightIcon ? (
          <View className="ml-3 items-center justify-center">{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text
          className={joinClassNames(
            "mt-2 text-caption text-danger",
            errorClassName,
          )}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          className={joinClassNames(
            "mt-2 text-caption text-muted-foreground",
            hintClassName,
          )}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

export default Input;
