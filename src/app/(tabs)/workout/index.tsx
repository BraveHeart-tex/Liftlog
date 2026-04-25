import { Button } from '@/src/components/ui/button';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { ActiveWorkoutSummaryCard } from '@/src/features/workouts/components/active-workout-summary-card';
import { DiscardWorkoutSheet } from '@/src/features/workouts/components/discard-workout-sheet';
import { RecentWorkoutCard } from '@/src/features/workouts/components/recent-workout-card';
import { RenameTemplateSheet } from '@/src/features/workouts/components/rename-template-sheet';
import { WorkoutTemplateCard } from '@/src/features/workouts/components/workout-template-card';
import { useWorkoutStart } from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

export default function WorkoutStartScreen() {
  const [now, setNow] = useState(() => Date.now());
  const [renameTemplateId, setRenameTemplateId] = useState<
    string | undefined
  >();
  const [pendingTemplateId, setPendingTemplateId] = useState<
    string | undefined
  >();
  const {
    activeWorkout,
    recentWorkouts,
    templates,
    startWorkout,
    resumeWorkout,
    startWorkoutFromTemplate,
    discardActiveWorkoutAndStartTemplate,
    renameTemplate,
    removeTemplate
  } = useWorkoutStart();

  const renameTarget = useMemo(
    () => templates.find(item => item.template.id === renameTemplateId),
    [renameTemplateId, templates]
  );

  const pendingTemplate = useMemo(
    () => templates.find(item => item.template.id === pendingTemplateId),
    [pendingTemplateId, templates]
  );

  useEffect(() => {
    if (!activeWorkout) {
      return;
    }

    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeWorkout]);

  const openRenameDialog = (templateId: string) => {
    setRenameTemplateId(templateId);
  };

  const closeRenameDialog = () => {
    setRenameTemplateId(undefined);
  };

  const submitRename = (templateId: string, name: string) =>
    Boolean(renameTemplate(templateId, name));

  const handleTemplatePress = (templateId: string) => {
    if (activeWorkout) {
      setPendingTemplateId(templateId);

      return;
    }

    startWorkoutFromTemplate(templateId);
  };

  const confirmTemplateDelete = (templateId: string, templateName: string) => {
    Alert.alert(
      'Delete template?',
      `${templateName} will be removed from your saved templates.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeTemplate(templateId);
          }
        }
      ]
    );
  };

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <View>
        <Text variant="h1">Workout</Text>
        <Text variant="small" tone="muted" className="mt-2">
          Start a new session or resume where you left off.
        </Text>
      </View>

      {activeWorkout ? (
        <ActiveWorkoutSummaryCard
          workout={activeWorkout}
          now={now}
          onPress={resumeWorkout}
        />
      ) : (
        <Button className="mt-6 w-full" onPress={startWorkout}>
          Start Workout
        </Button>
      )}

      {templates.length > 0 ? (
        <View className="mt-8">
          <Text variant="caption" tone="muted">
            Templates
          </Text>

          <View className="mt-3">
            {templates.map((item, index) => (
              <WorkoutTemplateCard
                key={item.template.id}
                item={item}
                className={cn(index > 0 && 'mt-3')}
                onPress={() => handleTemplatePress(item.template.id)}
                onRename={() => openRenameDialog(item.template.id)}
                onDelete={() =>
                  confirmTemplateDelete(item.template.id, item.template.name)
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-8">
        <Text variant="caption" tone="muted">
          Recent workouts
        </Text>

        {recentWorkouts.length > 0 ? (
          <View className="mt-3">
            {recentWorkouts.map((workout, index) => (
              <RecentWorkoutCard
                key={workout.id}
                workout={workout}
                className={cn(index > 0 && 'mt-3')}
                onPress={() => {
                  router.push({
                    pathname: '/workouts/[id]',
                    params: { id: workout.id }
                  } as unknown as Href);
                }}
              />
            ))}
          </View>
        ) : (
          <View className="border-border bg-card mt-3 items-center justify-center rounded-lg border border-dashed px-6 py-10">
            <Text variant="h3" className="text-center">
              No workouts yet
            </Text>
            <Text variant="small" tone="muted" className="mt-2 text-center">
              Start your first session to see history here.
            </Text>
          </View>
        )}
      </View>

      <RenameTemplateSheet
        isOpen={Boolean(renameTarget)}
        templateId={renameTarget?.template.id}
        initialName={renameTarget?.template.name ?? ''}
        onClose={closeRenameDialog}
        onSubmit={submitRename}
      />

      <DiscardWorkoutSheet
        isOpen={Boolean(pendingTemplate && activeWorkout)}
        onClose={() => setPendingTemplateId(undefined)}
        activeWorkoutName={activeWorkout?.name}
        templateName={pendingTemplate?.template?.name}
        onResume={() => {
          setPendingTemplateId(undefined);
          resumeWorkout();
        }}
        onDiscardAndStart={() => {
          if (!pendingTemplate) {
            return;
          }

          discardActiveWorkoutAndStartTemplate(pendingTemplate.template.id);

          setPendingTemplateId(undefined);
        }}
      />
    </Screen>
  );
}
