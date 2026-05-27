import { useSettings } from '@/src/features/settings/hooks';
import { toAppearanceColorScheme } from '@/src/features/settings/theme-preference-storage';
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
import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useContext,
  useLayoutEffect,
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

function resolveAppColorScheme(colorScheme: ColorSchemeName): AppColorScheme {
  return colorScheme === 'dark' ? 'dark' : 'light';
}

function resolveColorScheme(
  preference: 'system' | AppColorScheme,
  nativeColorScheme: ColorSchemeName
): AppColorScheme {
  if (preference !== 'system') {
    return preference;
  }

  return resolveAppColorScheme(nativeColorScheme);
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
  const colorScheme = useMemo(
    () => resolveColorScheme(themePreference, nativeColorScheme),
    [nativeColorScheme, themePreference]
  );

  useLayoutEffect(() => {
    Appearance.setColorScheme(toAppearanceColorScheme(themePreference));
  }, [themePreference]);

  useLayoutEffect(() => {
    void SystemUI.setBackgroundColorAsync(
      getThemeColors(colorScheme).background
    );
  }, [colorScheme]);

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
            'flex-1',
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
