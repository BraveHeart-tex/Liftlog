import { useDrizzle } from '@/src/components/database-provider';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback.hook';
import { getTimerParts } from '@/src/lib/utils/date.utils';
import { pluralize } from '@/src/lib/utils/string.utils';
import { useCallback, useMemo } from 'react';
import {
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
  addRestTimerPreset as addRestTimerPresetRepo,
  deleteRestTimerPreset as deleteRestTimerPresetRepo,
  getHealthConnectStepsEnabled,
  getRestTimerDuration,
  getRestTimerPresets,
  getRestTimerPresetsFromValue,
  getSettingsQuery,
  getStepGoal,
  getStepsNotificationEnabled,
  getWeightUnit,
  parseBooleanSetting,
  parseStepGoal,
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
  const initialSettings = useMemo(() => {
    const restTimerDuration = getRestTimerDuration(db);

    return {
      weightUnit: getWeightUnit(db),
      restTimerDuration,
      restTimerPresets: getRestTimerPresets(db),
      healthConnectStepsEnabled: getHealthConnectStepsEnabled(db),
      stepsNotificationEnabled: getStepsNotificationEnabled(db),
      stepGoal: getStepGoal(db)
    };
  }, [db]);
  const { data: rows, isLive } = useLiveWithFallback(getSettingsQuery(db), [
    db
  ]);

  const weightUnit: WeightUnit = useMemo(() => {
    if (!isLive) {
      return initialSettings.weightUnit;
    }

    const row = rows.find(row => row.key === SETTINGS_KEYS.weightUnit);

    return row?.value === 'lb' ? 'lb' : 'kg';
  }, [initialSettings.weightUnit, isLive, rows]);

  const restTimerDuration: number = useMemo(() => {
    if (!isLive) {
      return initialSettings.restTimerDuration;
    }

    const row = rows.find(row => row.key === SETTINGS_KEYS.restTimerDuration);

    if (!row) {
      return SETTINGS_DEFAULTS.restTimerDuration;
    }

    const parsed = parseInt(row.value, 10);

    return Number.isFinite(parsed) && parsed >= 10
      ? parsed
      : SETTINGS_DEFAULTS.restTimerDuration;
  }, [initialSettings.restTimerDuration, isLive, rows]);

  const healthConnectStepsEnabled = useMemo(() => {
    if (!isLive) {
      return initialSettings.healthConnectStepsEnabled;
    }

    const row = rows.find(
      row => row.key === SETTINGS_KEYS.healthConnectStepsEnabled
    );

    return parseBooleanSetting(row?.value);
  }, [initialSettings.healthConnectStepsEnabled, isLive, rows]);

  const restTimerPresets = useMemo(() => {
    if (!isLive) {
      return initialSettings.restTimerPresets;
    }

    const row = rows.find(row => row.key === SETTINGS_KEYS.restTimerPresets);

    return row
      ? getRestTimerPresetsFromValue(row.value)
      : initialSettings.restTimerPresets;
  }, [initialSettings.restTimerPresets, isLive, rows]);

  const stepsNotificationEnabled = useMemo(() => {
    if (!isLive) {
      return initialSettings.stepsNotificationEnabled;
    }

    const row = rows.find(
      row => row.key === SETTINGS_KEYS.stepsNotificationEnabled
    );

    return parseBooleanSetting(row?.value);
  }, [initialSettings.stepsNotificationEnabled, isLive, rows]);

  const stepGoal = useMemo(() => {
    if (!isLive) {
      return initialSettings.stepGoal;
    }

    const row = rows.find(row => row.key === SETTINGS_KEYS.stepGoal);

    return parseStepGoal(row?.value);
  }, [initialSettings.stepGoal, isLive, rows]);

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
