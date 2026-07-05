import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import type { ProgressionSuggestionData } from '@/src/features/workouts/components/progression-suggestion.utils';
import { formatWeightForUnit } from '@/src/lib/utils/weight.utils';
import { iconSizes } from '@/src/theme/sizes';
import { Link } from 'expo-router';
import { ChevronRightIcon, TrendingUpIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface ProgressionSuggestionProps {
  workoutExerciseId: string;
  historyPreview:
    | {
        completedSetSummary: string | undefined;
        completedSetCount: number;
      }
    | undefined;
  suggestion: ProgressionSuggestionData | null;
}

export function ProgressionSuggestion({
  workoutExerciseId,
  historyPreview,
  suggestion
}: ProgressionSuggestionProps) {
  const { weightUnit } = useSettings();

  if (!historyPreview) {
    return null;
  }

  const suggestedLabel = suggestion
    ? `${formatWeightForUnit(suggestion.suggestedWeightKg, weightUnit)} ${weightUnit} x ${
        suggestion.suggestedReps
      }`
    : null;

  return (
    <View className="border-border bg-card mb-5 rounded-lg border px-3 py-2">
      <View className="flex-row items-center gap-2">
        <View className="bg-primary/10 h-8 w-8 items-center justify-center rounded-lg">
          <Icon as={TrendingUpIcon} tone="primary" size="sm" />
        </View>

        <View className="min-w-0 flex-1">
          <Text variant="small" numberOfLines={1}>
            {historyPreview.completedSetSummary}
          </Text>
          {suggestedLabel ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Suggested: {suggestedLabel}
            </Text>
          ) : null}
        </View>

        <Link
          href={{
            pathname: '/(tabs)/workout/exercise/[workoutExerciseId]/history',
            params: { workoutExerciseId }
          }}
        >
          <View className="flex-row items-center gap-1">
            <Text tone="primary" variant="small">
              History
            </Text>
            <Icon as={ChevronRightIcon} tone="primary" size={iconSizes.sm} />
          </View>
        </Link>
      </View>
    </View>
  );
}
