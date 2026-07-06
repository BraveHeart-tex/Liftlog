import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle
} from '@/src/components/ui/bottom-sheet';
import { BottomSheetInput } from '@/src/components/ui/bottom-sheet-input';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { RestTimerDurationPicker } from '@/src/features/workouts/components/rest-timer-duration-picker';
import {
  REST_TIMER_PRESET_NAME_MAX_LENGTH,
  type RestTimerPreset
} from '@/src/features/settings/settings.repository';
import {
  MAX_REST_TIMER_SECONDS,
  MIN_REST_TIMER_SECONDS
} from '@/src/features/workouts/stores/rest-timer.store';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import { SaveIcon, Trash2Icon, XIcon } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

interface RestTimerPresetEditorSheetProps {
  isOpen: boolean;
  preset: RestTimerPreset | null;
  defaultDuration: number;
  onClose: () => void;
  onSave: (preset: Omit<RestTimerPreset, 'id'>) => void;
  onDelete: (preset: RestTimerPreset) => void;
}

export function RestTimerPresetEditorSheet({
  isOpen,
  preset,
  defaultDuration,
  onClose,
  onSave,
  onDelete
}: RestTimerPresetEditorSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      enableDynamicSizing
      keyboardBehavior="interactive"
      enableContentPanningGesture={false}
    >
      {({ isContentReady }) => (
        <RestTimerPresetEditorSheetContent
          isOpen={isOpen}
          preset={preset}
          defaultDuration={defaultDuration}
          renderWheels={isContentReady}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </BottomSheet>
  );
}

interface RestTimerPresetEditorSheetContentProps extends RestTimerPresetEditorSheetProps {
  renderWheels: boolean;
}

const RestTimerPresetEditorSheetContent = memo(
  function RestTimerPresetEditorSheetContent({
    isOpen,
    preset,
    defaultDuration,
    renderWheels,
    onClose,
    onSave,
    onDelete
  }: RestTimerPresetEditorSheetContentProps) {
    const [name, setName] = useState('');
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const minutesRef = useRef(0);
    const secondsRef = useRef(0);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const nextDuration = preset?.durationSeconds ?? defaultDuration;
      const nextTimerParts = getTimerParts(nextDuration);

      setName(preset?.name ?? '');
      minutesRef.current = nextTimerParts.minutes;
      secondsRef.current = nextTimerParts.seconds;
      setMinutes(nextTimerParts.minutes);
      setSeconds(nextTimerParts.seconds);
    }, [defaultDuration, isOpen, preset]);

    const trimmedName = name.trim();
    const totalSeconds = minutes * 60 + seconds;
    const canSave =
      trimmedName.length > 0 &&
      totalSeconds >= MIN_REST_TIMER_SECONDS &&
      totalSeconds <= MAX_REST_TIMER_SECONDS;

    const handleNameChange = useCallback((nextName: string) => {
      setName(nextName.slice(0, REST_TIMER_PRESET_NAME_MAX_LENGTH));
    }, []);

    const handleSave = useCallback(() => {
      const selectedTotalSeconds = minutesRef.current * 60 + secondsRef.current;
      const selectedName = name.trim();

      if (
        !selectedName ||
        selectedTotalSeconds < MIN_REST_TIMER_SECONDS ||
        selectedTotalSeconds > MAX_REST_TIMER_SECONDS
      ) {
        return;
      }

      onSave({
        name: selectedName,
        durationSeconds: selectedTotalSeconds
      });
    }, [name, onSave]);

    const handleDelete = useCallback(() => {
      if (!preset) {
        return;
      }

      onDelete(preset);
    }, [onDelete, preset]);

    const handleMinutesChanging = useCallback((value: number) => {
      minutesRef.current = value;
    }, []);

    const handleMinutesChange = useCallback((value: number) => {
      minutesRef.current = value;
      setMinutes(value);
    }, []);

    const handleSecondsChanging = useCallback((value: number) => {
      secondsRef.current = value;
    }, []);

    const handleSecondsChange = useCallback((value: number) => {
      secondsRef.current = value;
      setSeconds(value);
    }, []);

    return (
      <>
        <BottomSheetHeader className="flex-row items-center justify-between">
          <BottomSheetTitle>
            {preset ? 'Edit Preset' : 'Add Preset'}
          </BottomSheetTitle>
          <Button
            variant="secondary"
            size="icon"
            onPress={onClose}
            accessibilityLabel="Close preset editor"
            className="px-0"
          >
            <Icon as={XIcon} size="lg" tone="foreground" />
          </Button>
        </BottomSheetHeader>

        <View className="pb-safe-offset-4 gap-5 px-4 pt-2">
          <BottomSheetInput
            label="Name"
            value={name}
            maxLength={REST_TIMER_PRESET_NAME_MAX_LENGTH}
            placeholder="Preset name"
            returnKeyType="done"
            error={
              !trimmedName && name.length > 0 ? 'Name is required.' : undefined
            }
            onChangeText={handleNameChange}
            onSubmitEditing={handleSave}
          />

          <RestTimerDurationPicker
            minutes={minutes}
            seconds={seconds}
            renderWhen={isOpen && renderWheels}
            className="-mt-2"
            onMinutesChanging={handleMinutesChanging}
            onMinutesChange={handleMinutesChange}
            onSecondsChanging={handleSecondsChanging}
            onSecondsChange={handleSecondsChange}
          />

          <View className="flex-row gap-3">
            {preset && (
              <Button
                variant="destructive"
                containerClassName="flex-1"
                leftIcon={<Icon as={Trash2Icon} tone="danger" />}
                onPress={handleDelete}
              >
                Delete
              </Button>
            )}

            <Button
              disabled={!canSave}
              containerClassName="flex-1"
              leftIcon={<Icon as={SaveIcon} tone="primaryForeground" />}
              onPress={handleSave}
            >
              Save
            </Button>
          </View>
        </View>
      </>
    );
  }
);
