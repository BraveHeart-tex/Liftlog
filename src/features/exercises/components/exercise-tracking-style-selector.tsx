import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import {
  TRACKING_TYPE_DEFINITIONS,
  TRACKING_TYPES,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { cn } from '@/src/lib/utils/cn.utils';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import { View } from 'react-native';

const TRACKING_TYPE_ROWS = [
  TRACKING_TYPES.slice(0, 3),
  TRACKING_TYPES.slice(3)
];

interface ExerciseTrackingStyleSelectorProps {
  trackingType: TrackingType;
  onSelectTrackingType: (trackingType: TrackingType) => void;
}

export function ExerciseTrackingStyleSelector({
  trackingType,
  onSelectTrackingType
}: ExerciseTrackingStyleSelectorProps) {
  return (
    <View className="mt-6">
      <Text variant="overline">3. Tracking Style</Text>
      <Text variant="caption" tone="muted" className="mt-1">
        How you&apos;ll record sets for this exercise.
      </Text>
      <View
        accessibilityLabel="Tracking style"
        accessibilityRole="radiogroup"
        className="mt-3 gap-2"
      >
        {TRACKING_TYPE_ROWS.map(row => (
          <View key={row[0]} className="flex-row items-stretch gap-2">
            {row.map(option => {
              const isSelected = trackingType === option;
              const definition = TRACKING_TYPE_DEFINITIONS[option];
              const label = toTitleCase(
                definition.label.replace(' and ', ' & ')
              );

              return (
                <Button
                  variant="secondary"
                  key={option}
                  accessibilityLabel={`${label}. ${definition.description}`}
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    'h-full min-h-24 items-start justify-center px-3 py-4',
                    isSelected && 'border-primary bg-primary/10'
                  )}
                  containerClassName="min-w-0 h-26 flex-1"
                  onPress={() => onSelectTrackingType(option)}
                >
                  <View className="w-full min-w-0 flex-row items-start gap-2">
                    <Icon
                      as={definition.icon}
                      tone={isSelected ? 'primary' : 'foreground'}
                    />
                    <View className="min-w-0 flex-1 gap-1">
                      <Text
                        variant="small"
                        tone={isSelected ? 'primary' : 'default'}
                      >
                        {label}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {definition.description}
                      </Text>
                    </View>
                  </View>
                </Button>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
