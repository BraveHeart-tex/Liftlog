import { styled } from 'nativewind';
import {
  ActivityIndicator,
  Text as NativeText,
  type ActivityIndicatorProps
} from 'react-native';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import { cn } from '@/src/lib/utils/cn.utils';

const StyledNativeText = styled(NativeText);

type StyledActivityIndicatorProps = ActivityIndicatorProps & {
  className?: string;
};

const staticIndicatorSize = (size: ActivityIndicatorProps['size']) =>
  typeof size === 'number' ? size : size === 'large' ? 16 : 10;

const StyledNativeActivityIndicator = styled(ActivityIndicator, {
  className: {
    target: 'style',
    nativeStyleMapping: {
      color: 'color'
    }
  }
});

export function StyledActivityIndicator({
  className,
  size = 'small',
  ...props
}: StyledActivityIndicatorProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <StyledNativeText
        accessible={false}
        className={cn('text-foreground', className)}
        style={{ fontSize: staticIndicatorSize(size) }}
      >
        ●
      </StyledNativeText>
    );
  }

  return (
    <StyledNativeActivityIndicator
      {...props}
      className={className}
      size={size}
    />
  );
}
