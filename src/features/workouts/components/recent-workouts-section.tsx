import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { RecentWorkoutCard } from '@/src/features/workouts/components/recent-workout-card';
import { useRecentWorkouts } from '@/src/features/workouts/hooks/use-recent-workouts';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { Link, useRouter } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { View } from 'react-native';

export const RecentWorkoutsSection = () => {
  const router = useRouter();
  const { recentWorkouts } = useRecentWorkouts();

  return (
    <View className="mt-8">
      <View
        className={cn('flex-row items-center justify-between', {
          'border-border border-b pb-4': recentWorkouts.length > 0
        })}
      >
        <Text variant="overline" tone="muted">
          Recent workouts
        </Text>
        {recentWorkouts.length > 0 && (
          <Link asChild href="/(tabs)/log">
            <View className="flex-row items-center gap-1">
              <Text tone="primary" weight="medium" variant="small">
                View all
              </Text>
              <Icon as={ChevronRightIcon} tone="primary" size={iconSizes.sm} />
            </View>
          </Link>
        )}
      </View>

      {recentWorkouts.length > 0 ? (
        <View className="mt-3">
          {recentWorkouts.map((workout, index) => (
            <RecentWorkoutCard
              key={workout.id}
              workout={workout}
              className={cn(index > 0 && 'mt-3')}
              onPress={() => {
                router.navigate({
                  pathname: '/workouts/[id]',
                  params: { id: workout.id }
                });
              }}
            />
          ))}
        </View>
      ) : (
        <View className="border-border mt-6 border-t border-b py-4">
          <Text variant="bodyMedium">No workouts yet</Text>
          <Text variant="small" tone="muted" className="mt-1">
            Your completed sessions will appear here.
          </Text>
        </View>
      )}
    </View>
  );
};
