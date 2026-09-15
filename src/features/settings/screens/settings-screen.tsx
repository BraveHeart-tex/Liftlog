import { Screen } from '@/src/components/ui/screen';
import { AppUpdateSection } from '@/src/features/settings/components/app-update-section';
import { DataBackupSection } from '@/src/features/settings/components/data-backup-section';
import { StepsSection } from '@/src/features/settings/components/steps-section';
import { ThemeSelectionSection } from '@/src/features/settings/components/theme-selection-section';
import { WorkoutPreferencesSection } from '@/src/features/settings/components/workout-preferences-section';
import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { useReducedMotion } from '@/src/lib/animations/use-reduced-motion.hook';
import Animated, { LinearTransition } from 'react-native-reanimated';

const sectionLayout = LinearTransition.duration(MOTION_DURATION_MS.standard);

export function SettingsScreen() {
  const reduceMotion = useReducedMotion();
  const layoutTransition = reduceMotion ? undefined : sectionLayout;

  return (
    <Screen scroll edges={[]}>
      <Animated.View layout={layoutTransition}>
        <ThemeSelectionSection />
      </Animated.View>
      <Animated.View layout={layoutTransition}>
        <WorkoutPreferencesSection />
      </Animated.View>
      <Animated.View layout={layoutTransition}>
        <StepsSection />
      </Animated.View>
      <Animated.View layout={layoutTransition}>
        <DataBackupSection />
      </Animated.View>
      <Animated.View layout={layoutTransition}>
        <AppUpdateSection />
      </Animated.View>
    </Screen>
  );
}
