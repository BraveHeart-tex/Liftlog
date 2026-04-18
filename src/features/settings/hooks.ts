import { useDrizzle } from '@/src/components/database-provider';
import { appMeta } from '@/src/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useCallback, useMemo } from 'react';
import {
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
  parseThemePreference,
  setRestTimerDuration as setRestTimerDurationRepo,
  setThemePreference as setThemePreferenceRepo,
  setWeightUnit as setWeightUnitRepo,
  type ThemePreference,
  type WeightUnit
} from './repository';

export function useSettings() {
  const db = useDrizzle();

  const { data: rows = [] } = useLiveQuery(db.select().from(appMeta), [db]);

  const weightUnit: WeightUnit = useMemo(() => {
    const row = rows.find(row => row.key === SETTINGS_KEYS.weightUnit);

    return row?.value === 'lb' ? 'lb' : 'kg';
  }, [rows]);

  const restTimerDuration: number = useMemo(() => {
    const row = rows.find(row => row.key === SETTINGS_KEYS.restTimerDuration);

    if (!row) {
      return SETTINGS_DEFAULTS.restTimerDuration;
    }

    const parsed = parseInt(row.value, 10);

    return Number.isFinite(parsed) && parsed >= 10
      ? parsed
      : SETTINGS_DEFAULTS.restTimerDuration;
  }, [rows]);

  const themePreference: ThemePreference = useMemo(() => {
    const row = rows.find(row => row.key === SETTINGS_KEYS.themePreference);

    return parseThemePreference(row?.value);
  }, [rows]);

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
