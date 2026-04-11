import { Text } from '@/src/components/ui/text';
import type { DrizzleDb } from '@/src/db/client';
import type { Exercise, Set } from '@/src/db/schema';
import {
  buildExerciseHistory,
  getExerciseHistorySetsQuery,
  getExerciseHistoryWorkoutsQuery
} from '@/src/features/progress/repository';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { ScrollView, View } from 'react-native';
import { formatInputNumber } from './utils';

type ExerciseHistoryTabProps = {
  db: DrizzleDb;
  exerciseId: Exercise['id'];
};

function formatWorkoutDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(timestamp));
}

function getCompletedSets(sets: Set[]) {
  return sets.filter(set => set.status === 'completed');
}

export function ExerciseHistoryTab({
  db,
  exerciseId
}: ExerciseHistoryTabProps) {
  const { data: workoutRows = [] } = useLiveQuery(
    getExerciseHistoryWorkoutsQuery(db, exerciseId),
    [db, exerciseId]
  );
  const workoutIds = Array.from(
    new Set(workoutRows.map(row => row.workout.id))
  ).slice(0, 10);
  const { data: setRows = [] } = useLiveQuery(
    getExerciseHistorySetsQuery(db, exerciseId, workoutIds),
    [db, exerciseId, workoutIds.join(',')]
  );
  const history = buildExerciseHistory(workoutRows, setRows)
    .map(historyEntry => ({
      ...historyEntry,
      sets: getCompletedSets(historyEntry.sets)
    }))
    .filter(historyEntry => historyEntry.sets.length > 0)
    .slice(0, 10);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerClassName="px-4 pb-8"
      showsVerticalScrollIndicator={false}
    >
      {history.length === 0 ? (
        <View className="mt-6 items-center">
          <Text variant="h3" className="text-center">
            No history yet
          </Text>
          <Text variant="small" tone="muted" className="mt-2 text-center">
            Complete sets to see your history here.
          </Text>
        </View>
      ) : (
        history.map(historyEntry => (
          <View key={historyEntry.workout.id}>
            <Text variant="caption" tone="muted" className="mt-4 mb-2">
              {formatWorkoutDate(historyEntry.workout.startedAt)} ·{' '}
              {historyEntry.sets.length} sets
            </Text>

            {historyEntry.sets.map((set, index) => (
              <View key={set.id} className="flex-row items-center gap-3 py-1">
                <Text variant="caption" tone="muted" className="w-6">
                  {index + 1}
                </Text>
                <Text variant="caption">
                  {formatInputNumber(set.weightKg)} kg
                </Text>
                <Text variant="caption" tone="muted">
                  x
                </Text>
                <Text variant="caption">{set.reps} reps</Text>
              </View>
            ))}

            <View className="border-border mt-4 border-b" />
          </View>
        ))
      )}
    </ScrollView>
  );
}
