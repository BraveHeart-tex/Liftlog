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
import { CheckIcon, PlusIcon } from 'lucide-react-native';
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
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="bodyMedium" className="font-semibold">
            Presets
          </Text>
          <Text variant="caption" className="text-secondary-foreground">
            Hold a preset to edit
          </Text>
        </View>
        <Button
          variant="secondary"
          size="sm"
          containerClassName="shrink-0"
          className="min-h-11 py-2"
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
                'border-border bg-card h-[52px] flex-row items-center gap-3 rounded-md border px-3.5',
                isSelected && 'border-primary bg-primary/10'
              )}
              onPress={() => onPresetPress(preset)}
              onLongPress={() => onPresetLongPress(preset)}
            >
              <View
                className={cn(
                  'border-border h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  isSelected && 'border-primary bg-primary'
                )}
              >
                {isSelected ? (
                  <Icon as={CheckIcon} size="xs" tone="primaryForeground" />
                ) : null}
              </View>
              <Text
                variant="bodyMedium"
                numberOfLines={1}
                className="flex-1 font-semibold"
              >
                {preset.name}
              </Text>
              <Text
                variant="bodyMedium"
                tone={isSelected ? 'primary' : 'default'}
                className={cn(
                  'w-14 text-right font-semibold',
                  !isSelected && 'text-secondary-foreground'
                )}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatTimerDuration(preset.durationSeconds)}
              </Text>
            </PressableSurface>
          );
        })}
      </View>
    </View>
  );
}
