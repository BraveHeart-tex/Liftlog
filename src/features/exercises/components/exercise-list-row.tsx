import { Icon } from '@/src/components/ui/icon';
import { ExerciseRow } from '@/src/features/exercises/components/exercise-row';
import type { ExerciseListItem } from '@/src/features/exercises/repository';
import { getPrimaryMuscleLabel } from '@/src/lib/utils/muscle';
import { toTitleCase } from '@/src/lib/utils/string';
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
      rightAccessory={
        <Icon icon={ChevronRightIcon} className="text-muted-foreground" />
      }
    />
  );
}
