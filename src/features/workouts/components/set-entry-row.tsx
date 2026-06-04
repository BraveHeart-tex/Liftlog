import { Text } from '@/src/components/ui/text';
import type { Set } from '@/src/db/schema';
import {
  TRACKING_TYPE_DEFINITIONS,
  formatTrackingValue,
  getSetValues,
  type TrackingType
} from '@/src/features/progress/tracking';
import { useSettings } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import { Pressable, View } from 'react-native';

interface SetEntryRowProps {
  set: Set;
  setNumber: number;
  isPR: boolean;
  isEditing: boolean;
  trackingType: TrackingType;
  onEdit: () => void;
}

export function SetEntryRow({
  set,
  setNumber,
  isPR,
  isEditing,
  trackingType,
  onEdit
}: SetEntryRowProps) {
  const { weightUnit } = useSettings();
  const trackingDefinition = TRACKING_TYPE_DEFINITIONS[trackingType];

  return (
    <Pressable onPress={onEdit}>
      <View
        className={cn(
          'border-border bg-background relative flex-row items-center gap-3 border-b py-3',
          isEditing && 'bg-muted/50'
        )}
      >
        <View className="bg-muted h-12 w-12 items-center justify-center rounded-md">
          <Text variant="caption" tone="muted">
            Set
          </Text>
          <Text variant="bodyMedium">{setNumber}</Text>
        </View>
        <View className="flex-1">
          <Text variant="caption" tone="muted">
            {trackingDefinition.label}
          </Text>
          <Text variant="bodyMedium" className="mt-1">
            {formatTrackingValue(trackingType, getSetValues(set), weightUnit)}
          </Text>
        </View>
        {isPR ? (
          <View className="items-center justify-center">
            <View className="bg-success/15 rounded-md px-2 py-1">
              <Text variant="caption" className="text-success">
                PR
              </Text>
            </View>
          </View>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </Pressable>
  );
}
