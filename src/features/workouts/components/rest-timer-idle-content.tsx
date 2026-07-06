import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { useSettings } from '@/src/features/settings/hooks/use-settings';
import type { RestTimerPreset } from '@/src/features/settings/settings.repository';
import { RestTimerDurationPicker } from '@/src/features/workouts/components/rest-timer-duration-picker';
import { RestTimerPresetEditorSheet } from '@/src/features/workouts/components/rest-timer-preset-editor-sheet';
import { RestTimerPresetList } from '@/src/features/workouts/components/rest-timer-preset-list';
import {
  MIN_REST_TIMER_SECONDS,
  type RestTimerContext,
  useRestTimerStore
} from '@/src/features/workouts/stores/rest-timer.store';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import { PlayIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

interface RestTimerIdleContentProps {
  defaultDuration: number;
  context?: RestTimerContext;
  openToken: number;
  renderWheels: boolean;
}

function getDurationDraft(durationSeconds: number) {
  return getTimerParts(durationSeconds);
}

export function RestTimerIdleContent({
  defaultDuration,
  context,
  openToken,
  renderWheels
}: RestTimerIdleContentProps) {
  const {
    restTimerPresets,
    setRestTimerDuration,
    addRestTimerPreset,
    updateRestTimerPreset,
    deleteRestTimerPreset
  } = useSettings();
  const durationSeconds = useRestTimerStore(state => state.durationSeconds);
  const startTimer = useRestTimerStore(state => state.start);
  const lastOpenTokenRef = useRef(openToken);
  const [durationDraft] = useState(() => getDurationDraft(durationSeconds));
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
    const selectedTotalSeconds = minutesRef.current * 60 + secondsRef.current;

    if (selectedTotalSeconds < MIN_REST_TIMER_SECONDS) {
      return;
    }

    startTimer(selectedTotalSeconds, context);
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
      } catch {
        Alert.alert(
          'Preset not saved',
          'Only 8 rest timer presets are allowed.'
        );

        return;
      }

      setIsEditorOpen(false);
    },
    [addRestTimerPreset, editingPreset, updateRestTimerPreset]
  );

  const handleDeletePreset = useCallback(
    (preset: RestTimerPreset) => {
      Alert.alert('Delete preset?', `${preset.name} will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRestTimerPreset(preset.id);
            setIsEditorOpen(false);
          }
        }
      ]);
    },
    [deleteRestTimerPreset]
  );

  return (
    <>
      <View className="items-center">
        <RestTimerDurationPicker
          minutes={minutes}
          seconds={seconds}
          renderWhen={renderWheels}
          className="-mt-4"
          onMinutesChanging={handleMinutesChanging}
          onMinutesChange={handleMinutesChange}
          onSecondsChanging={handleSecondsChanging}
          onSecondsChange={handleSecondsChange}
        />
      </View>

      <Button
        className="w-full"
        disabled={!canStart}
        leftIcon={<Icon as={PlayIcon} tone="primaryForeground" />}
        onPress={handleStart}
      >
        Start
      </Button>

      <RestTimerPresetList
        presets={restTimerPresets}
        selectedDurationSeconds={totalSeconds}
        onAddPreset={openAddPreset}
        onPresetPress={handlePresetPress}
        onPresetLongPress={openEditPreset}
      />

      <RestTimerPresetEditorSheet
        isOpen={isEditorOpen}
        preset={editingPreset}
        defaultDuration={totalSeconds}
        onClose={closeEditor}
        onSave={handleSavePreset}
        onDelete={handleDeletePreset}
      />
    </>
  );
}
