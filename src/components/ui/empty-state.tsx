import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { cn } from '@/src/lib/utils/cn.utils';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export type EmptyStateKind =
  | 'empty'
  | 'no-results'
  | 'not-found'
  | 'error'
  | 'unavailable'
  | 'insufficient-data';

export type EmptyStateLayout = 'page' | 'section' | 'inline';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  kind?: EmptyStateKind;
  visual?: ReactNode;
  actions?: ReactNode;
  /** @deprecated Use actions instead. */
  action?: ReactNode;
  layout?: EmptyStateLayout;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  kind = 'empty',
  visual,
  actions,
  action,
  layout = 'page',
  className
}: EmptyStateProps) {
  const isSection = layout === 'section';
  const isInline = layout === 'inline';
  const resolvedActions = actions ?? action;
  const hasVisual = Boolean(visual || icon);

  return (
    <View
      accessibilityLabel={`${kind}: ${title}`}
      className={cn(
        'items-center justify-center',
        isInline
          ? 'flex-row items-center py-2'
          : isSection
            ? 'px-4 py-6'
            : 'flex-1 px-8 py-10',
        className
      )}
    >
      {visual ? (
        <View className={cn(isInline ? 'mr-3' : 'mb-4')}>{visual}</View>
      ) : icon ? (
        isInline ? (
          <View className="mr-3">
            <Icon as={icon} tone="mutedForeground" size="sm" />
          </View>
        ) : isSection ? (
          <View className="border-border bg-muted h-12 w-12 items-center justify-center rounded-md border">
            <Icon as={icon} tone="mutedForeground" size="md" />
          </View>
        ) : (
          <Icon as={icon} tone="mutedForeground" size="empty" />
        )
      ) : null}
      <View className={cn(isInline && 'min-w-0 flex-1')}>
        <Text
          variant={isInline ? 'small' : isSection ? 'bodyMedium' : 'h3'}
          accessibilityRole="header"
          className={cn(
            isInline ? 'text-left' : 'text-center',
            !isInline &&
              hasVisual &&
              (isSection ? 'mt-3' : visual ? 'mt-0' : 'mt-4')
          )}
        >
          {title}
        </Text>
        {description ? (
          <Text
            variant="small"
            tone="muted"
            className={cn(
              isInline ? 'mt-0.5 text-left' : isSection ? 'mt-1' : 'mt-2',
              !isInline && 'text-center'
            )}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {resolvedActions ? (
        <View
          accessibilityLabel="Available actions"
          accessibilityRole="toolbar"
          className={cn(
            'flex-row flex-wrap items-center justify-center gap-3',
            isInline ? 'ml-3' : isSection ? 'mt-4' : 'mt-6'
          )}
        >
          {resolvedActions}
        </View>
      ) : null}
    </View>
  );
}
