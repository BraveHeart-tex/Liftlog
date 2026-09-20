import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { ClockIcon, DumbbellIcon, LayersIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface WorkoutMetricsProps {
  durationLabel: string;
  setCountLabel: string;
  volumeLabel: string;
}

export const WorkoutMetrics = ({
  durationLabel,
  setCountLabel,
  volumeLabel
}: WorkoutMetricsProps) => {
  const metrics = [
    { label: 'Duration', value: durationLabel, icon: ClockIcon },
    { label: 'Sets', value: setCountLabel, icon: DumbbellIcon },
    { label: 'Volume', value: volumeLabel, icon: LayersIcon }
  ];

  return (
    <Card>
      <CardContent className="flex-row p-0">
        {metrics.map((metric, index) => (
          <View
            key={metric.label}
            style={{ flex: 1 }}
            className={[
              'gap-2 px-4 py-4',
              index > 0 ? 'border-border border-l' : ''
            ].join(' ')}
          >
            <View className="flex-row items-center gap-2">
              <Icon as={metric.icon} size="xs" tone="primary" />
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {metric.label}
              </Text>
            </View>

            <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit>
              {metric.value}
            </Text>
          </View>
        ))}
      </CardContent>
    </Card>
  );
};
