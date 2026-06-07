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
                className="text-primary"
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
        // TODO(FE-185): Extract empty state markup to a re-usable component
        <View className="mt-3 items-center justify-center rounded-lg px-6 py-10">
          <View className="bg-card h-12 w-12 items-center justify-center rounded-lg">
            <Icon
              icon={DumbbellIcon}
              className="text-muted-foreground"
              size="md"
            />
          </View>
          <Text variant="bodyMedium" className="mt-3 text-center">
            No workouts yet
          </Text>
          <Text variant="small" tone="muted" className="mt-1 text-center">
            Start your first session to see history here.
          </Text>
        </View>
      )}
    </View>
  );
};
