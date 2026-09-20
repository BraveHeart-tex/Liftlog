import type { Exercise, Set, Workout, WorkoutExercise } from '@/src/db/schema';
import { resolveTrackingType } from '@/src/features/progress/tracking.domain';
import type { CompletedWorkoutLogRow } from '@/src/features/workouts/history/history.repository';
import type { WorkoutStartTemplateItem } from '@/src/features/workouts/templates/workout-template.repository';
import {
  mapWorkoutExerciseSummary,
  type WorkoutExerciseSummaryUiModel
} from '@/src/features/workouts/shared/workout-exercise-summary.ui-model';
import {
  formatSupersetLabel,
  groupSupersetBlocks
} from '@/src/features/workouts/shared/superset.utils';
import { formatDuration, formatWorkoutDate } from '@/src/lib/utils/date.utils';
import {
  formatWeightForUnit,
  type WeightUnit
} from '@/src/lib/utils/weight.utils';

export interface WorkoutLogItemUiModel {
  id: string;
  name: string;
  durationLabel: string;
  dateLabel: string;
  setCountLabel: string;
}

export interface WorkoutLogDayUiModel {
  dateLabel: string;
  workoutCountLabel: string;
}

export interface WorkoutHistoryExerciseUiModel extends WorkoutExerciseSummaryUiModel {
  id: string;
}

export interface WorkoutHistoryBlockUiModel {
  id: string;
  supersetLabel?: string;
  exercises: WorkoutHistoryExerciseUiModel[];
}

export interface WorkoutTemplateExerciseInput {
  exerciseId: string;
  order: number;
  supersetId: string | null;
}

export interface WorkoutHistoryDetailUiModel {
  id: string;
  name: string;
  dateLabel: string;
  durationLabel: string;
  setCountLabel: string;
  volumeLabel: string;
  exerciseCountLabel?: string;
  exerciseBlocks: WorkoutHistoryBlockUiModel[];
  canSaveAsTemplate: boolean;
  repeatButtonLabel: string;
  templateExerciseRows: WorkoutTemplateExerciseInput[];
}

interface WorkoutHistoryDetailSource {
  workout: Workout;
  workoutExerciseRows: WorkoutExercise[];
  exerciseById: ReadonlyMap<Exercise['id'], Exercise>;
  setsByWorkoutExerciseId: ReadonlyMap<WorkoutExercise['id'], Set[]>;
  totalVolume: number;
  totalCompletedSets: number;
}

interface WorkoutHistoryDetailUiOptions {
  hasActiveWorkout: boolean;
  hasSavedTemplate: boolean;
}

export interface WorkoutLogTemplateUiModel {
  id: string;
  name: string;
  exerciseCountLabel: string;
  exerciseSummary: string;
}

interface GroupableWorkoutHistoryExerciseUiModel extends WorkoutHistoryExerciseUiModel {
  supersetId: string | null;
}

function formatSetCount(count: number) {
  return `${count} ${count === 1 ? 'set' : 'sets'}`;
}

export function mapWorkoutLogItems(
  rows: CompletedWorkoutLogRow[]
): WorkoutLogItemUiModel[] {
  return rows.map(({ workout, setCount }) => ({
    id: workout.id,
    name: workout.name,
    durationLabel: formatDuration(workout),
    dateLabel: formatWorkoutDate(workout.startedAt),
    setCountLabel: formatSetCount(setCount)
  }));
}

export function mapWorkoutLogDay(
  dateKey: string,
  workoutCount: number
): WorkoutLogDayUiModel {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return {
    dateLabel: new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date),
    workoutCountLabel: `${workoutCount} ${
      workoutCount === 1 ? 'workout' : 'workouts'
    }`
  };
}

export function mapWorkoutLogStartDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);

  return formatWorkoutDate(
    new Date(year, month - 1, day, 12, 0, 0, 0).getTime(),
    'full'
  );
}

export function mapWorkoutLogTemplates(
  templates: WorkoutStartTemplateItem[]
): WorkoutLogTemplateUiModel[] {
  return templates.map(item => ({
    id: item.template.id,
    name: item.template.name,
    exerciseCountLabel: `${item.exerciseCount} ${
      item.exerciseCount === 1 ? 'exercise' : 'exercises'
    }`,
    exerciseSummary: item.exerciseSummary
  }));
}

function mapWorkoutHistoryExercise(
  workoutExercise: WorkoutExercise,
  exercise: Exercise | undefined,
  completedSets: Set[],
  weightUnit: WeightUnit
): GroupableWorkoutHistoryExerciseUiModel {
  const trackingType = resolveTrackingType(exercise?.trackingType);

  return {
    id: workoutExercise.id,
    ...mapWorkoutExerciseSummary({
      exerciseName: exercise?.name ?? 'Unknown exercise',
      completedSets,
      weightUnit,
      trackingType
    }),
    supersetId: workoutExercise.supersetId
  };
}

export function mapWorkoutHistoryDetailUiModel(
  source: WorkoutHistoryDetailSource,
  weightUnit: WeightUnit,
  options: WorkoutHistoryDetailUiOptions
): WorkoutHistoryDetailUiModel {
  const exercises = source.workoutExerciseRows.map(workoutExercise =>
    mapWorkoutHistoryExercise(
      workoutExercise,
      source.exerciseById.get(workoutExercise.exerciseId),
      source.setsByWorkoutExerciseId.get(workoutExercise.id) ?? [],
      weightUnit
    )
  );
  let supersetIndex = 0;
  const exerciseBlocks = groupSupersetBlocks(exercises).map(block => {
    const mappedExercises = block.rows.map(
      ({ supersetId: _supersetId, ...exercise }) => exercise
    );

    return {
      id: block.id,
      supersetLabel: block.supersetId
        ? formatSupersetLabel(supersetIndex++)
        : undefined,
      exercises: mappedExercises
    };
  });

  return {
    id: source.workout.id,
    name: source.workout.name,
    dateLabel: formatWorkoutDate(source.workout.startedAt, 'full'),
    durationLabel: formatDuration(source.workout),
    setCountLabel: String(source.totalCompletedSets),
    volumeLabel: `${formatWeightForUnit(source.totalVolume, weightUnit, {
      useGrouping: true,
      maximumFractionDigits: 0
    })} ${weightUnit}`,
    exerciseCountLabel:
      exercises.length > 0 ? `${exercises.length} total` : undefined,
    exerciseBlocks,
    canSaveAsTemplate: exercises.length > 0 && !options.hasSavedTemplate,
    repeatButtonLabel: options.hasActiveWorkout
      ? 'Resume active workout'
      : 'Repeat this workout',
    templateExerciseRows: source.workoutExerciseRows.map(workoutExercise => ({
      exerciseId: workoutExercise.exerciseId,
      order: workoutExercise.order,
      supersetId: workoutExercise.supersetId
    }))
  };
}
