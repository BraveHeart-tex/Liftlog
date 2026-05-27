import { createMMKV } from 'react-native-mmkv';
import type { ColorSchemeName } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCE_KEY = 'settings.theme_preference';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

type SettingsStorage = ReturnType<typeof createMMKV>;

let settingsStorage: SettingsStorage | null = null;

function getSettingsStorage(): SettingsStorage | null {
  if (settingsStorage) {
    return settingsStorage;
  }

  try {
    settingsStorage = createMMKV({
      id: 'liftlog.settings',
      compareBeforeSet: true
    });

    return settingsStorage;
  } catch (error) {
    if (__DEV__) {
      console.warn('Unable to initialize settings storage', error);
    }

    return null;
  }
}

export function parseThemePreference(
  value: string | undefined
): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return DEFAULT_THEME_PREFERENCE;
}

export function getStoredThemePreference(): ThemePreference {
  return parseThemePreference(
    getSettingsStorage()?.getString(THEME_PREFERENCE_KEY)
  );
}

export function setStoredThemePreference(preference: ThemePreference): void {
  getSettingsStorage()?.set(THEME_PREFERENCE_KEY, preference);
}

export function toAppearanceColorScheme(
  preference: ThemePreference
): ColorSchemeName {
  return preference === 'system' ? null : preference;
}
