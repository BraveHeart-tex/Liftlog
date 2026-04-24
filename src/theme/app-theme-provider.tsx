import { useSettings } from '@/src/features/settings/hooks';
import { cn } from '@/src/lib/utils/cn';
import {
  getTabBarTheme,
  getThemeColors,
  type AppColorScheme,
  type ThemeColors
} from '@/src/theme/tokens';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren
} from 'react';
import {
  Appearance,
  useColorScheme,
  View,
  type ColorSchemeName
} from 'react-native';

interface AppThemeContextValue {
  colors: ThemeColors;
  colorScheme: AppColorScheme;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function resolveRequestedColorScheme(
  preference: 'system' | AppColorScheme
): ColorSchemeName {
  return preference === 'system' ? null : preference;
}

function resolveAppColorScheme(colorScheme: ColorSchemeName): AppColorScheme {
  return colorScheme === 'dark' ? 'dark' : 'light';
}

function createNavigationTheme(colorScheme: AppColorScheme): Theme {
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = getThemeColors(colorScheme);

  return {
    ...baseTheme,
    dark: colorScheme === 'dark',
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      notification: colors.primary
    }
  };
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const { themePreference } = useSettings();
  const nativeColorScheme = useColorScheme();
  const colorScheme = resolveAppColorScheme(nativeColorScheme);

  useEffect(() => {
    Appearance.setColorScheme(resolveRequestedColorScheme(themePreference));
  }, [themePreference]);

  const value = useMemo(
    () => ({
      colors: getThemeColors(colorScheme),
      colorScheme
    }),
    [colorScheme]
  );

  const navigationTheme = useMemo(
    () => createNavigationTheme(colorScheme),
    [colorScheme]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View
          className={cn(
            'will-change-variable flex-1',
            colorScheme === 'dark' ? 'theme-dark' : 'theme-light'
          )}
        >
          {children}
        </View>
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }

  return context;
}

export const useTabBarTheme = () => {
  const { colorScheme } = useAppTheme();

  return getTabBarTheme(colorScheme);
};
