import {
  getStoredThemePreference,
  subscribeToStoredThemePreference,
  type ThemePreference
} from '@/src/features/settings/theme-preference-storage';
import { useSyncExternalStore } from 'react';

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribeToStoredThemePreference,
    getStoredThemePreference,
    getStoredThemePreference
  );
}
