import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetSafeContent,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { CATEGORY_FILTERS } from '@/src/features/exercises/exercise.constants';
import type { ExercisePickerEquipmentFilter } from '@/src/features/workouts/components/exercise-picker-filter.types';
import { cn } from '@/src/lib/utils/cn.utils';
import { View } from 'react-native';

interface EquipmentPickerSheetProps {
  isOpen: boolean;
  selectedEquipment: ExercisePickerEquipmentFilter;
  onClose: () => void;
  onSelectEquipment: (equipment: ExercisePickerEquipmentFilter) => void;
}

const EQUIPMENT_OPTIONS: {
  label: string;
  value: ExercisePickerEquipmentFilter;
}[] = [
  { label: 'All equipment', value: null },
  ...CATEGORY_FILTERS.filter(category => category.value !== 'all').map(
    category => ({ label: category.label, value: category.value })
  )
];

export function EquipmentPickerSheet({
  isOpen,
  selectedEquipment,
  onClose,
  onSelectEquipment
}: EquipmentPickerSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      enableDynamicSizing
      stackBehavior="push"
    >
      <BottomSheetHeader className="pb-2">
        <BottomSheetTitle>Equipment</BottomSheetTitle>
      </BottomSheetHeader>

      <BottomSheetSafeContent className="pb-safe-offset-[14px] pt-0">
        <View accessibilityRole="radiogroup">
          {EQUIPMENT_OPTIONS.map(option => {
            const isSelected = option.value === selectedEquipment;

            return (
              <PressableSurface
                key={option.label}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                className="border-border h-12 flex-row items-center justify-between border-b"
                onPress={() => {
                  onSelectEquipment(option.value);
                  onClose();
                }}
              >
                <Text variant="body">{option.label}</Text>
                <View
                  className={cn(
                    'border-border h-5.5 w-5.5 items-center justify-center rounded-full border',
                    isSelected && 'border-primary bg-primary'
                  )}
                >
                  {isSelected ? (
                    <View className="bg-primary-foreground h-1.75 w-1.75 rounded-full" />
                  ) : null}
                </View>
              </PressableSurface>
            );
          })}
        </View>
      </BottomSheetSafeContent>
    </BottomSheet>
  );
}
