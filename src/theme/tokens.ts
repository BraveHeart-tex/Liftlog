export type AppColorScheme = 'light' | 'dark';

const colorSchemes = {
  light: {
    background: '#F5F0EB',
    foreground: '#1A1208',
    card: '#FFFFFF',
    primary: '#FF4D00',
    primaryForeground: '#FFFFFF',
    border: '#E8DDD3',
    mutedForeground: '#6B5B4E'
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
