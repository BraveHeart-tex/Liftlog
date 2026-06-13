import {
  getThemePreference,
  toAppearanceColorScheme
} from '@/src/theme/theme-preference';
import { getThemeColors } from '@/src/theme/tokens';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { Appearance } from 'react-native';

export function bootstrapThemeColorScheme() {
  const preference = getThemePreference();
  const requestedColorScheme = toAppearanceColorScheme(preference);
  const colorScheme = requestedColorScheme ?? Appearance.getColorScheme();
  const appColorScheme = colorScheme === 'dark' ? 'dark' : 'light';

  Appearance.setColorScheme(requestedColorScheme);
  void setBackgroundColorAsync(getThemeColors(appColorScheme).background);
}
