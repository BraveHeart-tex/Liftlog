import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { Pressable } from 'react-native';

type NativePressableProps = ComponentPropsWithoutRef<typeof Pressable>;

type ChipShape = 'pill' | 'rounded';

interface ChoiceChipProps extends Omit<
  NativePressableProps,
  'className' | 'children'
> {
  children: ReactNode;
  selected?: boolean;
  shape?: ChipShape;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}

const shapeClassNames: Record<ChipShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-lg'
};

export function ChoiceChip({
  children,
  selected = false,
  disabled = false,
  shape = 'pill',
  fullWidth = false,
  className,
  textClassName,
  accessibilityState,
  ...props
}: ChoiceChipProps) {
  const label =
    typeof children === 'string' || typeof children === 'number'
      ? children
      : null;

  return (
    <PressableSurface
      accessibilityState={{ ...accessibilityState, selected }}
      containerClassName={fullWidth ? 'flex-1' : undefined}
      className={cn(
        'border-border min-h-11 items-center justify-center border px-4 py-3',
        shapeClassNames[shape],
        selected
          ? 'bg-primary border-primary'
          : 'bg-card/50 dark:bg-background/50',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {label !== null ? (
        <Text
          variant="small"
          tone="inherit"
          className={cn(
            selected ? 'text-primary-foreground' : 'text-muted-foreground',
            textClassName
          )}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : (
        children
      )}
    </PressableSurface>
  );
}
