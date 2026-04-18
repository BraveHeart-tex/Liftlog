export type AppColorScheme = 'light' | 'dark';

export const colorSchemes = {
  light: {
    background: '#F2F2F7',
    foreground: '#0A0A0A',
    card: '#FFFFFF',
    primary: '#FF4D00',
    primaryForeground: '#FFFFFF',
    border: '#C7C7CC',
    mutedForeground: '#6C6C72'
  },
  dark: {
    background: '#1C1C1E',
    foreground: '#F5F5F5',
    card: '#2C2C2E',
    primary: '#FF4D00',
    primaryForeground: '#FFFFFF',
    border: '#3A3A3C',
    mutedForeground: '#7A7A7F'
  }
} as const;

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
