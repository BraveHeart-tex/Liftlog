import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { TrackingFieldDefinition } from '@/src/features/progress/tracking';
import type { useSettings } from '@/src/features/settings/hooks';
import { getFieldHeaderLabel } from '@/src/features/workouts/components/set-form/set-form-utils';
import { CheckIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface SetFormHeaderProps {
  fields: TrackingFieldDefinition[];
  weightUnit: ReturnType<typeof useSettings>['weightUnit'];
}

export function SetFormHeader({ fields, weightUnit }: SetFormHeaderProps) {
  return (
    <View className="flex-row items-center gap-2 px-1 pb-2">
      <HeaderCell className="w-10">Set</HeaderCell>
      <HeaderCell className="flex-[1.45]">Previous</HeaderCell>
      {fields.map(field => (
        <HeaderCell key={field.key} className="flex-1 text-center">
          {getFieldHeaderLabel(field, weightUnit)}
        </HeaderCell>
      ))}
      <View className="w-12 items-center">
        <Icon as={CheckIcon} tone="mutedForeground" size="sm" />
      </View>
    </View>
  );
}

function HeaderCell({
  children,
  className
}: {
  children: string;
  className?: string;
}) {
  return (
    <Text variant="overline" tone="muted" className={className}>
      {children}
    </Text>
  );
}
