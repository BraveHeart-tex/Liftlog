import { cn } from '@/src/lib/utils/cn';
import { iconSizes, type IconSize } from '@/src/theme/sizes';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { styled } from 'nativewind';

export type IconComponent = LucideIcon & {
  defaultProps?: Partial<LucideProps>;
};

type StyledIconComponent = LucideIcon & {
  className?: string;
};

const styledIconCache = new WeakMap<IconComponent, StyledIconComponent>();

function createStyledIcon(Icon: IconComponent): StyledIconComponent {
  const CachedIcon = styledIconCache.get(Icon);

  if (CachedIcon) {
    return CachedIcon;
  }

  const StyledIcon = styled(Icon as any, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: 'color',
        width: 'size',
        height: 'size',
        strokeWidth: 'strokeWidth',
        fill: 'fill',
        stroke: 'stroke'
      }
    }
  }) as StyledIconComponent;

  styledIconCache.set(Icon, StyledIcon);

  return StyledIcon;
}

type AppIconProps = Omit<LucideProps, 'ref' | 'size'> & {
  icon: IconComponent;
  className?: string;
  size?: IconSize | number;
};

function getIconSize(size: IconSize | number) {
  return typeof size === 'number' ? size : iconSizes[size];
}

export function Icon({
  icon,
  className,
  size = 'md',
  color,
  strokeWidth = 2,
  ...props
}: AppIconProps) {
  const StyledIcon = createStyledIcon(icon);

  return (
    <StyledIcon
      className={cn('text-inherit', className)}
      size={getIconSize(size)}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
