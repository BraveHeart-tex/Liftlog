import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Text } from '@/src/components/ui/text';
import { useWorkoutTemplates } from '@/src/features/workouts/hooks/use-workout-templates';
import { cn } from '@/src/lib/utils/cn.utils';
import { iconSizes } from '@/src/theme/sizes';
import { useRouter } from 'expo-router';
import { ChevronRightIcon, PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

const WORKOUT_TAB_TEMPLATE_LIMIT = 10;

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
          <Button
            variant="ghost"
            size="sm"
            className="min-h-0 px-0 py-0"
            textClassName="text-primary text-sm"
            leftIcon={<Icon as={PlusIcon} tone="primary" size={iconSizes.sm} />}
            onPress={handleCreateTemplatePress}
          >
            New
          </Button>
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
            <PressableSurface
              key={item.template.id}
              className="border-border flex-row items-center border-b py-4"
              accessibilityLabel={`Start ${item.template.name}`}
              onPress={() => handleTemplatePress(item.template.id)}
            >
              <View className="min-w-0 flex-1 gap-1">
                <Text variant="bodyMedium" numberOfLines={1}>
                  {item.template.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text variant="small" tone="muted" numberOfLines={1}>
                    {item.exerciseCount === 1
                      ? '1 exercise'
                      : `${item.exerciseCount} exercises`}
                  </Text>

                  <Text variant="small" tone="muted">
                    ·
                  </Text>

                  <Text
                    variant="small"
                    tone="muted"
                    numberOfLines={1}
                    className="flex-1"
                  >
                    {item.exerciseSummary}
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
      )}
    </View>
  );
};
