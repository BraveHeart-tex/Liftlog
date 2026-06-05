import { Card } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { iconSizes } from '@/src/theme/sizes';
import { Link } from 'expo-router';
import { ChevronRightIcon, TrendingUpIcon } from 'lucide-react-native';
import { View } from 'react-native';
import type { ProgressionSuggestionData } from './progression-suggestion-utils';

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
    <Card className="my-3 px-4 py-3">
      <View className="flex-row items-center gap-3">
        <View className="bg-primary/15 h-12 w-12 items-center justify-center rounded-full">
          <Icon icon={TrendingUpIcon} className="text-primary" size="md" />
        </View>

        <View className="min-w-0 flex-1">
          <Text variant="small" tone="muted">
            Last workout
          </Text>
          <Text variant="bodyMedium" numberOfLines={1}>
            {historyPreview.completedSetSummary}
          </Text>
          {suggestedLabel ? (
            <Text variant="caption" tone="muted" className="mt-1">
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
            <Text className="text-primary" variant="small">
              View History
            </Text>
            <Icon
              icon={ChevronRightIcon}
              className="text-primary"
              size={iconSizes.sm}
            />
          </View>
        </Link>
      </View>
    </Card>
  );
}
