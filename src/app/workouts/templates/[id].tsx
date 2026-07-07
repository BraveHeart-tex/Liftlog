import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import type { ExerciseListItem } from '@/src/features/exercises/exercise.repository';
import { DiscardWorkoutSheet } from '@/src/features/workouts/components/discard-workout-sheet';
import { RenameTemplateSheet } from '@/src/features/workouts/components/rename-template-sheet';
import { TemplateExerciseEditor } from '@/src/features/workouts/components/template-exercise-editor';
import { WorkoutTemplateActionsSheet } from '@/src/features/workouts/components/workout-template-actions-sheet';
import { useWorkoutTemplateDetail } from '@/src/features/workouts/hooks/use-workout-template-detail';
import { triggerWorkoutEditModeHaptics } from '@/src/features/workouts/workout.haptics';
import { cn } from '@/src/lib/utils/cn.utils';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { usePreventRemove } from '@react-navigation/native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  DumbbellIcon,
  EllipsisIcon,
  PencilIcon,
  SaveIcon
} from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

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
  const [isEditingExercises, setIsEditingExercises] = useState(false);
  const [isSavingExercises, setIsSavingExercises] = useState(false);
  const [draftExercises, setDraftExercises] = useState<ExerciseListItem[]>([]);
  const isSavingExercisesRef = useRef(false);

  const {
    activeWorkout,
    template,
    templateExerciseRows,
    exerciseById,
    orderedExercises,
    isLoadingExercises,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    resumeWorkout,
    renameTemplate,
    saveTemplateExercises,
    removeTemplate
  } = detail;
  const exerciseCount = templateExerciseRows.length;
  const hasExerciseChanges = useMemo(
    () =>
      draftExercises.length !== orderedExercises.length ||
      draftExercises.some(
        (exercise, index) => exercise.id !== orderedExercises[index]?.id
      ),
    [draftExercises, orderedExercises]
  );
  const canSaveExercises = hasExerciseChanges && !isSavingExercises;
  const openActions = useCallback(() => setIsActionSheetOpen(true), []);
  const closeActions = useCallback(() => setIsActionSheetOpen(false), []);
  const openRenameSheet = useCallback(() => setIsRenameSheetOpen(true), []);
  const closeRenameSheet = useCallback(() => setIsRenameSheetOpen(false), []);
  const closeReplaceSheet = useCallback(() => setIsReplaceSheetOpen(false), []);

  const handleStartWorkout = () => {
    if (activeWorkout) {
      setIsReplaceSheetOpen(true);

      return;
    }

    startWorkoutFromTemplate();
  };

  const handleRenameTemplate = useCallback(
    (nextTemplateId: string, name: string) =>
      Boolean(renameTemplate(nextTemplateId, name)),
    [renameTemplate]
  );

  const resumeWorkoutFromReplaceSheet = useCallback(() => {
    setIsReplaceSheetOpen(false);
    resumeWorkout();
  }, [resumeWorkout]);

  const discardAndStartFromReplaceSheet = useCallback(() => {
    setIsReplaceSheetOpen(false);
    discardActiveWorkoutAndStartTemplate();
  }, [discardActiveWorkoutAndStartTemplate]);

  const enterExerciseEditMode = (shouldTriggerHaptics = false) => {
    if (isLoadingExercises || isEditingExercises) {
      return;
    }

    if (shouldTriggerHaptics) {
      triggerWorkoutEditModeHaptics();
    }

    setDraftExercises(orderedExercises);
    setIsEditingExercises(true);
  };

  const enterExerciseEditModeFromLongPress = () => {
    enterExerciseEditMode(true);
  };

  const exitExerciseEditMode = () => {
    setDraftExercises([]);
    setIsEditingExercises(false);
  };

  const confirmDiscardExerciseChanges = () => {
    if (!hasExerciseChanges) {
      exitExerciseEditMode();

      return;
    }

    Alert.alert('Discard changes?', 'Your exercise changes will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: exitExerciseEditMode
      }
    ]);
  };

  const saveExerciseChanges = () => {
    if (!canSaveExercises || isSavingExercisesRef.current) {
      return;
    }

    isSavingExercisesRef.current = true;
    setIsSavingExercises(true);

    try {
      const updatedTemplate = saveTemplateExercises(
        template.id,
        draftExercises
      );

      if (!updatedTemplate) {
        throw new Error('Template no longer exists.');
      }

      exitExerciseEditMode();
    } catch (error) {
      console.error('Failed to update template exercises', error);
      Alert.alert('Could not save changes', 'Please try again.');
    } finally {
      isSavingExercisesRef.current = false;
      setIsSavingExercises(false);
    }
  };

  usePreventRemove(isEditingExercises, confirmDiscardExerciseChanges);

  const confirmDeleteTemplate = useCallback(() => {
    Alert.alert(
      'Delete template?',
      `"${template.name}" will be removed from your saved templates.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeTemplate(template.id);

            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/workout');
            }
          }
        }
      ]
    );
  }, [removeTemplate, template.id, template.name]);

  return (
    <Screen
      scroll={!isEditingExercises}
      withPadding={!isEditingExercises}
      edges={[]}
      footer={
        isEditingExercises ? (
          <Button
            containerClassName="w-full"
            disabled={!canSaveExercises}
            loading={isSavingExercises}
            leftIcon={<Icon as={SaveIcon} tone="primaryForeground" />}
            onPress={saveExerciseChanges}
          >
            Save changes
          </Button>
        ) : (
          <Button
            containerClassName="w-full"
            leftIcon={<Icon as={DumbbellIcon} tone="primaryForeground" />}
            onPress={handleStartWorkout}
          >
            Start workout
          </Button>
        )
      }
    >
      <Stack.Screen
        options={{
          title: isEditingExercises ? 'Edit template' : 'Template',
          headerRight: () =>
            isEditingExercises ? (
              <Button
                variant="ghost"
                size="sm"
                onPress={confirmDiscardExerciseChanges}
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                accessibilityLabel="Template actions"
                onPress={openActions}
              >
                <Icon as={EllipsisIcon} size="lg" tone="foreground" />
              </Button>
            )
        }}
      />

      <View className={cn('gap-1', isEditingExercises && 'px-4 pt-6')}>
        <Text variant="h2">{template.name}</Text>
        <Text variant="small" tone="muted">
          {exerciseCount === 1 ? '1 exercise' : `${exerciseCount} exercises`}
        </Text>
      </View>

      {isEditingExercises ? (
        <View className="mt-6 flex-1">
          <TemplateExerciseEditor
            exercises={draftExercises}
            onChange={setDraftExercises}
          />
        </View>
      ) : (
        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <Text variant="overline" tone="muted" className="tracking-widest">
              EXERCISES
            </Text>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-0 px-0 py-0"
              textClassName="text-primary text-sm"
              disabled={isLoadingExercises}
              leftIcon={<Icon as={PencilIcon} tone="primary" size="sm" />}
              onPress={() => enterExerciseEditMode()}
            >
              Edit
            </Button>
          </View>

          {templateExerciseRows.length === 0 ? (
            <EmptyState
              layout="section"
              title="No exercises saved in this template."
              className="mt-3 py-8"
            />
          ) : (
            <View className="mt-3">
              {templateExerciseRows.map((templateExercise, index) => {
                const exercise = exerciseById.get(templateExercise.exerciseId);

                return (
                  <Pressable
                    key={templateExercise.id}
                    onLongPress={enterExerciseEditModeFromLongPress}
                  >
                    <Card className={cn(index > 0 && 'mt-3')}>
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
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      <RenameTemplateSheet
        isOpen={isRenameSheetOpen}
        templateId={template.id}
        initialName={template.name}
        onClose={closeRenameSheet}
        onSubmit={handleRenameTemplate}
      />

      <WorkoutTemplateActionsSheet
        isOpen={isActionSheetOpen}
        onClose={closeActions}
        onRename={openRenameSheet}
        onDelete={confirmDeleteTemplate}
      />

      {activeWorkout ? (
        <DiscardWorkoutSheet
          isOpen={isReplaceSheetOpen}
          onClose={closeReplaceSheet}
          activeWorkoutName={activeWorkout.name}
          templateName={template.name}
          onResume={resumeWorkoutFromReplaceSheet}
          onDiscardAndStart={discardAndStartFromReplaceSheet}
        />
      ) : null}
    </Screen>
  );
}
