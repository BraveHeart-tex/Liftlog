import { ChoiceChip } from '@/src/components/ui/chip';
import { Text } from '@/src/components/ui/text';
import { MUSCLE_GROUP } from '@/src/features/exercises/exercise.constants';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import { memo, useMemo } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

const MUSCLE_OPTIONS = [
  MUSCLE_GROUP.chest,
  MUSCLE_GROUP.upperChest,
  MUSCLE_GROUP.shoulders,
  MUSCLE_GROUP.frontDelts,
  MUSCLE_GROUP.sideDelts,
  MUSCLE_GROUP.rearDelts,
  MUSCLE_GROUP.rotatorCuff,
  MUSCLE_GROUP.triceps,
  MUSCLE_GROUP.biceps,
  MUSCLE_GROUP.brachialis,
  MUSCLE_GROUP.forearms,
  MUSCLE_GROUP.grip,
  MUSCLE_GROUP.upperBack,
  MUSCLE_GROUP.lats,
  MUSCLE_GROUP.upperTraps,
  MUSCLE_GROUP.lowerBack,
  MUSCLE_GROUP.quads,
  MUSCLE_GROUP.hamstrings,
  MUSCLE_GROUP.glutes,
  MUSCLE_GROUP.calves,
  MUSCLE_GROUP.abs,
  MUSCLE_GROUP.obliques,
  MUSCLE_GROUP.hipFlexors,
  MUSCLE_GROUP.adductors
] as const;

interface ExerciseMuscleSelectorProps {
  title: string;
  hint: string;
  selectedMuscles: string[];
  error?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
  onToggleMuscle: (muscle: string) => void;
}

export const ExerciseMuscleSelector = memo(function ExerciseMuscleSelector({
  title,
  hint,
  selectedMuscles,
  error,
  onLayout,
  onToggleMuscle
}: ExerciseMuscleSelectorProps) {
  const selectedMuscleSet = useMemo(
    () => new Set(selectedMuscles),
    [selectedMuscles]
  );

  return (
    <View className="mt-6" onLayout={onLayout}>
      <Text variant="caption">{title}</Text>
      <Text variant="caption" tone="muted" className="mt-1">
        {hint}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {MUSCLE_OPTIONS.map(muscle => (
          <ChoiceChip
            key={muscle}
            selected={selectedMuscleSet.has(muscle)}
            onPress={() => onToggleMuscle(muscle)}
          >
            {toTitleCase(muscle)}
          </ChoiceChip>
        ))}
      </View>

      {error ? (
        <Text variant="caption" tone="danger" className="mt-2">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
