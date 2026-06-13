import {
  getStoredThemePreference,
  toAppearanceColorScheme
} from '@/src/features/settings/theme-preference-storage';
import { getThemeColors } from '@/src/theme/tokens';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { Appearance } from 'react-native';

export function bootstrapThemeColorScheme() {
  const preference = getStoredThemePreference();
  const requestedColorScheme = toAppearanceColorScheme(preference);
  const colorScheme = requestedColorScheme ?? Appearance.getColorScheme();
  const appColorScheme = colorScheme === 'dark' ? 'dark' : 'light';

  Appearance.setColorScheme(requestedColorScheme);
  void setBackgroundColorAsync(getThemeColors(appColorScheme).background);
}
