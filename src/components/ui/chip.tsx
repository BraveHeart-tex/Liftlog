import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';
import { appFonts } from '@/src/theme/fonts';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { View, type Pressable, type TextStyle } from 'react-native';

type NativePressableProps = ComponentPropsWithoutRef<typeof Pressable>;

const choiceChipVariantConfig = cva(
  'border-border min-h-11 flex-row items-center justify-center gap-2 border px-4 py-3',
  {
    variants: {
      shape: {
        pill: 'rounded-full',
        rounded: 'rounded-lg'
      },
      selected: {
        true: 'border-primary bg-primary',
        false: 'bg-card/50 dark:bg-background/50'
      }
    },
    defaultVariants: {
      shape: 'pill',
      selected: false
    }
  }
);

type ChoiceChipVariants = VariantProps<typeof choiceChipVariantConfig>;

export const choiceChipVariants = (variants: ChoiceChipVariants = {}) =>
  cn(choiceChipVariantConfig(variants));

type ChipShape = NonNullable<ChoiceChipVariants['shape']>;

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
  leftIcon?: ReactNode;
}

const choiceChipTextVariants = cva('', {
  variants: {
    selected: {
      true: 'text-primary-foreground',
      false: 'text-muted-foreground'
    }
  },
  defaultVariants: {
    selected: false
  }
});

const choiceChipContainerVariants = cva('', {
  variants: {
    fullWidth: {
      true: 'flex-1'
    }
  },
  defaultVariants: {
    fullWidth: false
  }
});

const ChipTextStyle: TextStyle = {
  fontFamily: appFonts.faces.medium
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
  leftIcon,
  ...props
}: ChoiceChipProps) {
  const label =
    typeof children === 'string' || typeof children === 'number'
      ? children
      : null;

  return (
    <PressableSurface
      accessibilityState={{ ...accessibilityState, selected }}
      containerClassName={
        cn(choiceChipContainerVariants({ fullWidth })) || undefined
      }
      className={cn(choiceChipVariants({ shape, selected }), className)}
      disabled={disabled}
      {...props}
    >
      {label !== null ? (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          <Text
            variant="small"
            tone="inherit"
            className={cn(choiceChipTextVariants({ selected }), textClassName)}
            numberOfLines={1}
            style={ChipTextStyle}
          >
            {label}
          </Text>
        </View>
      ) : (
        <>
          {leftIcon}
          {children}
        </>
      )}
    </PressableSurface>
  );
}
