import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import type { RestTimerPreset } from '@/src/features/settings/settings.repository';
import { RestTimerDurationPicker } from '@/src/features/rest-timer/components/rest-timer-duration-picker';
import { RestTimerPresetEditorSheet } from '@/src/features/rest-timer/components/rest-timer-preset-editor-sheet';
import { RestTimerPresetList } from '@/src/features/rest-timer/components/rest-timer-preset-list';
import {
  MIN_REST_TIMER_SECONDS,
  type RestTimerContext,
  useRestTimerStore
} from '@/src/features/rest-timer/rest-timer.store';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import {
  triggerHapticLight,
  triggerHapticWarning
} from '@/src/lib/haptics/haptics';
import { PlayIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

interface RestTimerIdleContentProps {
  defaultDuration: number;
  context?: RestTimerContext;
  openToken: number;
}

function getDurationDraft(durationSeconds: number) {
  return getTimerParts(durationSeconds);
}

export function RestTimerIdleContent({
  defaultDuration,
  context,
  openToken
}: RestTimerIdleContentProps) {
  const {
    restTimerPresets,
    setRestTimerDuration,
    addRestTimerPreset,
    updateRestTimerPreset,
    deleteRestTimerPreset
  } = useSettings();
  const startTimer = useRestTimerStore(state => state.start);
  const lastOpenTokenRef = useRef(openToken);
  const [durationDraft] = useState(() => getDurationDraft(defaultDuration));
  const [minutes, setMinutes] = useState(durationDraft.minutes);
  const [seconds, setSeconds] = useState(durationDraft.seconds);
  const [editingPreset, setEditingPreset] = useState<RestTimerPreset | null>(
    null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const minutesRef = useRef(durationDraft.minutes);
  const secondsRef = useRef(durationDraft.seconds);
  const totalSeconds = minutes * 60 + seconds;
  const canStart = totalSeconds >= MIN_REST_TIMER_SECONDS;

  useEffect(() => {
    if (openToken === lastOpenTokenRef.current) {
      return;
    }

    lastOpenTokenRef.current = openToken;
    const nextDraft = getDurationDraft(defaultDuration);

    minutesRef.current = nextDraft.minutes;
    secondsRef.current = nextDraft.seconds;
    setMinutes(nextDraft.minutes);
    setSeconds(nextDraft.seconds);
  }, [defaultDuration, openToken]);

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

  const handleStart = () => {
    const liveTotalSeconds = minutesRef.current * 60 + secondsRef.current;
    const draftTotalSeconds = minutes * 60 + seconds;
    const selectedTotalSeconds =
      liveTotalSeconds >= MIN_REST_TIMER_SECONDS
        ? liveTotalSeconds
        : draftTotalSeconds;

    if (selectedTotalSeconds < MIN_REST_TIMER_SECONDS) {
      return;
    }

    if (startTimer(selectedTotalSeconds, context)) {
      triggerHapticLight('rest timer start');
    }
  };

  const setDurationDraft = useCallback((nextDurationSeconds: number) => {
    const nextDraft = getDurationDraft(nextDurationSeconds);

    minutesRef.current = nextDraft.minutes;
    secondsRef.current = nextDraft.seconds;
    setMinutes(nextDraft.minutes);
    setSeconds(nextDraft.seconds);
  }, []);

  const handlePresetPress = useCallback(
    (preset: RestTimerPreset) => {
      setDurationDraft(preset.durationSeconds);
      setRestTimerDuration(preset.durationSeconds);
    },
    [setDurationDraft, setRestTimerDuration]
  );

  const openAddPreset = useCallback(() => {
    setEditingPreset(null);
    setIsEditorOpen(true);
  }, []);

  const openEditPreset = useCallback((preset: RestTimerPreset) => {
    setEditingPreset(preset);
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  const handleSavePreset = useCallback(
    (preset: Omit<RestTimerPreset, 'id'>) => {
      try {
        if (editingPreset) {
          updateRestTimerPreset({ ...editingPreset, ...preset });
        } else {
          addRestTimerPreset(preset);
        }
      } catch (error) {
        const isPresetLimitError =
          error instanceof RangeError &&
          error.message === 'Only 8 rest timer presets are allowed.';

        console.error('Failed to save rest timer preset', error);
        showSnackbar({
          message: isPresetLimitError
            ? 'Only 8 rest timer presets are allowed.'
            : 'Could not save rest timer preset. Please try again.',
          variant: isPresetLimitError ? 'warning' : 'danger'
        });

        return;
      }

      setIsEditorOpen(false);
    },
    [addRestTimerPreset, editingPreset, updateRestTimerPreset]
  );

  const handleDeletePreset = useCallback(
    (preset: RestTimerPreset) => {
      void confirmDialog({
        title: 'Delete preset?',
        message: `${preset.name} will be removed.`,
        confirmLabel: 'Delete',
        destructive: true
      }).then(confirmed => {
        if (!confirmed) {
          return;
        }

        try {
          if (!deleteRestTimerPreset(preset.id)) {
            showSnackbar({
              message: 'This preset may have already been deleted.',
              variant: 'warning'
            });

            return;
          }

          triggerHapticWarning('rest timer preset deletion');
          setIsEditorOpen(false);
          showSnackbar({ message: 'Preset deleted.', variant: 'success' });
        } catch (error) {
          console.error('Failed to delete rest timer preset', error);
          showSnackbar({
            message: 'Could not delete rest timer preset. Please try again.',
            variant: 'danger'
          });
        }
      });
    },
    [deleteRestTimerPreset]
  );

  return (
    <>
      <View className="items-center">
        <RestTimerDurationPicker
          minutes={minutes}
          seconds={seconds}
          onMinutesChanging={handleMinutesChanging}
          onMinutesChange={handleMinutesChange}
          onSecondsChanging={handleSecondsChanging}
          onSecondsChange={handleSecondsChange}
        />
      </View>

      <Button
        fullWidth
        size="lg"
        disabled={!canStart}
        leftIcon={<Icon as={PlayIcon} tone="primaryForeground" />}
        onPress={handleStart}
      >
        Start rest
      </Button>

      <RestTimerPresetList
        presets={restTimerPresets}
        selectedDurationSeconds={totalSeconds}
        onAddPreset={openAddPreset}
        onPresetPress={handlePresetPress}
        onPresetLongPress={openEditPreset}
      />

      {isEditorOpen ? (
        <RestTimerPresetEditorSheet
          isOpen
          preset={editingPreset}
          defaultDuration={totalSeconds}
          onClose={closeEditor}
          onSave={handleSavePreset}
          onDelete={handleDeletePreset}
        />
      ) : null}
    </>
  );
}
