import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/components/active-workout-edit-header';
import { ActiveWorkoutExercisePickerSheet } from '@/src/features/workouts/components/active-workout-exercise-picker-sheet';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { DiscardWorkoutSheet } from '@/src/features/workouts/components/discard-workout-sheet';
import { NewTemplateExerciseList } from '@/src/features/workouts/components/new-template-exercise-list';
import { RenameTemplateSheet } from '@/src/features/workouts/components/rename-template-sheet';
import { SupersetIndicator } from '@/src/features/workouts/components/superset-indicator';
import { WorkoutTemplateActionsSheet } from '@/src/features/workouts/components/workout-template-actions-sheet';
import { useWorkoutTemplateExerciseDraft } from '@/src/features/workouts/hooks/use-workout-template-exercise-draft';
import { useWorkoutTemplateDetail } from '@/src/features/workouts/hooks/use-workout-template-detail';
import {
  getSupersetLabelByRowId,
  groupSupersetBlocks
} from '@/src/features/workouts/superset.utils';
import { triggerWorkoutEditModeHaptics } from '@/src/features/workouts/workout.haptics';
import { cn } from '@/src/lib/utils/cn.utils';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import { usePreventRemove } from '@react-navigation/native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ClipboardListIcon,
  DumbbellIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Keyboard, Pressable, View } from 'react-native';

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

  return (
    <WorkoutTemplateDetailLoaded
      detail={{ ...detail, template: detail.template }}
    />
  );
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
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isCreateCustomExerciseOpen, setIsCreateCustomExerciseOpen] =
    useState(false);
  const [initialCustomExerciseName, setInitialCustomExerciseName] =
    useState('');

  const {
    activeWorkout,
    template,
    templateExerciseRows,
    exerciseById,
    isLoadingExercises,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    resumeWorkout,
    renameTemplate,
    removeTemplate
  } = detail;
  const exerciseDraft = useWorkoutTemplateExerciseDraft({
    template,
    templateExerciseRows,
    exerciseById
  });
  const {
    addExercises,
    changeRows,
    discard: discardExerciseDraft,
    draftTemplateExercises,
    hasChanges: hasExerciseChanges,
    isSaving: isSavingExercises,
    removeExercise: removeDraftExercise,
    save: saveExerciseDraft,
    selectedExerciseIds,
    stageCustomExercise,
    stagedCustomExerciseNames,
    start: startExerciseDraft
  } = exerciseDraft;
  const exerciseCount = templateExerciseRows.length;
  const supersetLabelByTemplateExerciseId = useMemo(() => {
    return getSupersetLabelByRowId(templateExerciseRows);
  }, [templateExerciseRows]);
  const supersetBlocks = useMemo(
    () => groupSupersetBlocks(templateExerciseRows),
    [templateExerciseRows]
  );
  const templateExerciseIndexById = useMemo(
    () =>
      new Map(
        templateExerciseRows.map((templateExercise, index) => [
          templateExercise.id,
          index
        ])
      ),
    [templateExerciseRows]
  );
  const canSaveExercises = hasExerciseChanges && !isSavingExercises;
  const openActions = useCallback(() => setIsActionSheetOpen(true), []);
  const closeActions = useCallback(() => setIsActionSheetOpen(false), []);
  const openRenameSheet = useCallback(() => setIsRenameSheetOpen(true), []);
  const closeRenameSheet = useCallback(() => setIsRenameSheetOpen(false), []);
  const closeReplaceSheet = useCallback(() => setIsReplaceSheetOpen(false), []);
  const openExercisePicker = useCallback(
    () => setIsExercisePickerOpen(true),
    []
  );
  const closeExercisePicker = useCallback(
    () => setIsExercisePickerOpen(false),
    []
  );
  const openCreateCustomExercise = useCallback((initialName?: string) => {
    Keyboard.dismiss();
    setInitialCustomExerciseName(initialName ?? '');
    setIsExercisePickerOpen(false);
    setIsCreateCustomExerciseOpen(true);
  }, []);
  const closeCreateCustomExercise = useCallback(
    () => setIsCreateCustomExerciseOpen(false),
    []
  );

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

    startExerciseDraft();
    setIsEditingExercises(true);
  };

  const enterExerciseEditModeFromLongPress = () => {
    enterExerciseEditMode(true);
  };

  const exitExerciseEditMode = () => {
    discardExerciseDraft();
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
    if (!canSaveExercises) {
      return;
    }

    const result = saveExerciseDraft();

    if (result.status === 'saved') {
      exitExerciseEditMode();

      return;
    }

    if (result.status === 'unchanged') {
      return;
    }

    console.error('Failed to update template exercises', result.error);
    Alert.alert(
      'Could not save exercise edits',
      result.status === 'conflict'
        ? 'The template or exercise library changed. Your draft was kept; review it and try again.'
        : 'Your draft was kept. Please try again.'
    );
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

  const reorderDraftExercises = useCallback(
    (rows: typeof draftTemplateExercises) => {
      changeRows(
        rows.map(row => ({
          id: row.id,
          supersetId: row.supersetId
        }))
      );
    },
    [changeRows]
  );

  if (isEditingExercises) {
    return (
      <Screen withPadding={false} edges={[]}>
        <ActiveWorkoutEditHeader
          workoutName={template.name}
          canSave={canSaveExercises}
          isSaving={isSavingExercises}
          onCancel={confirmDiscardExerciseChanges}
          onSave={saveExerciseChanges}
        />

        {draftTemplateExercises.length === 0 ? (
          <View className="flex-1 px-4 pb-6">
            <EmptyState
              layout="section"
              icon={ClipboardListIcon}
              title="No exercises added"
              description="Add exercises to this template or save it empty."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Icon as={PlusIcon} size="sm" tone="primary" />}
                  onPress={openExercisePicker}
                >
                  Add exercise
                </Button>
              }
            />
          </View>
        ) : (
          <>
            <NewTemplateExerciseList
              rows={draftTemplateExercises}
              onDeleteExercise={removeDraftExercise}
              onReorderExercises={reorderDraftExercises}
            />
            <View className="border-border pb-safe border-t px-4 pt-3">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={<Icon as={PlusIcon} size="sm" tone="foreground" />}
                onPress={openExercisePicker}
              >
                Add exercise
              </Button>
            </View>
          </>
        )}

        <ActiveWorkoutExercisePickerSheet
          mode="multiple"
          isOpen={isExercisePickerOpen}
          multipleDescription="Choose exercises to add to this template draft."
          selectedExerciseIds={selectedExerciseIds}
          onClose={closeExercisePicker}
          onSelectExercises={addExercises}
          onCreateCustomExercise={openCreateCustomExercise}
        />

        <CreateCustomExerciseSheet
          isOpen={isCreateCustomExerciseOpen}
          initialName={initialCustomExerciseName}
          description="Add it to this draft. It will be created when you save the template."
          saveLabel="Add to draft"
          reservedNames={stagedCustomExerciseNames}
          onClose={closeCreateCustomExercise}
          onSave={exercise => {
            stageCustomExercise(exercise);
            setIsCreateCustomExerciseOpen(false);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      withPadding
      edges={[]}
      footer={
        <Button
          fullWidth
          leftIcon={<Icon as={DumbbellIcon} tone="primaryForeground" />}
          onPress={handleStartWorkout}
        >
          Start workout
        </Button>
      }
    >
      <Stack.Screen
        options={{
          title: 'Template',
          headerBackVisible: true,
          headerLeft: undefined,
          headerTitleAlign: undefined,
          headerRight: () => (
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

      <View className="gap-1">
        <Text variant="h2">{template.name}</Text>
        <Text variant="small" tone="muted">
          {exerciseCount === 1 ? '1 exercise' : `${exerciseCount} exercises`}
        </Text>
      </View>

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
            {supersetBlocks.map((block, blockIndex) => {
              const renderExerciseCard = (
                templateExercise: (typeof templateExerciseRows)[number]
              ) => {
                const exercise = exerciseById.get(templateExercise.exerciseId);
                const supersetLabel = supersetLabelByTemplateExerciseId.get(
                  templateExercise.id
                );
                const exerciseIndex =
                  templateExerciseIndexById.get(templateExercise.id) ?? 0;

                return (
                  <Pressable
                    key={templateExercise.id}
                    onLongPress={enterExerciseEditModeFromLongPress}
                  >
                    <Card>
                      <CardContent className="flex-row items-center gap-3">
                        <View className="bg-muted h-9 w-9 items-center justify-center rounded-lg">
                          <Text variant="caption" tone="muted">
                            {exerciseIndex + 1}
                          </Text>
                        </View>
                        <View className="flex-1">
                          {supersetLabel ? (
                            <Text
                              variant="caption"
                              tone="muted"
                              className="mb-1"
                            >
                              {supersetLabel}
                            </Text>
                          ) : null}
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
              };

              return (
                <View key={block.id} className={cn(blockIndex > 0 && 'mt-3')}>
                  {renderExerciseCard(block.rows[0])}
                  {block.supersetId ? (
                    <>
                      <SupersetIndicator />
                      {renderExerciseCard(block.rows[1])}
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

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
