export type AppColorScheme = 'light' | 'dark';

export const colorSchemes = {
  light: {
    background: '#F2F2F7',
    foreground: '#0A0A0A',
    card: '#FFFFFF',
    primary: '#FF4D00',
    primaryForeground: '#FFFFFF',
    border: '#D8D8DD',
    mutedForeground: '#8E8E93'
  },
  dark: {
    background: '#1C1C1E',
    foreground: '#F5F5F5',
    card: '#2C2C2E',
    primary: '#FF4D00',
    primaryForeground: '#FFFFFF',
    border: '#3A3A3C',
    mutedForeground: '#636366'
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
