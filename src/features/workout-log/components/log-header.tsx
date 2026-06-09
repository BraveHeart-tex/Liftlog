import { SegmentedControl } from '@/src/components/ui/segmented-control';
import { Text } from '@/src/components/ui/text';
import { Platform, View } from 'react-native';

export type LogView = 'workouts' | 'steps';

interface LogHeaderProps {
  view: LogView;
  onViewChange: (view: LogView) => void;
}

const LOG_VIEW_OPTIONS = [
  { label: 'Workouts', value: 'workouts' },
  { label: 'Steps', value: 'steps' }
] satisfies { label: string; value: LogView }[];

export function LogHeader({ view, onViewChange }: LogHeaderProps) {
  return (
    <View>
      <Text variant="h1">Log</Text>
      {Platform.OS === 'android' ? (
        <SegmentedControl
          value={view}
          options={LOG_VIEW_OPTIONS}
          onChange={onViewChange}
          className="mt-4"
        />
      ) : null}
    </View>
  );
}
