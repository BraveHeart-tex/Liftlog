import { Button } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';

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
  'h-14 w-14 items-center justify-center rounded-lg';

export const StepperButton = ({
  label,
  accessibilityLabel,
  onStep,
  onStartRepeating,
  onStopRepeating,
  buttonClassName,
  textClassName = 'text-body'
}: StepperButtonProps) => {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        onStartRepeating(onStep);
      }}
      onPressOut={onStopRepeating}
      variant="secondary"
      className={cn(stepperButtonClassName, buttonClassName)}
    >
      <Text variant="h3" className={textClassName}>
        {label}
      </Text>
    </Button>
  );
};
