import { themeColors } from '@/src/theme/colors.generated';

export type AppColorScheme = 'light' | 'dark';

const colorSchemes = themeColors;

export type ThemeColors = (typeof colorSchemes)[AppColorScheme];

export function getThemeColors(scheme: AppColorScheme) {
  return colorSchemes[scheme];
}

export function getTabBarTheme(scheme: AppColorScheme) {
  const colors = getThemeColors(scheme);

  return {
    activeTintColor: colors.primary,
    backgroundColor: colors.card,
    borderColor: colors.border,
    inactiveTintColor: colors.mutedForeground,
    sceneBackgroundColor: colors.background
  } as const;
}
