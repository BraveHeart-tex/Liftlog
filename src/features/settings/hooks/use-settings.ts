import { useDrizzle } from '@/src/components/database-provider';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import { pluralize } from '@/src/lib/utils/string.utils';
import { useCallback, useMemo } from 'react';
import {
  addRestTimerPreset as addRestTimerPresetRepo,
  deleteRestTimerPreset as deleteRestTimerPresetRepo,
  getSettingsQuery,
  getSettingsSnapshot,
  mapSettingsRows,
  setHealthConnectStepsEnabled as setHealthConnectStepsEnabledRepo,
  setRestTimerDuration as setRestTimerDurationRepo,
  setStepGoal as setStepGoalRepo,
  setStepsNotificationEnabled as setStepsNotificationEnabledRepo,
  setWeightUnit as setWeightUnitRepo,
  updateRestTimerPreset as updateRestTimerPresetRepo,
  type RestTimerPreset,
  type WeightUnit
} from '@/src/features/settings/settings.repository';

export function useSettings() {
  const db = useDrizzle();
  const initialSettings = useMemo(() => getSettingsSnapshot(db), [db]);
  const { data: rows, isLive } = useLiveWithFallback(
    getSettingsQuery(db),
    [db],
    { deferInitialRead: true }
  );
  const liveSettings = useMemo(() => mapSettingsRows(rows), [rows]);
  const settings = isLive ? liveSettings : initialSettings;
  const {
    weightUnit,
    restTimerDuration,
    restTimerPresets,
    healthConnectStepsEnabled,
    stepsNotificationEnabled,
    stepGoal
  } = settings;

  const setWeightUnit = useCallback(
    (unit: WeightUnit) => {
      setWeightUnitRepo(db, unit);
    },
    [db]
  );

  const setRestTimerDuration = useCallback(
    (seconds: number) => {
      setRestTimerDurationRepo(db, seconds);
    },
    [db]
  );

  const addRestTimerPreset = useCallback(
    (preset: Omit<RestTimerPreset, 'id'>) => {
      addRestTimerPresetRepo(db, preset);
    },
    [db]
  );

  const updateRestTimerPreset = useCallback(
    (preset: RestTimerPreset) => {
      updateRestTimerPresetRepo(db, preset);
    },
    [db]
  );

  const deleteRestTimerPreset = useCallback(
    (id: string) => {
      deleteRestTimerPresetRepo(db, id);
    },
    [db]
  );

  const setHealthConnectStepsEnabled = useCallback(
    (isEnabled: boolean) => {
      setHealthConnectStepsEnabledRepo(db, isEnabled);
    },
    [db]
  );

  const setStepsNotificationEnabled = useCallback(
    (isEnabled: boolean) => {
      setStepsNotificationEnabledRepo(db, isEnabled);
    },
    [db]
  );

  const setStepGoal = useCallback(
    (goal: number) => {
      setStepGoalRepo(db, goal);
    },
    [db]
  );

  const formattedRestTimerDuration = useMemo(() => {
    if (!restTimerDuration) {
      return '';
    }

    const { minutes, seconds } = getTimerParts(restTimerDuration);

    return [
      minutes > 0 ? pluralize(minutes, 'minute') : null,
      seconds > 0 ? pluralize(seconds, 'second') : null
    ]
      .filter(Boolean)
      .join(' ');
  }, [restTimerDuration]);

  return {
    weightUnit,
    restTimerDuration,
    restTimerPresets,
    formattedRestTimerDuration,
    healthConnectStepsEnabled,
    stepsNotificationEnabled,
    stepGoal,
    setWeightUnit,
    setRestTimerDuration,
    addRestTimerPreset,
    updateRestTimerPreset,
    deleteRestTimerPreset,
    setHealthConnectStepsEnabled,
    setStepsNotificationEnabled,
    setStepGoal
  };
}
