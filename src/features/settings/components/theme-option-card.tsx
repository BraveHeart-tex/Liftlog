import { Text } from '@/src/components/ui/text';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { Animated, Pressable } from 'react-native';

interface ThemeOptionCardProps {
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

export function ThemeOptionCard({
  label,
  description,
  isSelected,
  onPress
}: ThemeOptionCardProps) {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle} className="flex-1">
      <Pressable
        className={cn(
          'border-border bg-card min-h-16 flex-1 justify-center rounded-lg border px-3 py-3',
          isSelected && 'border-primary',
          pressed && 'opacity-80'
        )}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text
          variant="small"
          className={cn(
            'text-center',
            isSelected ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {label}
        </Text>
        <Text
          variant="caption"
          className={cn(
            'mt-1 text-center',
            isSelected ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {description}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
