import { LogHeader } from '@/src/features/workouts/history/components/log-header';
import { Screen } from '@/src/components/ui/screen';
import { WorkoutLogContent } from '@/src/features/workouts/history/components/workout-log-content';
import { router } from 'expo-router';
import { View } from 'react-native';

export function LogScreen() {
  return (
    <Screen withPadding={false}>
      <View className="px-4 pt-6">
        <LogHeader onOpenSteps={() => router.push('/log/steps')} />
      </View>
      <WorkoutLogContent />
    </Screen>
  );
}
