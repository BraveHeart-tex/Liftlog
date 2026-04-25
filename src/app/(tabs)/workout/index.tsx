import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';

import { Icon } from '@/src/components/ui/icon';
import { Screen } from '@/src/components/ui/screen';
import { Text } from '@/src/components/ui/text';
import { DiscardWorkoutSheet } from '@/src/features/workouts/components/discard-workout-sheet';
import { RenameTemplateSheet } from '@/src/features/workouts/components/rename-template-sheet';
import { useWorkoutStart } from '@/src/features/workouts/hooks';
import { cn } from '@/src/lib/utils/cn';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date';
import { router, type Href } from 'expo-router';
import { PencilIcon, Trash2Icon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

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
        <Pressable onPress={resumeWorkout} className="mt-6">
          <Card className="border-primary">
            <CardContent>
              <Text variant="caption" tone="muted">
                Workout in progress
              </Text>
              <Text variant="h3" className="mt-2">
                {activeWorkout.name}
              </Text>
              <Text variant="small" tone="muted" className="mt-2">
                {formatDuration({
                  startedAt: activeWorkout.startedAt,
                  completedAt: now
                })}
              </Text>
            </CardContent>
          </Card>
        </Pressable>
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
              <View
                key={item.template.id}
                className={cn(
                  'border-border bg-card rounded-lg border p-4',
                  index > 0 && 'mt-3'
                )}
              >
                <View className="flex-row items-start gap-3">
                  <Pressable
                    className="min-h-12 flex-1 justify-center"
                    onPress={() => handleTemplatePress(item.template.id)}
                  >
                    <Text variant="bodyMedium">{item.template.name}</Text>
                    <Text variant="small" tone="muted" className="mt-1">
                      {item.exerciseCount === 1
                        ? '1 exercise'
                        : `${item.exerciseCount} exercises`}
                    </Text>
                    <Text variant="caption" tone="muted" className="mt-2">
                      {item.exerciseSummary}
                    </Text>
                  </Pressable>

                  <View className="flex-row">
                    <Button
                      variant="ghost"
                      size="icon"
                      accessibilityLabel={`Rename ${item.template.name}`}
                      onPress={() => openRenameDialog(item.template.id)}
                    >
                      <Icon
                        icon={PencilIcon}
                        size={18}
                        className="text-foreground"
                      />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      accessibilityLabel={`Delete ${item.template.name}`}
                      onPress={() =>
                        confirmTemplateDelete(
                          item.template.id,
                          item.template.name
                        )
                      }
                    >
                      <Icon
                        icon={Trash2Icon}
                        size={18}
                        className="text-danger"
                      />
                    </Button>
                  </View>
                </View>
              </View>
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
              <Pressable
                key={workout.id}
                onPress={() => {
                  router.push({
                    pathname: '/workouts/[id]',
                    params: { id: workout.id }
                  } as unknown as Href);
                }}
                className={cn(
                  'border-border bg-card rounded-lg border p-4',
                  index > 0 && 'mt-3'
                )}
              >
                <Text variant="bodyMedium">{workout.name}</Text>
                <View className="mt-2 flex-row items-center gap-3">
                  <Text variant="caption" tone="muted">
                    {formatWorkoutDate(workout.startedAt)}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {formatDuration({
                      startedAt: workout.startedAt,
                      completedAt: workout.completedAt
                    })}
                  </Text>
                </View>
              </Pressable>
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
