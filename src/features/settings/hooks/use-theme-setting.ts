import type { DrizzleDb } from '@/src/db/client';
import { useDrizzle } from '@/src/components/database-provider';
import {
  getStoredThemePreference,
  setThemePreferenceSnapshot
} from '@/src/features/settings/theme-preference-storage';
import { useCallback } from 'react';
import {
  persistThemePreference,
  type ThemePreference
} from '@/src/features/settings/repository';
import { useThemePreference } from '@/src/features/settings/hooks/use-theme-preference';

let pendingThemePreference: ThemePreference | null = null;
let pendingPersistenceFrame: number | null = null;

function scheduleThemePersistence(
  db: DrizzleDb,
  preference: ThemePreference
): void {
  pendingThemePreference = preference;

  if (pendingPersistenceFrame !== null) {
    cancelAnimationFrame(pendingPersistenceFrame);
  }

  pendingPersistenceFrame = requestAnimationFrame(() => {
    pendingPersistenceFrame = null;

    if (!pendingThemePreference) {
      return;
    }

    persistThemePreference(db, pendingThemePreference);
    pendingThemePreference = null;
  });
}

export function useThemeSetting() {
  const db = useDrizzle();
  const themePreference = useThemePreference();

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      if (preference === getStoredThemePreference()) {
        return;
      }

      setThemePreferenceSnapshot(preference);
      scheduleThemePersistence(db, preference);
    },
    [db]
  );

  return {
    themePreference,
    setThemePreference
  };
}
