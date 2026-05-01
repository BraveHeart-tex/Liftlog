import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { ChoiceChip } from '@/src/components/ui/chip';
import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import {
  CATEGORY_FILTERS,
  MUSCLE_GROUP,
  type ExerciseCategory
} from '@/src/features/exercises/constants';
import { toTitleCase } from '@/src/lib/utils/string';
import { View } from 'react-native';

interface ExerciseMetadataFormProps {
  category: ExerciseCategory;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  name?: string;
  nameError?: string;
  primaryMusclesError?: string;
  secondaryMusclesError?: string;
  inputVariant?: 'default' | 'bottom-sheet';
  setName?: (name: string) => void;
  setCategory: (category: ExerciseCategory) => void;
  togglePrimaryMuscle: (muscle: string) => void;
  toggleSecondaryMuscle: (muscle: string) => void;
}

type CategoryOption = Extract<
  (typeof CATEGORY_FILTERS)[number],
  { readonly value: ExerciseCategory }
>;

const CATEGORY_OPTIONS = CATEGORY_FILTERS.filter(
  (category): category is CategoryOption => category.value !== 'all'
);

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

interface MuscleSelectorSectionProps {
  title: string;
  hint: string;
  muscles: readonly string[];
  selectedMuscles: string[];
  error?: string;
  onToggleMuscle: (muscle: string) => void;
}

function MuscleSelectorSection({
  title,
  hint,
  muscles,
  selectedMuscles,
  error,
  onToggleMuscle
}: MuscleSelectorSectionProps) {
  return (
    <View className="mt-6">
      <Text variant="small">{title}</Text>
      <Text variant="caption" tone="muted" className="mt-1">
        {hint}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {muscles.map(muscle => {
          const isSelected = selectedMuscles.includes(muscle);

          return (
            <ChoiceChip
              key={muscle}
              selected={isSelected}
              onPress={() => onToggleMuscle(muscle)}
            >
              {toTitleCase(muscle)}
            </ChoiceChip>
          );
        })}
      </View>

      {error ? (
        <Text variant="caption" tone="danger" className="mt-2">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function ExerciseMetadataForm({
  category,
  selectedPrimaryMuscles,
  selectedSecondaryMuscles,
  name,
  nameError,
  primaryMusclesError,
  secondaryMusclesError,
  inputVariant = 'default',
  setName,
  setCategory,
  togglePrimaryMuscle,
  toggleSecondaryMuscle
}: ExerciseMetadataFormProps) {
  const shouldShowNameField = typeof name === 'string' && Boolean(setName);
  const NameInput = inputVariant === 'bottom-sheet' ? BottomSheetInput : Input;

  return (
    <View>
      {shouldShowNameField ? (
        <NameInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Incline Bench Press"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          error={nameError}
        />
      ) : null}

      <View className={shouldShowNameField ? 'mt-6' : undefined}>
        <Text variant="small">Category</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {CATEGORY_OPTIONS.map(categoryOption => {
            const isSelected = category === categoryOption.value;

            return (
              <ChoiceChip
                key={categoryOption.value}
                selected={isSelected}
                onPress={() => setCategory(categoryOption.value)}
              >
                {categoryOption.label}
              </ChoiceChip>
            );
          })}
        </View>
      </View>

      <MuscleSelectorSection
        title="Primary muscles"
        hint="Pick at least one."
        muscles={MUSCLE_OPTIONS}
        selectedMuscles={selectedPrimaryMuscles}
        error={primaryMusclesError}
        onToggleMuscle={togglePrimaryMuscle}
      />

      <MuscleSelectorSection
        title="Secondary muscles"
        hint="Optional. Selecting a muscle here removes it from primary."
        muscles={MUSCLE_OPTIONS}
        selectedMuscles={selectedSecondaryMuscles}
        error={secondaryMusclesError}
        onToggleMuscle={toggleSecondaryMuscle}
      />
    </View>
  );
}
