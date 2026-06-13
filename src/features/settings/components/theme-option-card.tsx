import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { Animated, Pressable } from 'react-native';

interface ThemeOptionCardProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon: IconComponent;
}

export function ThemeOptionCard({
  label,
  isSelected,
  onPress,
  icon
}: ThemeOptionCardProps) {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle} className="flex-1">
      <Pressable
        className={cn(
          'border-border bg-card min-h-16 flex-1 items-center justify-center gap-2 rounded-lg border p-4',
          isSelected && 'border-primary',
          pressed && 'opacity-80'
        )}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Icon icon={icon} tone={isSelected ? 'primary' : 'mutedForeground'} />
        <Text
          variant="small"
          className={isSelected ? 'text-primary' : 'text-muted-foreground'}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
