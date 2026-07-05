import { cn } from '@/src/lib/utils/cn.utils';
import {
  getThemePreference,
  setThemePreference as persistThemePreference,
  toAppearanceColorScheme,
  type ThemePreference
} from '@/src/theme/theme-preference';
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
import { setBackgroundColorAsync } from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function resolveAppColorScheme(colorScheme: ColorSchemeName): AppColorScheme {
  return colorScheme === 'dark' ? 'dark' : 'light';
}

function resolveColorScheme(
  preference: ThemePreference,
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
  const [themePreference, setThemePreferenceState] =
    useState(getThemePreference);
  const nativeColorScheme = useColorScheme();
  const colorScheme = resolveColorScheme(themePreference, nativeColorScheme);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    Appearance.setColorScheme(toAppearanceColorScheme(preference));
    setThemePreferenceState(preference);
    persistThemePreference(preference);
  }, []);

  useEffect(() => {
    void setBackgroundColorAsync(getThemeColors(colorScheme).background);
  }, [colorScheme]);

  const value = useMemo(
    () => ({
      colors: getThemeColors(colorScheme),
      colorScheme,
      themePreference,
      setThemePreference
    }),
    [colorScheme, setThemePreference, themePreference]
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
