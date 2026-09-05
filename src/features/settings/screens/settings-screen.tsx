import { Screen } from '@/src/components/ui/screen';
import { AboutInfoSection } from '@/src/features/settings/components/about-info-section';
import { StepsSection } from '@/src/features/settings/components/steps-section';
import { ThemeSelectionSection } from '@/src/features/settings/components/theme-selection-section';
import { WorkoutPreferencesSection } from '@/src/features/settings/components/workout-preferences-section';
import { AppUpdateSettingsSection } from '@/src/features/settings/components/app-update-settings-section';

export function SettingsScreen() {
  return (
    <Screen scroll edges={[]}>
      <ThemeSelectionSection />
      <WorkoutPreferencesSection />
      <StepsSection />
      <AppUpdateSettingsSection />
      <AboutInfoSection />
    </Screen>
  );
}
