import { Screen } from '@/src/components/ui/screen';
import { AboutInfoSection } from '@/src/features/settings/components/about-info-section';
import { AppUpdateSettingsSection } from '@/src/features/settings/components/app-update-settings-section';
import { DataBackupSection } from '@/src/features/settings/components/data-backup-section';
import { StepsSection } from '@/src/features/settings/components/steps-section';
import { ThemeSelectionSection } from '@/src/features/settings/components/theme-selection-section';
import { WorkoutPreferencesSection } from '@/src/features/settings/components/workout-preferences-section';

export function SettingsScreen() {
  return (
    <Screen scroll edges={[]}>
      <ThemeSelectionSection />
      <WorkoutPreferencesSection />
      <StepsSection />
      <DataBackupSection />
      <AppUpdateSettingsSection />
      <AboutInfoSection />
    </Screen>
  );
}
