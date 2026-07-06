import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import {
  MAX_REST_TIMER_PRESETS,
  type RestTimerPreset
} from '@/src/features/settings/settings.repository';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatTimerDuration } from '@/src/lib/utils/date.utils';
import { PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface RestTimerPresetListProps {
  presets: RestTimerPreset[];
  selectedDurationSeconds: number;
  onAddPreset: () => void;
  onPresetPress: (preset: RestTimerPreset) => void;
  onPresetLongPress: (preset: RestTimerPreset) => void;
}

export function RestTimerPresetList({
  presets,
  selectedDurationSeconds,
  onAddPreset,
  onPresetPress,
  onPresetLongPress
}: RestTimerPresetListProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="small" tone="muted">
          Presets
        </Text>
        <Button
          variant="ghost"
          size="sm"
          disabled={presets.length >= MAX_REST_TIMER_PRESETS}
          leftIcon={<Icon as={PlusIcon} size="sm" tone="foreground" />}
          onPress={onAddPreset}
        >
          Add
        </Button>
      </View>
      <View className="gap-2">
        {presets.map(preset => {
          const isSelected = preset.durationSeconds === selectedDurationSeconds;

          return (
            <PressableSurface
              key={preset.id}
              accessibilityLabel={`${preset.name}, ${formatTimerDuration(
                preset.durationSeconds
              )}`}
              accessibilityHint="Loads this rest timer preset. Long press to edit."
              accessibilityState={{ selected: isSelected }}
              className={cn(
                'border-border bg-card flex-row items-center justify-between rounded-lg border px-4 py-3',
                isSelected && 'border-primary bg-primary/10'
              )}
              onPress={() => onPresetPress(preset)}
              onLongPress={() => onPresetLongPress(preset)}
            >
              <Text variant="bodyMedium" numberOfLines={1} className="flex-1">
                {preset.name}
              </Text>
              <Text variant="bodyMedium" tone="muted">
                {formatTimerDuration(preset.durationSeconds)}
              </Text>
            </PressableSurface>
          );
        })}
      </View>
    </View>
  );
}
