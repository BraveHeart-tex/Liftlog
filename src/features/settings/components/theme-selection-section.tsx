import type { IconComponent } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { ThemeOptionCard } from '@/src/features/settings/components/theme-option-card';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import type { ThemePreference } from '@/src/theme/theme-preference';

import { MoonIcon, SmartphoneIcon, SunIcon } from 'lucide-react-native';
import { View } from 'react-native';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: IconComponent;
}[] = [
  {
    value: 'system',
    label: 'System',
    icon: SmartphoneIcon
  },
  {
    value: 'light',
    label: 'Light',
    icon: SunIcon
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: MoonIcon
  }
];

export const ThemeSelectionSection = () => {
  const { themePreference, setThemePreference } = useAppTheme();

  return (
    <View className="mt-6">
      <Text variant="overline" tone="muted" className="mb-2">
        Appearance
      </Text>
      <View className="flex-row gap-2">
        {THEME_OPTIONS.map(option => (
          <ThemeOptionCard
            key={option.value}
            label={option.label}
            icon={option.icon}
            isSelected={themePreference === option.value}
            onPress={() => setThemePreference(option.value)}
          />
        ))}
      </View>
    </View>
  );
};
