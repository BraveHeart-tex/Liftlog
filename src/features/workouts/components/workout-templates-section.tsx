import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { WorkoutTemplateCard } from '@/src/features/workouts/components/workout-template-card';
import { useWorkoutTemplates } from '@/src/features/workouts/hooks/use-workout-templates';
import { iconSizes } from '@/src/theme/sizes';
import { useRouter } from 'expo-router';
import {
  ClipboardListIcon,
  ClipboardPlusIcon,
  PlusIcon
} from 'lucide-react-native';
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
    <View className="mt-8">
      <View className="flex-row items-center justify-between">
        <Text variant="overline" tone="muted">
          Templates
        </Text>
        {templates.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-0 px-0 py-0"
            textClassName="text-primary text-sm"
            leftIcon={<Icon as={PlusIcon} tone="primary" size={iconSizes.xs} />}
            onPress={handleCreateTemplatePress}
          >
            New
          </Button>
        )}
      </View>

      {templates.length === 0 ? (
        <EmptyState
          layout="section"
          icon={ClipboardListIcon}
          title="No templates yet"
          description="Save a routine to start faster next time."
          className="mt-3"
          action={
            <Button
              variant="secondary"
              size="sm"
              textClassName="text-primary text-sm"
              leftIcon={
                <Icon as={ClipboardPlusIcon} tone="primary" size="sm" />
              }
              onPress={handleCreateTemplatePress}
            >
              Create template
            </Button>
          }
        />
      ) : (
        <StyledScrollView
          className="mt-3"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-4"
        >
          {templates.map(item => (
            <WorkoutTemplateCard
              key={item.template.id}
              item={item}
              onPress={() => handleTemplatePress(item.template.id)}
            />
          ))}
        </StyledScrollView>
      )}
    </View>
  );
};
