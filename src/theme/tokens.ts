export type AppColorScheme = 'light' | 'dark';

const colorSchemes = {
  light: {
    background: '#F2EDE8',
    foreground: '#1A1512',
    card: '#FFFFFF',
    primary: '#FF4D00',
    primaryForeground: '#FFFFFF',
    secondary: '#EDE8E2',
    secondaryForeground: '#3A3330',
    accent: '#FF4D00',
    accentForeground: '#FFFFFF',
    border: '#DDD8D2',
    muted: '#EDE8E2',
    mutedForeground: '#6B6460',
    info: '#0070C0'
  },
  dark: {
    background: '#1A1917',
    foreground: '#F0ECE8',
    card: '#252422',
    primary: '#FF4D00',
    primaryForeground: '#FFFFFF',
    secondary: '#3D3B38',
    secondaryForeground: '#C5BFB8',
    accent: '#FF4D00',
    accentForeground: '#FFFFFF',
    border: '#3D3B38',
    muted: '#3D3B38',
    mutedForeground: '#8A8580',
    info: '#4DB8FF'
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
