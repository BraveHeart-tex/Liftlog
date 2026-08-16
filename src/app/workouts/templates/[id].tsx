import { confirmDialog } from '@/src/components/ui/alert-dialog';
import { BackButton } from '@/src/components/ui/back-button';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Icon } from '@/src/components/ui/icon';
import { LoadingState } from '@/src/components/ui/loading-state';
import { Screen } from '@/src/components/ui/screen';
import { showSnackbar } from '@/src/components/ui/snackbar';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutEditHeader } from '@/src/features/workouts/components/active-workout-edit-header';
import { ActiveWorkoutExercisePickerSheet } from '@/src/features/workouts/components/active-workout-exercise-picker-sheet';
import { CreateCustomExerciseSheet } from '@/src/features/workouts/components/create-custom-exercise-sheet';
import { DiscardWorkoutSheet } from '@/src/features/workouts/components/discard-workout-sheet';
import { NewTemplateExerciseList } from '@/src/features/workouts/components/new-template-exercise-list';
import { RenameTemplateSheet } from '@/src/features/workouts/components/rename-template-sheet';
import { SupersetExerciseGroup } from '@/src/features/workouts/components/superset-exercise-group';
import { WorkoutTemplateActionsSheet } from '@/src/features/workouts/components/workout-template-actions-sheet';
import { useWorkoutTemplateDetail } from '@/src/features/workouts/hooks/use-workout-template-detail';
import { useWorkoutTemplateExerciseDraft } from '@/src/features/workouts/hooks/use-workout-template-exercise-draft';
import {
  getSupersetLabelByRowId,
  groupSupersetBlocks
} from '@/src/features/workouts/superset.utils';
import { triggerWorkoutEditModeHaptics } from '@/src/features/workouts/workout.haptics';
import { cn } from '@/src/lib/utils/cn.utils';
import { getRouteParamId } from '@/src/lib/utils/route.utils';
import {
  triggerHapticMedium,
  triggerHapticWarning
} from '@/src/lib/haptics/haptics';
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
import { Keyboard, Pressable, View } from 'react-native';

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

    void confirmDialog({
      title: 'Discard changes?',
      message: 'Your exercise changes will be lost.',
      confirmLabel: 'Discard',
      destructive: true
    }).then(confirmed => {
      if (confirmed) {
        exitExerciseEditMode();
      }
    });
  };

  const saveExerciseChanges = () => {
    if (!canSaveExercises) {
      return;
    }

    const result = saveExerciseDraft();

    if (result.status === 'saved') {
      triggerHapticMedium('template exercise edits');
      exitExerciseEditMode();

      return;
    }

    if (result.status === 'unchanged') {
      return;
    }

    console.error('Failed to update template exercises', result.error);
    showSnackbar({
      message:
        result.status === 'conflict'
          ? 'The template or exercise library changed. Your draft was kept; review it and try again.'
          : 'Your draft was kept. Please try again.',
      variant: result.status === 'conflict' ? 'warning' : 'danger'
    });
  };

  usePreventRemove(isEditingExercises, confirmDiscardExerciseChanges);

  const confirmDeleteTemplate = useCallback(() => {
    void confirmDialog({
      title: 'Delete template?',
      message: `"${template.name}" will be removed from your saved templates.`,
      confirmLabel: 'Delete',
      destructive: true
    }).then(confirmed => {
      if (!confirmed) {
        return;
      }

      if (!removeTemplate(template.id)) {
        return;
      }

      triggerHapticWarning('template deletion');

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/workout');
      }
    });
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
            <EmptyState>
              <EmptyState.Icon as={ClipboardListIcon} size="md" />
              <EmptyState.Title variant="bodyMedium">
                No exercises added
              </EmptyState.Title>
              <EmptyState.Description>
                Add exercises to this template or save it empty.
              </EmptyState.Description>
              <EmptyState.Action>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Icon as={PlusIcon} size="sm" tone="primary" />}
                  onPress={openExercisePicker}
                >
                  Add exercise
                </Button>
              </EmptyState.Action>
            </EmptyState>
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

        {isExercisePickerOpen ? (
          <ActiveWorkoutExercisePickerSheet
            mode="multiple"
            isOpen
            multipleDescription="Choose exercises to add to this template draft."
            selectedExerciseIds={selectedExerciseIds}
            onClose={closeExercisePicker}
            onSelectExercises={addExercises}
            onCreateCustomExercise={openCreateCustomExercise}
          />
        ) : null}

        {isCreateCustomExerciseOpen ? (
          <CreateCustomExerciseSheet
            isOpen
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
        ) : null}
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
          <EmptyState className="mt-3 py-8">
            <EmptyState.Title variant="bodyMedium">
              No exercises saved in this template.
            </EmptyState.Title>
          </EmptyState>
        ) : (
          <View className="mt-3">
            {supersetBlocks.map((block, blockIndex) => {
              const renderExerciseCard = (
                templateExercise: (typeof templateExerciseRows)[number],
                label?: string,
                isGrouped = false
              ) => {
                const exercise = exerciseById.get(templateExercise.exerciseId);
                const exerciseIndex =
                  templateExerciseIndexById.get(templateExercise.id) ?? 0;

                return (
                  <Pressable
                    key={templateExercise.id}
                    onLongPress={enterExerciseEditModeFromLongPress}
                  >
                    {isGrouped ? (
                      <View className="flex-row items-center gap-3 px-3 py-3">
                        <View className="bg-muted h-9 w-9 items-center justify-center rounded-full">
                          <Text variant="bodyMedium" tone="muted">
                            {label}
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
                      </View>
                    ) : (
                      <Card>
                        <CardContent className="flex-row items-center gap-3">
                          <View className="bg-muted h-9 w-9 items-center justify-center rounded-lg">
                            <Text variant="caption" tone="muted">
                              {exerciseIndex + 1}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text variant="bodyMedium">
                              {exercise?.name ?? 'Unknown exercise'}
                            </Text>
                            <Text
                              variant="caption"
                              tone="muted"
                              className="mt-1"
                            >
                              {exercise?.category ?? 'Exercise'}
                            </Text>
                          </View>
                        </CardContent>
                      </Card>
                    )}
                  </Pressable>
                );
              };

              return (
                <View key={block.id} className={cn(blockIndex > 0 && 'mt-3')}>
                  {block.supersetId ? (
                    <SupersetExerciseGroup
                      supersetLabel={
                        supersetLabelByTemplateExerciseId.get(
                          block.rows[0].id
                        ) ?? 'Superset'
                      }
                      renderRow={({ label, position }) =>
                        renderExerciseCard(
                          block.rows[position - 1],
                          label,
                          true
                        )
                      }
                    />
                  ) : (
                    renderExerciseCard(block.rows[0])
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {isRenameSheetOpen ? (
        <RenameTemplateSheet
          isOpen
          templateId={template.id}
          initialName={template.name}
          onClose={closeRenameSheet}
          onSubmit={handleRenameTemplate}
        />
      ) : null}

      {isActionSheetOpen ? (
        <WorkoutTemplateActionsSheet
          isOpen
          onClose={closeActions}
          onRename={openRenameSheet}
          onDelete={confirmDeleteTemplate}
        />
      ) : null}

      {activeWorkout && isReplaceSheetOpen ? (
        <DiscardWorkoutSheet
          isOpen
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
