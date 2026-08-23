import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import {
  TRACKING_TYPE_DEFINITIONS,
  TRACKING_TYPES,
  type TrackingType
} from '@/src/features/progress/tracking.domain';
import { cn } from '@/src/lib/utils/cn.utils';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import { CheckIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface ExerciseTrackingPickerSheetProps {
  isOpen: boolean;
  selectedTrackingType?: TrackingType;
  onClose: () => void;
  onSelectTrackingType: (trackingType: TrackingType) => void;
}

export function ExerciseTrackingPickerSheet({
  isOpen,
  selectedTrackingType,
  onClose,
  onSelectTrackingType
}: ExerciseTrackingPickerSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={['76%']}
      stackBehavior="push"
    >
      <BottomSheetHeader>
        <BottomSheetTitle>Track sets as</BottomSheetTitle>
      </BottomSheetHeader>

      <BottomSheetContent className="pt-0">
        <View accessibilityRole="radiogroup">
          {TRACKING_TYPES.map(trackingType => {
            const definition = TRACKING_TYPE_DEFINITIONS[trackingType];
            const isSelected = selectedTrackingType === trackingType;
            const label = toTitleCase(definition.label.replace(' and ', ' + '));

            return (
              <PressableSurface
                key={trackingType}
                accessibilityLabel={`${label}. ${definition.description}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  'border-border min-h-16 flex-row items-center gap-4 border-b py-3'
                )}
                onPress={() => {
                  onSelectTrackingType(trackingType);
                  onClose();
                }}
              >
                <Icon as={definition.icon} tone="mutedForeground" />
                <View className="min-w-0 flex-1">
                  <Text variant="bodyMedium">{label}</Text>
                  <Text variant="small" tone="muted" className="mt-0.5">
                    {definition.description}
                  </Text>
                </View>
                {isSelected ? <Icon as={CheckIcon} tone="primary" /> : null}
              </PressableSurface>
            );
          })}
        </View>
      </BottomSheetContent>
    </BottomSheet>
  );
}
