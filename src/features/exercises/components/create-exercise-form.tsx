import { Input } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import {
  CATEGORY_FILTERS,
  MUSCLE_GROUP,
  type ExerciseCategory
} from '@/src/features/exercises/constants';
import { cn } from '@/src/lib/utils/cn';
import { toTitleCase } from '@/src/lib/utils/string';
import { Pressable, View } from 'react-native';

interface CreateExerciseFormProps {
  name: string;
  category: ExerciseCategory;
  selectedPrimaryMuscles: string[];
  nameError?: string;
  primaryMusclesError?: string;
  setName: (name: string) => void;
  setCategory: (category: ExerciseCategory) => void;
  togglePrimaryMuscle: (muscle: string) => void;
}

type CategoryOption = Extract<
  (typeof CATEGORY_FILTERS)[number],
  { readonly value: ExerciseCategory }
>;

const CATEGORY_OPTIONS = CATEGORY_FILTERS.filter(
  (category): category is CategoryOption => category.value !== 'all'
);

const PRIMARY_MUSCLE_OPTIONS = [
  MUSCLE_GROUP.chest,
  MUSCLE_GROUP.upperChest,
  MUSCLE_GROUP.shoulders,
  MUSCLE_GROUP.frontDelts,
  MUSCLE_GROUP.sideDelts,
  MUSCLE_GROUP.rearDelts,
  MUSCLE_GROUP.triceps,
  MUSCLE_GROUP.biceps,
  MUSCLE_GROUP.forearms,
  MUSCLE_GROUP.upperBack,
  MUSCLE_GROUP.lats,
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

export function CreateExerciseForm({
  name,
  category,
  selectedPrimaryMuscles,
  nameError,
  primaryMusclesError,
  setName,
  setCategory,
  togglePrimaryMuscle
}: CreateExerciseFormProps) {
  return (
    <View>
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Incline Bench Press"
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        error={nameError}
      />

      <View className="mt-6">
        <Text variant="small">Category</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {CATEGORY_OPTIONS.map(categoryOption => {
            const isSelected = category === categoryOption.value;

            return (
              <Pressable
                key={categoryOption.value}
                onPress={() => setCategory(categoryOption.value)}
                className={cn(
                  'border-border rounded-full border px-4 py-3',
                  isSelected ? 'bg-primary' : 'bg-input'
                )}
              >
                <Text
                  variant="small"
                  className={cn(
                    isSelected ? 'text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {categoryOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-6">
        <Text variant="small">Primary muscles</Text>
        <Text variant="caption" tone="muted" className="mt-1">
          Pick at least one.
        </Text>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {PRIMARY_MUSCLE_OPTIONS.map(muscle => {
            const isSelected = selectedPrimaryMuscles.includes(muscle);

            return (
              <Pressable
                key={muscle}
                onPress={() => togglePrimaryMuscle(muscle)}
                className={cn(
                  'border-border rounded-full border px-4 py-3',
                  isSelected ? 'bg-primary' : 'bg-input'
                )}
              >
                <Text
                  variant="small"
                  className={cn(
                    isSelected ? 'text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {toTitleCase(muscle)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {primaryMusclesError ? (
          <Text variant="caption" tone="danger" className="mt-2">
            {primaryMusclesError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
