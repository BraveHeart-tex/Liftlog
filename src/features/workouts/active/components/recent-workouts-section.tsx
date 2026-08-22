import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { useRecentWorkouts } from '@/src/features/workouts/active/hooks/use-recent-workouts';
import { cn } from '@/src/lib/utils/cn.utils';
import { formatDuration } from '@/src/lib/utils/date.utils';
import { iconSizes } from '@/src/theme/sizes';
import { Link, useRouter } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { View } from 'react-native';

function formatRecentWorkoutDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
}

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
        <View>
          {recentWorkouts.map(({ workout, exerciseCount }) => (
            <PressableSurface
              key={workout.id}
              className="border-border flex-row items-center border-b py-4"
              accessibilityLabel={`Open ${workout.name}`}
              onPress={() => {
                router.navigate({
                  pathname: '/workouts/[id]',
                  params: { id: workout.id }
                });
              }}
            >
              <View className="min-w-0 flex-1 gap-1">
                <Text variant="bodyMedium" numberOfLines={1}>
                  {workout.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text variant="small" tone="muted">
                    {formatRecentWorkoutDate(workout.startedAt)}
                  </Text>

                  <Text variant="small" tone="muted">
                    ·
                  </Text>

                  <Text variant="small" tone="muted">
                    {formatDuration({
                      startedAt: workout.startedAt,
                      completedAt: workout.completedAt
                    })}
                  </Text>

                  <Text variant="small" tone="muted">
                    ·
                  </Text>

                  <Text variant="small" tone="muted">
                    {exerciseCount}{' '}
                    {exerciseCount === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </View>
              </View>

              <Icon
                as={ChevronRightIcon}
                tone="mutedForeground"
                size={iconSizes.md}
                className="ml-4 shrink-0"
              />
            </PressableSurface>
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
