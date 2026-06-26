import { iconSizes, type IconSize } from '@/src/theme/sizes';
import type { ComponentType } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { styled } from 'nativewind';

export type IconComponent = LucideIcon & {
  defaultProps?: Partial<LucideProps>;
};

type StyledIconComponent = LucideIcon & {
  className?: string;
};

type NativeWindIconStyle = {
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
};

type NativeWindStylableIcon = ComponentType<
  LucideProps & {
    className?: string;
    style: NativeWindIconStyle;
  }
>;

const styledIconCache = new WeakMap<IconComponent, StyledIconComponent>();

function createStyledIcon(Icon: IconComponent): StyledIconComponent {
  const CachedIcon = styledIconCache.get(Icon);

  if (CachedIcon) {
    return CachedIcon;
  }

  const StyledIcon =
    // HARDEN-OK: nativewind styled() returns any in this version.
    styled(Icon as NativeWindStylableIcon, {
      className: {
        target: 'style',
        nativeStyleMapping: {
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

type AppIconProps = Omit<
  LucideProps,
  'className' | 'color' | 'ref' | 'size'
> & {
  icon: IconComponent;
  size?: IconSize | number;
  tone?: IconTone;
};

export type IconTone =
  | 'foreground'
  | 'primary'
  | 'primaryForeground'
  | 'secondaryForeground'
  | 'mutedForeground'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'progressUp'
  | 'progressSame'
  | 'progressDown';

const iconToneClassNames: Record<IconTone, string> = {
  foreground: 'text-foreground',
  primary: 'text-primary',
  primaryForeground: 'text-primary-foreground',
  secondaryForeground: 'text-secondary-foreground',
  mutedForeground: 'text-muted-foreground',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  progressUp: 'text-progress-up',
  progressSame: 'text-progress-same',
  progressDown: 'text-progress-down'
};

function getIconSize(size: IconSize | number) {
  return typeof size === 'number' ? size : iconSizes[size];
}

export function Icon({
  icon,
  size = iconSizes.md,
  tone = 'foreground',
  strokeWidth = 2,
  ...props
}: AppIconProps) {
  const StyledIcon = createStyledIcon(icon);

  return (
    <StyledIcon
      className={iconToneClassNames[tone]}
      size={getIconSize(size)}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
