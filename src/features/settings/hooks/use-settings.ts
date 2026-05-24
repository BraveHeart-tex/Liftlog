import { useDrizzle } from '@/src/components/database-provider';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useCallback, useMemo } from 'react';
import {
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
  getHealthConnectStepsEnabled,
  getRestTimerDuration,
  getSettingsQuery,
  getStepGoal,
  getStepsNotificationEnabled,
  getThemePreference,
  getWeightUnit,
  parseBooleanSetting,
  parseStepGoal,
  parseThemePreference,
  setHealthConnectStepsEnabled as setHealthConnectStepsEnabledRepo,
  setRestTimerDuration as setRestTimerDurationRepo,
  setStepGoal as setStepGoalRepo,
  setStepsNotificationEnabled as setStepsNotificationEnabledRepo,
  setThemePreference as setThemePreferenceRepo,
  setWeightUnit as setWeightUnitRepo,
  type ThemePreference,
  type WeightUnit
} from '../repository';

export function useSettings() {
  const db = useDrizzle();
  const initialSettings = useMemo(
    () => ({
      weightUnit: getWeightUnit(db),
      restTimerDuration: getRestTimerDuration(db),
      themePreference: getThemePreference(db),
      healthConnectStepsEnabled: getHealthConnectStepsEnabled(db),
      stepsNotificationEnabled: getStepsNotificationEnabled(db),
      stepGoal: getStepGoal(db)
    }),
    [db]
  );
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

  const themePreference: ThemePreference = useMemo(() => {
    if (!isLive) {
      return initialSettings.themePreference;
    }

    const row = rows.find(row => row.key === SETTINGS_KEYS.themePreference);

    return parseThemePreference(row?.value);
  }, [initialSettings.themePreference, isLive, rows]);

  const healthConnectStepsEnabled = useMemo(() => {
    if (!isLive) {
      return initialSettings.healthConnectStepsEnabled;
    }

    const row = rows.find(
      row => row.key === SETTINGS_KEYS.healthConnectStepsEnabled
    );

    return parseBooleanSetting(row?.value);
  }, [initialSettings.healthConnectStepsEnabled, isLive, rows]);

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

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      setThemePreferenceRepo(db, preference);
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

  return {
    weightUnit,
    restTimerDuration,
    themePreference,
    healthConnectStepsEnabled,
    stepsNotificationEnabled,
    stepGoal,
    setWeightUnit,
    setRestTimerDuration,
    setThemePreference,
    setHealthConnectStepsEnabled,
    setStepsNotificationEnabled,
    setStepGoal
  };
}
