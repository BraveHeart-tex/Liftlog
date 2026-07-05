import { Icon } from '@/src/components/ui/icon';
import { ExerciseRow } from '@/src/features/exercises/components/exercise-row';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { getPrimaryMuscleLabel } from '@/src/features/exercises/muscle.utils';
import { toTitleCase } from '@/src/lib/utils/string.utils';
import { ChevronRightIcon } from 'lucide-react-native';

interface ExerciseListRowProps {
  exercise: ExerciseListItem;
  onPress: (exercise: ExerciseListItem) => void;
}

export function ExerciseListRow({ exercise, onPress }: ExerciseListRowProps) {
  const metadataLabel = toTitleCase(
    getPrimaryMuscleLabel(exercise.primaryMuscles)
  );

  return (
    <ExerciseRow
      exercise={exercise}
      subtitle={metadataLabel}
      onPress={onPress}
      rightAccessory={<Icon as={ChevronRightIcon} tone="mutedForeground" />}
    />
  );
}
