import { ChoiceChip } from '@/src/components/ui/chip';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { Text } from '@/src/components/ui/text';
import { MUSCLE_GROUP } from '@/src/features/exercises/exercise.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import { useState } from 'react';
import { View } from 'react-native';

type MuscleRole = 'primary' | 'secondary';

interface ExerciseMusclePickerSheetProps {
  isOpen: boolean;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  onClose: () => void;
  onTogglePrimaryMuscle: (muscle: string) => void;
  onToggleSecondaryMuscle: (muscle: string) => void;
}

const MUSCLE_GROUPS = [
  {
    label: 'Chest & shoulders',
    muscles: [
      MUSCLE_GROUP.chest,
      MUSCLE_GROUP.upperChest,
      MUSCLE_GROUP.shoulders,
      MUSCLE_GROUP.frontDelts,
      MUSCLE_GROUP.sideDelts,
      MUSCLE_GROUP.rearDelts,
      MUSCLE_GROUP.rotatorCuff
    ]
  },
  {
    label: 'Arms & back',
    muscles: [
      MUSCLE_GROUP.triceps,
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.brachialis,
      MUSCLE_GROUP.forearms,
      MUSCLE_GROUP.grip,
      MUSCLE_GROUP.upperBack,
      MUSCLE_GROUP.lats,
      MUSCLE_GROUP.upperTraps,
      MUSCLE_GROUP.lowerBack
    ]
  },
  {
    label: 'Lower body',
    muscles: [
      MUSCLE_GROUP.quads,
      MUSCLE_GROUP.hamstrings,
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.calves,
      MUSCLE_GROUP.hipFlexors,
      MUSCLE_GROUP.adductors
    ]
  },
  {
    label: 'Core',
    muscles: [MUSCLE_GROUP.abs, MUSCLE_GROUP.obliques]
  }
] as const;

export function ExerciseMusclePickerSheet({
  isOpen,
  selectedPrimaryMuscles,
  selectedSecondaryMuscles,
  onClose,
  onTogglePrimaryMuscle,
  onToggleSecondaryMuscle
}: ExerciseMusclePickerSheetProps) {
  const [activeRole, setActiveRole] = useState<MuscleRole>('primary');
  const selectedByRole = {
    primary: new Set(selectedPrimaryMuscles),
    secondary: new Set(selectedSecondaryMuscles)
  };

  const toggleMuscle = (muscle: string) => {
    if (activeRole === 'primary') {
      onTogglePrimaryMuscle(muscle);

      return;
    }

    onToggleSecondaryMuscle(muscle);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={['78%']}
      stackBehavior="push"
    >
      <BottomSheetHeader>
        <BottomSheetTitle>Muscles</BottomSheetTitle>
      </BottomSheetHeader>

      <BottomSheetContent className="pt-0">
        <SegmentedControl
          value={activeRole}
          options={[
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' }
          ]}
          accessibilityMode="tabs"
          className="mb-4"
          onChange={setActiveRole}
        />

        <Text variant="small" tone="muted" className="mb-4">
          <Text variant="small" tone="default" weight="medium">
            {selectedPrimaryMuscles.length || 'No'} primary
          </Text>
          {selectedPrimaryMuscles.length
            ? ` · ${selectedPrimaryMuscles.map(toTitleCase).join(', ')}`
            : ''}
          {'\n'}
          <Text variant="small" tone="default" weight="medium">
            {selectedSecondaryMuscles.length || 'No'} secondary
          </Text>
          {selectedSecondaryMuscles.length
            ? ` · ${selectedSecondaryMuscles.map(toTitleCase).join(', ')}`
            : ''}
        </Text>

        {MUSCLE_GROUPS.map(group => (
          <View key={group.label} className="mb-5">
            <Text variant="overline" tone="muted" className="mb-2">
              {group.label}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {group.muscles.map(muscle => {
                const isSelected = selectedByRole[activeRole].has(muscle);
                const isSelectedInOtherRole =
                  selectedByRole[
                    activeRole === 'primary' ? 'secondary' : 'primary'
                  ].has(muscle);
                const otherRole = activeRole === 'primary' ? 'S' : 'P';

                return (
                  <ChoiceChip
                    key={muscle}
                    selected={isSelected}
                    className={cn(
                      isSelected &&
                        'border-primary-subtle-border bg-primary-subtle',
                      isSelectedInOtherRole &&
                        !isSelected &&
                        'border-primary/50'
                    )}
                    onPress={() => toggleMuscle(muscle)}
                  >
                    <Text
                      variant="small"
                      tone="inherit"
                      className={cn(
                        isSelected ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {toTitleCase(muscle)}
                      {isSelectedInOtherRole && !isSelected
                        ? ` · ${otherRole}`
                        : ''}
                    </Text>
                  </ChoiceChip>
                );
              })}
            </View>
          </View>
        ))}
      </BottomSheetContent>
    </BottomSheet>
  );
}
