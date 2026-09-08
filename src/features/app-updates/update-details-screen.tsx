import { Screen } from '@/src/components/ui/screen';
import { AppUpdateSection } from '@/src/features/settings/components/app-update-section';

export function UpdateDetailsScreen() {
  return (
    <Screen scroll edges={[]}>
      <AppUpdateSection />
    </Screen>
  );
}
