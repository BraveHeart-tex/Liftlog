import { StyledFlashList } from '@/src/components/styled/flash-list';
import { Button } from '@/src/components/ui/button';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { Input } from '@/src/components/ui/input';
import { InputGroup, InputSlot } from '@/src/components/ui/input-group';
import { LoadingState } from '@/src/components/ui/loading-state';
import { PressableSurface } from '@/src/components/ui/pressable-surface';
import { Screen } from '@/src/components/ui/screen';
import { SearchInputIcon } from '@/src/components/ui/search-input-icon';
import { WorkoutTemplateListRow } from '@/src/features/workouts/templates/components/workout-template-list-row';
import type { WorkoutStartTemplateItem } from '@/src/features/workouts/templates/hooks/use-workout-templates';
import { useWorkoutTemplates } from '@/src/features/workouts/templates/hooks/use-workout-templates';
import { iconSizes } from '@/src/theme/sizes';
import { router } from 'expo-router';
import {
  ClipboardListIcon,
  CircleXIcon,
  DatabaseZapIcon,
  PlusIcon,
  SearchXIcon
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

export function WorkoutTemplatesScreen() {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <WorkoutTemplatesScreenContent
      key={retryKey}
      onRetry={() => setRetryKey(current => current + 1)}
    />
  );
}

function WorkoutTemplatesScreenContent({ onRetry }: { onRetry: () => void }) {
  const [query, setQuery] = useState('');
  const { templates, error, isLoading } = useWorkoutTemplates();

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return templates;
    }

    return templates.filter(item =>
      item.template.name.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [query, templates]);

  const handleTemplatePress = useCallback((templateId: string) => {
    router.navigate({
      pathname: '/workouts/templates/[id]',
      params: { id: templateId }
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: WorkoutStartTemplateItem }) => (
      <WorkoutTemplateListRow item={item} onPress={handleTemplatePress} />
    ),
    [handleTemplatePress]
  );

  const keyExtractor = useCallback(
    (item: WorkoutStartTemplateItem) => item.template.id,
    []
  );

  const handleCreateTemplatePress = useCallback(() => {
    router.navigate('/workouts/templates/new');
  }, []);

  if (isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading templates..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <EmptyState>
          <EmptyState.Icon as={DatabaseZapIcon} tone="primary" />
          <EmptyState.Title>Could not load templates</EmptyState.Title>
          <EmptyState.Description>
            Your templates are still on this device. Try again to reload them.
          </EmptyState.Description>
          <EmptyState.Action>
            <Button variant="secondary" onPress={onRetry}>
              Try again
            </Button>
          </EmptyState.Action>
        </EmptyState>
      </Screen>
    );
  }

  if (templates.length === 0) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <EmptyState className="gap-4">
          <EmptyState.Icon as={ClipboardListIcon} />
          <View className="gap-2">
            <EmptyState.Title weight="semiBold">
              No templates yet
            </EmptyState.Title>
            <EmptyState.Description>
              Create a template to make repeat workouts faster.
            </EmptyState.Description>
          </View>
          <EmptyState.Action>
            <Button
              leftIcon={
                <Icon
                  as={PlusIcon}
                  size={iconSizes.md}
                  tone="primaryForeground"
                />
              }
              onPress={handleCreateTemplatePress}
            >
              Create template
            </Button>
          </EmptyState.Action>
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen
      withPadding={false}
      footer={
        <Button
          fullWidth
          leftIcon={
            <Icon as={PlusIcon} size={iconSizes.md} tone="primaryForeground" />
          }
          onPress={handleCreateTemplatePress}
        >
          New template
        </Button>
      }
    >
      <StyledFlashList
        data={filteredTemplates}
        keyExtractor={keyExtractor}
        className="flex-1"
        contentContainerClassName="px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="pt-4 pb-4">
            <InputGroup className="min-h-11 px-3 py-2">
              <InputSlot className="mr-3">
                <SearchInputIcon />
              </InputSlot>
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search templates"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search templates"
                className="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0"
              />
              {query.length > 0 ? (
                <PressableSurface
                  className="h-10 w-10 items-center justify-center rounded-md"
                  accessibilityLabel="Clear template search"
                  onPress={() => setQuery('')}
                >
                  <Icon
                    as={CircleXIcon}
                    size={iconSizes.md}
                    tone="mutedForeground"
                  />
                </PressableSurface>
              ) : null}
            </InputGroup>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center px-2 pt-12 pb-10">
            <EmptyState className="gap-4">
              <EmptyState.Icon as={SearchXIcon} />
              <View className="gap-2">
                <EmptyState.Title weight="semiBold">
                  No templates found
                </EmptyState.Title>
                <EmptyState.Description>
                  We couldn&apos;t find a template matching &quot;{query.trim()}
                  &quot;.
                </EmptyState.Description>
              </View>
              <EmptyState.Action>
                <Button variant="ghost" onPress={() => setQuery('')}>
                  Clear search
                </Button>
              </EmptyState.Action>
            </EmptyState>
          </View>
        }
      />
    </Screen>
  );
}
