import { StepsContent } from '@/src/features/steps/components/steps-content';
import {
  LogHeader,
  type LogView
} from '@/src/features/workouts/history/components/log-header';
import { Screen } from '@/src/components/ui/screen';
import { WorkoutLogContent } from '@/src/features/workouts/history/components/workout-log-content';
import { useState } from 'react';
import { Platform, View } from 'react-native';

export function LogScreen() {
  const [view, setView] = useState<LogView>('workouts');
  const selectedView = Platform.OS === 'android' ? view : 'workouts';

  return (
    <Screen withPadding={false}>
      <View className="px-4 pt-6">
        <LogHeader view={selectedView} onViewChange={setView} />
      </View>
      {selectedView === 'steps' ? <StepsContent /> : <WorkoutLogContent />}
    </Screen>
  );
}
