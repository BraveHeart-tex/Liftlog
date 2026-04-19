import { useDrizzle } from '@/src/components/database-provider';
import { appMeta } from '@/src/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useCallback, useMemo } from 'react';
import {
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
  getRestTimerDuration,
  getThemePreference,
  getWeightUnit,
  parseThemePreference,
  setRestTimerDuration as setRestTimerDurationRepo,
  setThemePreference as setThemePreferenceRepo,
  setWeightUnit as setWeightUnitRepo,
  type ThemePreference,
  type WeightUnit
} from './repository';

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

  const { data: rows = [], updatedAt } = useLiveQuery(
    db.select().from(appMeta),
    [db]
  );
  const hasLoadedRows = Boolean(updatedAt);

  const weightUnit: WeightUnit = useMemo(() => {
    if (!hasLoadedRows) {
      return initialSettings.weightUnit;
    }

    const row = rows.find(row => row.key === SETTINGS_KEYS.weightUnit);

    return row?.value === 'lb' ? 'lb' : 'kg';
  }, [hasLoadedRows, initialSettings.weightUnit, rows]);

  const restTimerDuration: number = useMemo(() => {
    if (!hasLoadedRows) {
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
  }, [hasLoadedRows, initialSettings.restTimerDuration, rows]);

  const themePreference: ThemePreference = useMemo(() => {
    if (!hasLoadedRows) {
      return initialSettings.themePreference;
    }

    const row = rows.find(row => row.key === SETTINGS_KEYS.themePreference);

    return parseThemePreference(row?.value);
  }, [hasLoadedRows, initialSettings.themePreference, rows]);

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
