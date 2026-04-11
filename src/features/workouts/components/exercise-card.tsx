import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader } from '@/src/components/ui/card';
import { Icon } from '@/src/components/ui/icon';
import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import type { Set } from '@/src/db/schema';
import {
  createSet,
  deleteSet,
  deleteWorkoutExercise,
  updateSet
} from '@/src/features/workouts/repository';
import { Trash2Icon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { SetEntryRow } from './set-entry-row';
import { SetForm } from './set-form';
import type { SetValues, WorkoutExerciseWithSets } from './types';

type ExerciseCardProps = {
  db: DrizzleDb;
  item: WorkoutExerciseWithSets;
  className?: string;
};

export function ExerciseCard({ db, item, className }: ExerciseCardProps) {
  const hasCompletedSets = item.sets.some(set => set.status === 'completed');
  const [editingSetId, setEditingSetId] = useState<Set['id'] | null>(null);
  const editingSet = item.sets.find(set => set.id === editingSetId);

  const handleAddSet = ({ weightKg, reps }: SetValues) => {
    createSet(db, {
      workoutExerciseId: item.workoutExercise.id,
      weightKg,
      reps,
      order: item.sets.length,
      status: 'completed',
      completedAt: Date.now()
    });
  };

  const handleUpdateSet = ({
    setId,
    weightKg,
    reps
  }: SetValues & { setId: Set['id'] }) => {
    updateSet(db, setId, {
      weightKg,
      reps,
      status: 'completed',
      completedAt: Date.now()
    });
    setEditingSetId(null);
  };

  const handleDeleteEditingSet = (setId: Set['id']) => {
    deleteSet(db, setId);
    setEditingSetId(null);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <Text variant="bodyMedium" className="flex-1">
          {item.exercise?.name ?? 'Unknown exercise'}
        </Text>

        {!hasCompletedSets ? (
          <Button
            variant="ghost"
            size="icon"
            onPress={() => deleteWorkoutExercise(db, item.workoutExercise.id)}
          >
            <Icon
              icon={Trash2Icon}
              size={18}
              className="text-muted-foreground"
            />
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        <SetForm
          editingSet={editingSet}
          onAddSet={handleAddSet}
          onUpdateSet={handleUpdateSet}
          onClear={() => setEditingSetId(null)}
          onDeleteSet={handleDeleteEditingSet}
        />

        <View className="mt-4">
          <Text variant="caption" tone="muted">
            Sets
          </Text>

          {item.sets.length > 0 ? (
            <View className="mt-2">
              {item.sets.map((set, index) => (
                <SetEntryRow
                  key={set.id}
                  set={set}
                  setNumber={index + 1}
                  isEditing={set.id === editingSetId}
                  onEdit={() =>
                    setEditingSetId(prev => (prev === set.id ? null : set.id))
                  }
                  onDeleteSet={() => {
                    deleteSet(db, set.id);
                    if (set.id === editingSetId) {
                      setEditingSetId(null);
                    }
                  }}
                />
              ))}
            </View>
          ) : (
            <Text variant="small" tone="muted" className="mt-2">
              No sets logged yet.
            </Text>
          )}
        </View>
      </CardContent>
    </Card>
  );
}
