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
import { useEffect, useRef } from 'react';
import { Keyboard, View, type LayoutChangeEvent } from 'react-native';

interface ExerciseMetadataFormProps {
  category: ExerciseCategory;
  selectedPrimaryMuscles: string[];
  selectedSecondaryMuscles: string[];
  name?: string;
  nameError?: string;
  primaryMusclesError?: string;
  secondaryMusclesError?: string;
  inputVariant?: 'default' | 'bottom-sheet';
  errorScrollRequestId?: number;
  onScrollToError?: (y: number) => void;
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
  onLayout?: (event: LayoutChangeEvent) => void;
  onToggleMuscle: (muscle: string) => void;
}

function MuscleSelectorSection({
  title,
  hint,
  muscles,
  selectedMuscles,
  error,
  onLayout,
  onToggleMuscle
}: MuscleSelectorSectionProps) {
  return (
    <View className="mt-6" onLayout={onLayout}>
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

type ErrorTarget = 'name' | 'primaryMuscles' | 'secondaryMuscles';

interface FocusableInput {
  focus: () => void;
}

const ERROR_SCROLL_OFFSET = 16;

export function ExerciseMetadataForm({
  category,
  selectedPrimaryMuscles,
  selectedSecondaryMuscles,
  name,
  nameError,
  primaryMusclesError,
  secondaryMusclesError,
  inputVariant = 'default',
  errorScrollRequestId,
  onScrollToError,
  setName,
  setCategory,
  togglePrimaryMuscle,
  toggleSecondaryMuscle
}: ExerciseMetadataFormProps) {
  const shouldShowNameField = typeof name === 'string' && Boolean(setName);
  const nameInputRef = useRef<FocusableInput | null>(null);
  const lastHandledErrorScrollRequestId = useRef<number | undefined>(undefined);
  const sectionYByTarget = useRef<Record<ErrorTarget, number>>({
    name: 0,
    primaryMuscles: 0,
    secondaryMuscles: 0
  });

  const recordSectionLayout =
    (target: ErrorTarget) => (event: LayoutChangeEvent) => {
      sectionYByTarget.current[target] = event.nativeEvent.layout.y;
    };
  const setNameInputRef = (input: FocusableInput | null | undefined) => {
    nameInputRef.current = input ?? null;
  };

  useEffect(() => {
    if (
      errorScrollRequestId === undefined ||
      errorScrollRequestId === lastHandledErrorScrollRequestId.current
    ) {
      return;
    }

    const firstErrorTarget = nameError
      ? 'name'
      : primaryMusclesError
        ? 'primaryMuscles'
        : secondaryMusclesError
          ? 'secondaryMuscles'
          : undefined;

    if (!firstErrorTarget) {
      return;
    }

    lastHandledErrorScrollRequestId.current = errorScrollRequestId;

    const targetY = Math.max(
      sectionYByTarget.current[firstErrorTarget] - ERROR_SCROLL_OFFSET,
      0
    );

    if (firstErrorTarget !== 'name') {
      Keyboard.dismiss();
    }

    onScrollToError?.(targetY);

    if (firstErrorTarget === 'name') {
      nameInputRef.current?.focus();
    }
  }, [
    errorScrollRequestId,
    nameError,
    onScrollToError,
    primaryMusclesError,
    secondaryMusclesError
  ]);

  return (
    <View>
      {shouldShowNameField ? (
        <View onLayout={recordSectionLayout('name')}>
          {inputVariant === 'bottom-sheet' ? (
            <BottomSheetInput
              ref={setNameInputRef}
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Incline Bench Press"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              error={nameError}
            />
          ) : (
            <Input
              ref={setNameInputRef}
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Incline Bench Press"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              error={nameError}
            />
          )}
        </View>
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
        onLayout={recordSectionLayout('primaryMuscles')}
        onToggleMuscle={togglePrimaryMuscle}
      />

      <MuscleSelectorSection
        title="Secondary muscles"
        hint="Optional. Selecting a muscle here removes it from primary."
        muscles={MUSCLE_OPTIONS}
        selectedMuscles={selectedSecondaryMuscles}
        error={secondaryMusclesError}
        onLayout={recordSectionLayout('secondaryMuscles')}
        onToggleMuscle={toggleSecondaryMuscle}
      />
    </View>
  );
}
