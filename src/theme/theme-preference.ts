import type { ColorSchemeName } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'settings.theme_preference';
const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

const themeStorage = createMMKV({
  id: 'liftlog.settings',
  compareBeforeSet: true
});

function parseThemePreference(value: string | undefined): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return DEFAULT_THEME_PREFERENCE;
}

export function getThemePreference(): ThemePreference {
  return parseThemePreference(themeStorage.getString(THEME_PREFERENCE_KEY));
}

export function setThemePreference(preference: ThemePreference): void {
  themeStorage.set(THEME_PREFERENCE_KEY, preference);
}

export function toAppearanceColorScheme(
  preference: ThemePreference
): ColorSchemeName {
  return preference === 'system' ? null : preference;
}
