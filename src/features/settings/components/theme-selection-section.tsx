import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { Text } from '@/src/components/ui/text';
import { useAppTheme } from '@/src/theme/app-theme-provider';
import type { ThemePreference } from '@/src/theme/theme-preference';

import { View } from 'react-native';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
}[] = [
  {
    value: 'system',
    label: 'System'
  },
  {
    value: 'light',
    label: 'Light'
  },
  {
    value: 'dark',
    label: 'Dark'
  }
];

export const ThemeSelectionSection = () => {
  const { themePreference, setThemePreference } = useAppTheme();

  return (
    <View>
      <Text variant="overline" tone="muted" className="mb-2">
        Appearance
      </Text>
      <SegmentedControl
        value={themePreference}
        options={THEME_OPTIONS}
        onChange={setThemePreference}
      />
    </View>
  );
};
