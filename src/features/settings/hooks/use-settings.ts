import { useDrizzle } from '@/src/components/database-provider';
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';
import { useCallback, useMemo } from 'react';
import {
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
  getRestTimerDuration,
  getSettings,
  getSettingsQuery,
  getThemePreference,
  getWeightUnit,
  parseThemePreference,
  setRestTimerDuration as setRestTimerDurationRepo,
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
      themePreference: getThemePreference(db)
    }),
    [db]
  );
  const { data: rows, isLive } = useLiveWithFallback(
    () => getSettingsQuery(db),
    () => getSettings(db),
    [db]
  );

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

  return {
    weightUnit,
    restTimerDuration,
    themePreference,
    setWeightUnit,
    setRestTimerDuration,
    setThemePreference
  };
}
