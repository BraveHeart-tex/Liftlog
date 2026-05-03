import { Card, CardContent } from '@/src/components/ui/card';
import { Icon, type IconComponent } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { View } from 'react-native';

interface WorkoutMetricCardProps {
  label: string;
  value: string | number;
  icon: IconComponent;
}

export const WorkoutMetricCard = ({
  label,
  value,
  icon
}: WorkoutMetricCardProps) => {
  return (
    <Card className="flex-1" key={label}>
      <CardContent className="gap-1">
        <View className="flex-row items-center gap-2">
          <Icon icon={icon} size={14} className="text-primary" />
          <Text variant="caption" tone="muted">
            {label}
          </Text>
        </View>
        <Text variant="h3" className="mt-1">
          {value}
        </Text>
      </CardContent>
    </Card>
  );
};
