import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db';
import { RecentWorkoutCard } from '@/src/features/workouts/components/recent-workout-card';
import { cn } from '@/src/lib/utils/cn';
import { iconSizes } from '@/src/theme/sizes';
import { Link, useRouter } from 'expo-router';
import { ChevronRightIcon, DumbbellIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface RecentWorkoutsSectionProps {
  recentWorkouts: Workout[];
}

export const RecentWorkoutsSection = ({
  recentWorkouts
}: RecentWorkoutsSectionProps) => {
  const router = useRouter();

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between">
        <Text variant="overline" tone="muted">
          Recent workouts
        </Text>
        {recentWorkouts.length > 0 && (
          <Link asChild href="/(tabs)/log">
            <View className="flex-row items-center gap-1">
              <Text tone="primary" variant="small">
                View all
              </Text>
              <Icon
                icon={ChevronRightIcon}
                tone="primary"
                size={iconSizes.xs}
              />
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
                router.push({
                  pathname: '/workouts/[id]',
                  params: { id: workout.id }
                });
              }}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          layout="section"
          icon={DumbbellIcon}
          title="No workouts yet"
          description="Start your first session to see history here."
          className="mt-3 rounded-lg px-6 py-10"
        />
      )}
    </View>
  );
};
