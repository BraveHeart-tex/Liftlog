import { Text } from '@/src/components/ui/text';
import { usePressScale } from '@/src/lib/animations/use-press-scale';
import { cn } from '@/src/lib/utils/cn';
import { Animated, Pressable } from 'react-native';

interface StepperButtonProps {
  label: string;
  accessibilityLabel: string;
  onStep: () => void;
  onStartRepeating: (onStep: () => void) => void;
  onStopRepeating: () => void;
  buttonClassName?: string;
  textClassName?: string;
}

const stepperButtonClassName =
  'bg-secondary border-border h-14 w-14 items-center justify-center rounded-lg border';

export const StepperButton = ({
  label,
  accessibilityLabel,
  onStep,
  onStartRepeating,
  onStopRepeating,
  buttonClassName,
  textClassName = 'text-body'
}: StepperButtonProps) => {
  const { pressed, scaleStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => {
          onPressIn();
          onStartRepeating(onStep);
        }}
        onPressOut={() => {
          onPressOut();
          onStopRepeating();
        }}
        className={cn(
          pressed && 'opacity-80',
          stepperButtonClassName,
          buttonClassName
        )}
      >
        <Text variant="h3" className={textClassName}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
