import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { WorkoutTemplateListRow } from '@/src/features/workouts/templates/components/workout-template-list-row';
import { useWorkoutTemplates } from '@/src/features/workouts/templates/hooks/use-workout-templates';
import { cn } from '@/src/lib/utils/cn.utils';
import { Link, useRouter } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import { View } from 'react-native';

const WORKOUT_TAB_TEMPLATE_LIMIT = 5;

export const WorkoutTemplatesSection = () => {
  const router = useRouter();
  const { templates } = useWorkoutTemplates({
    limit: WORKOUT_TAB_TEMPLATE_LIMIT
  });

  const handleTemplatePress = (templateId: string) => {
    router.navigate({
      pathname: '/workouts/templates/[id]',
      params: { id: templateId }
    });
  };

  const handleCreateTemplatePress = () => {
    router.navigate('/workouts/templates/new');
  };

  return (
    <View className="mt-8 mb-6">
      <View
        className={cn('flex-row items-center justify-between', {
          'border-border border-b pb-4': templates.length > 0
        })}
      >
        <Text variant="overline" tone="muted">
          Templates
        </Text>
        {templates.length > 0 && (
          <Link asChild href="/workouts/templates">
            <View className="flex-row items-center gap-1">
              <Text tone="primary" weight="medium" variant="small">
                See all
              </Text>
              <Icon as={ChevronRightIcon} tone="primary" size="sm" />
            </View>
          </Link>
        )}
      </View>

      {templates.length === 0 ? (
        <View className="border-border mt-6 flex-row items-center border-t border-b py-4">
          <View className="min-w-0 flex-1 gap-1">
            <Text variant="bodyMedium">No templates yet</Text>
            <Text variant="small" tone="muted">
              Save a routine to start faster next time.
            </Text>
          </View>

          <Button
            variant="ghost"
            size="sm"
            className="min-h-12 shrink-0 px-0 py-0 pl-4"
            textClassName="text-primary text-body"
            onPress={handleCreateTemplatePress}
          >
            Create
          </Button>
        </View>
      ) : (
        <View>
          {templates.map(item => (
            <WorkoutTemplateListRow
              key={item.template.id}
              item={item}
              onPress={handleTemplatePress}
            />
          ))}
        </View>
      )}
    </View>
  );
};
