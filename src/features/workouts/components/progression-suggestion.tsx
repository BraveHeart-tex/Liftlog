import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { useSettings } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatWeightForUnit } from '@/src/lib/utils/weight';
import { TrendingUpIcon } from 'lucide-react-native';
import { View } from 'react-native';
import type { ProgressionSuggestionData } from './progression-suggestion-utils';

interface ProgressionSuggestionProps {
  suggestion: ProgressionSuggestionData | null;
  onUseSuggestion: (suggestion: ProgressionSuggestionData) => void;
}

function formatSignedWeight(valueKg: number, unit: 'kg' | 'lb') {
  const formattedValue = formatWeightForUnit(Math.abs(valueKg), unit);
  const sign = valueKg > 0 ? '+' : valueKg < 0 ? '-' : '';

  return `${sign}${formattedValue} ${unit}`;
}

function getTrendClassName(valueKg: number | null) {
  if (valueKg === null || valueKg === 0) {
    return 'text-progress-same';
  }

  return valueKg > 0 ? 'text-progress-up' : 'text-progress-down';
}

function getLastFourLabel(valueKg: number | null, unit: 'kg' | 'lb') {
  if (valueKg === null) {
    return null;
  }

  return `${valueKg >= 0 ? 'Up' : 'Down'} ${formatWeightForUnit(
    Math.abs(valueKg),
    unit
  )} ${unit}`;
}

export function ProgressionSuggestion({
  suggestion,
  onUseSuggestion
}: ProgressionSuggestionProps) {
  const { weightUnit } = useSettings();

  if (!suggestion) {
    return null;
  }

  const suggestedWeight = formatWeightForUnit(
    suggestion.suggestedWeightKg,
    weightUnit
  );
  const previousWeight = formatWeightForUnit(
    suggestion.previousWeightKg,
    weightUnit
  );
  const isIncreaseSuggestion = suggestion.kind === 'increase-weight';
  const trendLabel = getLastFourLabel(suggestion.lastFourDeltaKg, weightUnit);

  return (
    <Card className="my-3 px-3 py-2">
      <View className="flex-row items-center gap-3">
        <Icon icon={TrendingUpIcon} className="text-primary" size={18} />

        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text variant="small">
              {isIncreaseSuggestion ? 'Try adding weight' : 'Last set'}
            </Text>
            <Text variant="caption" tone="muted">
              {previousWeight} {weightUnit} x {suggestion.previousReps}
            </Text>
          </View>
          <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <Text variant="caption" tone="muted">
              1RM {formatWeightForUnit(suggestion.estimated1rmKg, weightUnit)}{' '}
              {weightUnit}
            </Text>
            {suggestion.estimated1rmDeltaKg !== null ? (
              <Text
                variant="caption"
                className={getTrendClassName(suggestion.estimated1rmDeltaKg)}
              >
                {formatSignedWeight(suggestion.estimated1rmDeltaKg, weightUnit)}
              </Text>
            ) : null}
            {trendLabel ? (
              <Text
                variant="caption"
                className={cn(getTrendClassName(suggestion.lastFourDeltaKg))}
              >
                {trendLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <Button
          variant="secondary"
          size="sm"
          textClassName="text-primary text-small"
          onPress={() => onUseSuggestion(suggestion)}
        >
          {`Use ${suggestedWeight} ${weightUnit}`}
        </Button>
      </View>
    </Card>
  );
}
