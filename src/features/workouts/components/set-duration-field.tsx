import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import { Pressable, View } from 'react-native';

interface SetDurationFieldProps {
  value: string;
  placeholder: string;
  disabled: boolean;
  isCommitted: boolean;
  isValid: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}

export function SetDurationField({
  value,
  placeholder,
  disabled,
  isCommitted,
  isValid,
  accessibilityLabel,
  onPress
}: SetDurationFieldProps) {
  return (
    <View className="flex-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={onPress}
        className={cn(
          'bg-muted min-h-12 flex-row items-center justify-center rounded-lg border px-1',
          isCommitted
            ? 'border-success/40 bg-success/10'
            : isValid
              ? 'border-muted'
              : 'border-transparent',
          disabled && 'opacity-60'
        )}
      >
        <Text
          variant="bodyMedium"
          tone={value ? 'default' : 'muted'}
          className="px-2 py-2 text-center"
          numberOfLines={1}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {value || placeholder}
        </Text>
      </Pressable>
    </View>
  );
}
