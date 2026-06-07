import { StyledScrollView } from '@/src/components/styled/scroll-view';
import { Button } from '@/src/components/ui/button';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import { WorkoutTemplateCard } from '@/src/features/workouts/components/workout-template-card';
import type { WorkoutStartTemplateItem } from '@/src/features/workouts/hooks/use-workout-start';
import { iconSizes } from '@/src/theme/sizes';
import { useRouter } from 'expo-router';
import { ClipboardListIcon, PlusIcon } from 'lucide-react-native';
import { View } from 'react-native';

interface WorkoutTemplatesSectionProps {
  templates: WorkoutStartTemplateItem[];
}

export const WorkoutTemplatesSection = ({
  templates
}: WorkoutTemplatesSectionProps) => {
  const router = useRouter();

  const handleTemplatePress = (templateId: string) => {
    router.push({
      pathname: '/workouts/templates/[id]',
      params: { id: templateId }
    });
  };

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between">
        <Text variant="overline" tone="muted">
          Templates
        </Text>
        {templates.length > 0 && (
          // TODO: Add create new template linking here
          <View className="flex-row items-center gap-1">
            <Icon
              icon={PlusIcon}
              className="text-primary"
              size={iconSizes.xs}
            />
            <Text tone="primary" variant="small">
              New
            </Text>
          </View>
        )}
      </View>

      {templates.length === 0 ? (
        <EmptyTemplates />
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

// TODO(FE-185): Extract empty state markup to a re-usable component
function EmptyTemplates() {
  return (
    <View className="mt-3 items-center py-4">
      <View className="bg-card h-12 w-12 items-center justify-center rounded-lg">
        <Icon
          icon={ClipboardListIcon}
          className="text-muted-foreground"
          size="md"
        />
      </View>

      <Text variant="bodyMedium" className="mt-3 text-center">
        No templates yet
      </Text>
      <Text variant="small" tone="muted" className="mt-1 text-center">
        Save a routine to start faster next time.
      </Text>

      {/* TODO: Add create new template linking here  */}
      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        textClassName="text-primary text-sm"
      >
        Create template
      </Button>
    </View>
  );
}
