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
  CATEGORY_FILTERS,
  type ExerciseCategory
} from '@/src/features/exercises/exercise.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import {
  CableIcon,
  CheckIcon,
  CircleOffIcon,
  DumbbellIcon,
  PersonStandingIcon,
  Settings2Icon,
  WeightIcon,
  type LucideIcon
} from 'lucide-react-native';
import { View } from 'react-native';

interface ExerciseEquipmentPickerSheetProps {
  isOpen: boolean;
  selectedEquipment: ExerciseCategory | null;
  onClose: () => void;
  onSelectEquipment: (equipment: ExerciseCategory | null) => void;
}

const EQUIPMENT_OPTIONS: {
  label: string;
  value: ExerciseCategory | null;
  icon: LucideIcon;
}[] = [
  { label: 'Not set', value: null, icon: CircleOffIcon },
  ...CATEGORY_FILTERS.filter(category => category.value !== 'all').map(
    category => ({
      label: category.label,
      value: category.value,
      icon: {
        barbell: WeightIcon,
        dumbbell: DumbbellIcon,
        machine: Settings2Icon,
        cable: CableIcon,
        bodyweight: PersonStandingIcon
      }[category.value]
    })
  )
];

export function ExerciseEquipmentPickerSheet({
  isOpen,
  selectedEquipment,
  onClose,
  onSelectEquipment
}: ExerciseEquipmentPickerSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={['60%']}
      stackBehavior="push"
    >
      <BottomSheetHeader>
        <BottomSheetTitle>Equipment</BottomSheetTitle>
      </BottomSheetHeader>

      <BottomSheetContent className="pt-0">
        <View accessibilityRole="radiogroup">
          {EQUIPMENT_OPTIONS.map(option => {
            const isSelected = option.value === selectedEquipment;

            return (
              <PressableSurface
                key={option.label}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  'border-border min-h-14 flex-row items-center gap-3 border-b py-2'
                )}
                onPress={() => {
                  onSelectEquipment(option.value);
                  onClose();
                }}
              >
                <Icon as={option.icon} tone="mutedForeground" />
                <Text variant="bodyMedium" className="flex-1">
                  {option.label}
                </Text>
                {isSelected ? <Icon as={CheckIcon} tone="primary" /> : null}
              </PressableSurface>
            );
          })}
        </View>
      </BottomSheetContent>
    </BottomSheet>
  );
}
