import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import {
  LogHeader,
  type LogView
} from '@/src/features/workout-log/components/log-header';
import { WorkoutLogContent } from '@/src/features/workout-log/components/workout-log-content';
import { StepsContent } from '@/src/features/steps/components/steps-content';
import { useState } from 'react';
import { Platform, View } from 'react-native';

export default function LogScreen() {
  const [view, setView] = useState<LogView>('workouts');
  const selectedView = Platform.OS === 'android' ? view : 'workouts';

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <View className="px-4 pt-6">
        <LogHeader view={selectedView} onViewChange={setView} />
      </View>
      {selectedView === 'steps' ? <StepsContent /> : <WorkoutLogContent />}
    </SafeAreaView>
  );
}
