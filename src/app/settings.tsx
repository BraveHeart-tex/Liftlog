import { BackButton } from '@/src/components/ui/back-button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { AboutInfoSection } from '@/src/features/settings/components/about-info-section';
import { StepsSection } from '@/src/features/settings/components/steps-section';
import { ThemeSelectionSection } from '@/src/features/settings/components/theme-selection-section';
import { WorkoutPreferencesSection } from '@/src/features/settings/components/workout-preferences-section';
import { View } from 'react-native';

export default function SettingsScreen() {
  return (
    <Screen scroll>
      <View className="flex-row items-center gap-3">
        <BackButton />
        <Text variant="h1">Settings</Text>
      </View>
      <ThemeSelectionSection />
      <WorkoutPreferencesSection />
      <StepsSection />
      <AboutInfoSection />
    </Screen>
  );
}
