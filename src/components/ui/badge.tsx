import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  className?: string;
}

const baseClassName =
  'self-start rounded-md px-2 py-0.5 text-caption font-medium';

const variantClassNames: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-accent-foreground',
  warning: 'bg-warning text-accent-foreground',
  danger: 'bg-danger text-primary-foreground',
  info: 'bg-info text-primary-foreground',
  outline: 'border border-border text-foreground'
};

export function Badge({ variant = 'default', label, className }: BadgeProps) {
  return (
    <Text
      variant="caption"
      className={cn(baseClassName, variantClassNames[variant], className)}
    >
      {label}
    </Text>
  );
}
