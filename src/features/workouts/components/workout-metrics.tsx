import { Card, CardContent } from '@/src/components/ui/card';
import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { View } from 'react-native';

interface WorkoutMetric {
  label: string;
  value: string | number;
  icon: IconComponent;
}

interface WorkoutMetricsProps {
  metrics: WorkoutMetric[];
}

export const WorkoutMetrics = ({ metrics }: WorkoutMetricsProps) => {
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
