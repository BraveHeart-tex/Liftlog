import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { DiscardWorkoutSheet } from '@/src/features/workouts/components/discard-workout-sheet';
import { RenameTemplateSheet } from '@/src/features/workouts/components/rename-template-sheet';
import { WorkoutTemplateActionsSheet } from '@/src/features/workouts/components/workout-template-actions-sheet';
import { useWorkoutTemplateDetail } from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import { getRouteParamId } from '@/src/lib/utils/route';
import { router, useLocalSearchParams } from 'expo-router';
import {
  DumbbellIcon,
  EllipsisVerticalIcon,
  ListOrderedIcon
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

export default function WorkoutTemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const templateId = getRouteParamId(id);
  const detail = useWorkoutTemplateDetail(templateId);

  if (templateId && detail.isLoading) {
    return (
      <Screen withPadding={false}>
        <LoadingState label="Loading template..." />
      </Screen>
    );
  }

  if (!detail.template) {
    return (
      <Screen
        withPadding={false}
        contentClassName="items-center justify-center px-6"
      >
        <Text variant="h3" className="text-center">
          Template not found
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          This template may have been deleted.
        </Text>
        <BackButton variant="text" className="mt-6">
          Back to workouts
        </BackButton>
      </Screen>
    );
  }

  return <WorkoutTemplateDetailLoaded detail={detail} />;
}

interface WorkoutTemplateDetailLoadedProps {
  detail: ReturnType<typeof useWorkoutTemplateDetail> & {
    template: NonNullable<
      ReturnType<typeof useWorkoutTemplateDetail>['template']
    >;
  };
}

function WorkoutTemplateDetailLoaded({
  detail
}: WorkoutTemplateDetailLoadedProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const [isReplaceSheetOpen, setIsReplaceSheetOpen] = useState(false);

  const { activeWorkout, template, templateExerciseRows, exerciseById } =
    detail;
  const exerciseCount = templateExerciseRows.length;
  const exerciseSummary = useMemo(() => {
    const exerciseNames = templateExerciseRows
      .map(
        templateExercise => exerciseById.get(templateExercise.exerciseId)?.name
      )
      .filter((name): name is string => Boolean(name));

    if (exerciseNames.length === 0) {
      return 'No exercises';
    }

    return exerciseNames.join(' • ');
  }, [exerciseById, templateExerciseRows]);

  const handleStartWorkout = () => {
    if (activeWorkout) {
      setIsReplaceSheetOpen(true);

      return;
    }

    detail.startWorkoutFromTemplate();
  };

  const handleRenameTemplate = (nextTemplateId: string, name: string) =>
    Boolean(detail.renameTemplate(nextTemplateId, name));

  const confirmDeleteTemplate = () => {
    Alert.alert(
      'Delete template?',
      `${template.name} will be removed from your saved templates.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            detail.removeTemplate(template.id);

            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/workout');
            }
          }
        }
      ]
    );
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          className="w-full"
          leftIcon={
            <Icon icon={DumbbellIcon} className="text-primary-foreground" />
          }
          onPress={handleStartWorkout}
        >
          Start workout
        </Button>
      }
    >
      <View className="flex-row items-start gap-3">
        <BackButton />

        <View className="flex-1">
          <Text variant="h1" numberOfLines={2}>
            {template.name}
          </Text>
          <Text variant="small" tone="muted" className="mt-1">
            {exerciseCount === 1 ? '1 exercise' : `${exerciseCount} exercises`}
          </Text>
        </View>

        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Template actions"
          onPress={() => setIsActionSheetOpen(true)}
        >
          <Icon
            icon={EllipsisVerticalIcon}
            size={20}
            className="text-foreground"
          />
        </Button>
      </View>

      <Card className="mt-6">
        <CardContent>
          <View className="flex-row items-start gap-3">
            <View className="bg-secondary h-10 w-10 items-center justify-center rounded-lg">
              <Icon
                icon={ListOrderedIcon}
                className="text-secondary-foreground"
              />
            </View>
            <View className="flex-1">
              <Text variant="bodyMedium">Exercise plan</Text>
              <Text variant="small" tone="muted" className="mt-1">
                {exerciseSummary}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <View className="mt-6">
        <View className="flex-row items-center justify-between">
          <Text variant="caption" tone="muted" className="tracking-widest">
            EXERCISES
          </Text>
          {exerciseCount > 0 ? (
            <Text variant="caption" tone="muted">
              {exerciseCount} total
            </Text>
          ) : null}
        </View>

        {templateExerciseRows.length === 0 ? (
          <View className="mt-3 items-center py-8">
            <Text variant="small" tone="muted" className="text-center">
              No exercises saved in this template.
            </Text>
          </View>
        ) : (
          <View className="mt-3">
            {templateExerciseRows.map((templateExercise, index) => {
              const exercise = exerciseById.get(templateExercise.exerciseId);

              return (
                <Card
                  key={templateExercise.id}
                  className={cn(index > 0 && 'mt-3')}
                >
                  <CardContent className="flex-row items-center gap-3">
                    <View className="bg-muted h-9 w-9 items-center justify-center rounded-lg">
                      <Text variant="caption" tone="muted">
                        {index + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text variant="bodyMedium">
                        {exercise?.name ?? 'Unknown exercise'}
                      </Text>
                      <Text variant="caption" tone="muted" className="mt-1">
                        {exercise?.category ?? 'Exercise'}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      <RenameTemplateSheet
        isOpen={isRenameSheetOpen}
        templateId={template.id}
        initialName={template.name}
        onClose={() => setIsRenameSheetOpen(false)}
        onSubmit={handleRenameTemplate}
      />

      <WorkoutTemplateActionsSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onRename={() => setIsRenameSheetOpen(true)}
        onDelete={confirmDeleteTemplate}
      />

      {activeWorkout ? (
        <DiscardWorkoutSheet
          isOpen={isReplaceSheetOpen}
          onClose={() => setIsReplaceSheetOpen(false)}
          activeWorkoutName={activeWorkout.name}
          templateName={template.name}
          onResume={() => {
            setIsReplaceSheetOpen(false);
            detail.resumeWorkout();
          }}
          onDiscardAndStart={() => {
            setIsReplaceSheetOpen(false);
            detail.discardActiveWorkoutAndStartTemplate();
          }}
        />
      ) : null}
    </Screen>
  );
}
