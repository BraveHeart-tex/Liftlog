import { createMMKV } from 'react-native-mmkv';
import type { ColorSchemeName } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCE_KEY = 'settings.theme_preference';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

type SettingsStorage = ReturnType<typeof createMMKV>;

let settingsStorage: SettingsStorage | null = null;
const themePreferenceListeners = new Set<() => void>();
let themePreferenceSnapshot: ThemePreference | null = null;

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

function readThemePreferenceFromStorage(): ThemePreference {
  return parseThemePreference(
    getSettingsStorage()?.getString(THEME_PREFERENCE_KEY)
  );
}

function getThemePreferenceSnapshot(): ThemePreference {
  if (themePreferenceSnapshot) {
    return themePreferenceSnapshot;
  }

  themePreferenceSnapshot = readThemePreferenceFromStorage();

  return themePreferenceSnapshot;
}

function notifyThemePreferenceListeners(): void {
  themePreferenceListeners.forEach(listener => {
    listener();
  });
}

export function getStoredThemePreference(): ThemePreference {
  return getThemePreferenceSnapshot();
}

export function subscribeToStoredThemePreference(
  listener: () => void
): () => void {
  themePreferenceListeners.add(listener);

  const storage = getSettingsStorage();

  if (!storage) {
    return () => {
      themePreferenceListeners.delete(listener);
    };
  }

  const subscription = storage.addOnValueChangedListener(changedKey => {
    if (changedKey !== THEME_PREFERENCE_KEY) {
      return;
    }

    const nextPreference = readThemePreferenceFromStorage();

    if (nextPreference === themePreferenceSnapshot) {
      return;
    }

    themePreferenceSnapshot = nextPreference;
    notifyThemePreferenceListeners();
  });

  return () => {
    themePreferenceListeners.delete(listener);
    subscription.remove();
  };
}

export function setStoredThemePreference(preference: ThemePreference): void {
  const previousPreference = getThemePreferenceSnapshot();

  themePreferenceSnapshot = preference;

  if (preference !== previousPreference) {
    notifyThemePreferenceListeners();
  }

  getSettingsStorage()?.set(THEME_PREFERENCE_KEY, preference);
}

export function toAppearanceColorScheme(
  preference: ThemePreference
): ColorSchemeName {
  return preference === 'system' ? null : preference;
}
