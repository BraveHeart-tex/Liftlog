import { faker } from '@faker-js/faker';
import type { DrizzleDb } from '@/src/db/client';
import {
  appMeta,
  exercises,
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates,
  type Exercise,
  type NewPersonalRecord,
  type NewSet
} from '@/src/db/schema';
import { computeEstimated1RM } from '@/src/features/progress/repository';
import { eq, inArray } from 'drizzle-orm';

const DEV_SEED_KEY = 'dev_mock_seed_version';
const DEV_SEED_VERSION = '1';
const MAX_WORKOUTS = 150;
const DAY_MS = 24 * 60 * 60 * 1000;

interface WorkoutPlan {
  name: string;
  exerciseNames: string[];
}

interface LoadProfile {
  baseKg: number;
  weeklyProgressKg: number;
  minReps: number;
  maxReps: number;
}

const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    name: 'Push',
    exerciseNames: [
      'Bench Press',
      'Incline Bench Press',
      'Overhead Press',
      'Lateral Raise',
      'Tricep Pushdown'
    ]
  },
  {
    name: 'Pull',
    exerciseNames: [
      'Deadlift',
      'Pull Up',
      'Barbell Row',
      'Lat Pulldown',
      'Hammer Curl'
    ]
  },
  {
    name: 'Legs',
    exerciseNames: [
      'Back Squat',
      'Romanian Deadlift',
      'Leg Press',
      'Leg Curl',
      'Calf Raise'
    ]
  },
  {
    name: 'Upper',
    exerciseNames: [
      'Bench Press',
      'Chest-Supported Row',
      'Dumbbell Shoulder Press',
      'Seated Cable Row',
      'Face Pull'
    ]
  },
  {
    name: 'Lower',
    exerciseNames: [
      'Front Squat',
      'Hip Thrust',
      'Walking Lunges',
      'Leg Extension',
      'Cable Crunch'
    ]
  }
];

const LOAD_PROFILES: Record<string, LoadProfile> = {
  'Back Squat': { baseKg: 80, weeklyProgressKg: 0.65, minReps: 4, maxReps: 8 },
  'Barbell Row': { baseKg: 55, weeklyProgressKg: 0.4, minReps: 6, maxReps: 10 },
  'Bench Press': {
    baseKg: 62.5,
    weeklyProgressKg: 0.45,
    minReps: 5,
    maxReps: 9
  },
  'Cable Crunch': {
    baseKg: 35,
    weeklyProgressKg: 0.25,
    minReps: 10,
    maxReps: 15
  },
  'Calf Raise': {
    baseKg: 55,
    weeklyProgressKg: 0.35,
    minReps: 10,
    maxReps: 16
  },
  'Chest-Supported Row': {
    baseKg: 50,
    weeklyProgressKg: 0.35,
    minReps: 8,
    maxReps: 12
  },
  Deadlift: { baseKg: 100, weeklyProgressKg: 0.8, minReps: 3, maxReps: 6 },
  'Dumbbell Shoulder Press': {
    baseKg: 20,
    weeklyProgressKg: 0.18,
    minReps: 7,
    maxReps: 11
  },
  'Face Pull': { baseKg: 25, weeklyProgressKg: 0.18, minReps: 12, maxReps: 18 },
  'Front Squat': {
    baseKg: 62.5,
    weeklyProgressKg: 0.45,
    minReps: 5,
    maxReps: 8
  },
  'Hammer Curl': {
    baseKg: 14,
    weeklyProgressKg: 0.12,
    minReps: 8,
    maxReps: 13
  },
  'Hip Thrust': { baseKg: 90, weeklyProgressKg: 0.75, minReps: 6, maxReps: 10 },
  'Incline Bench Press': {
    baseKg: 50,
    weeklyProgressKg: 0.35,
    minReps: 6,
    maxReps: 10
  },
  'Lateral Raise': {
    baseKg: 8,
    weeklyProgressKg: 0.08,
    minReps: 12,
    maxReps: 18
  },
  'Lat Pulldown': {
    baseKg: 55,
    weeklyProgressKg: 0.35,
    minReps: 8,
    maxReps: 12
  },
  'Leg Curl': { baseKg: 37.5, weeklyProgressKg: 0.25, minReps: 9, maxReps: 14 },
  'Leg Extension': {
    baseKg: 45,
    weeklyProgressKg: 0.3,
    minReps: 10,
    maxReps: 15
  },
  'Leg Press': { baseKg: 150, weeklyProgressKg: 1.1, minReps: 8, maxReps: 12 },
  'Overhead Press': {
    baseKg: 35,
    weeklyProgressKg: 0.25,
    minReps: 5,
    maxReps: 9
  },
  'Pull Up': { baseKg: 0, weeklyProgressKg: 0, minReps: 5, maxReps: 10 },
  'Romanian Deadlift': {
    baseKg: 75,
    weeklyProgressKg: 0.55,
    minReps: 6,
    maxReps: 10
  },
  'Seated Cable Row': {
    baseKg: 55,
    weeklyProgressKg: 0.35,
    minReps: 8,
    maxReps: 12
  },
  'Tricep Pushdown': {
    baseKg: 30,
    weeklyProgressKg: 0.2,
    minReps: 10,
    maxReps: 15
  },
  'Walking Lunges': {
    baseKg: 20,
    weeklyProgressKg: 0.2,
    minReps: 8,
    maxReps: 12
  }
};

function hasDevSeeded(db: DrizzleDb): boolean {
  const seedMarker = db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, DEV_SEED_KEY))
    .get();

  return seedMarker?.value === DEV_SEED_VERSION;
}

function hasWorkoutData(db: DrizzleDb): boolean {
  const workout = db.select({ id: workouts.id }).from(workouts).limit(1).get();

  return Boolean(workout);
}

function getExerciseRowsByName(db: DrizzleDb): Map<string, Exercise> {
  const exerciseNames = WORKOUT_PLANS.flatMap(plan => plan.exerciseNames);
  const uniqueExerciseNames = [...new Set(exerciseNames)];
  const rows = db
    .select()
    .from(exercises)
    .where(inArray(exercises.name, uniqueExerciseNames))
    .all();

  return new Map(rows.map(exercise => [exercise.name, exercise]));
}

function getStartedAt(workoutIndex: number): number {
  const daysAgo = Math.round((MAX_WORKOUTS - workoutIndex) * 1.85);
  const date = faker.date.between({
    from: Date.now() - daysAgo * DAY_MS,
    to: Date.now() - Math.max(daysAgo - 1, 1) * DAY_MS
  });

  date.setHours(faker.number.int({ min: 6, max: 20 }));
  date.setMinutes(faker.helpers.arrayElement([0, 15, 30, 45]));
  date.setSeconds(0, 0);

  return date.getTime();
}

function roundToNearestHalf(value: number): number {
  return Math.max(0, Math.round(value * 2) / 2);
}

function buildSetRows({
  workoutExerciseId,
  exerciseName,
  weekIndex,
  completedAt
}: {
  workoutExerciseId: string;
  exerciseName: string;
  weekIndex: number;
  completedAt: number;
}): NewSet[] {
  const profile = LOAD_PROFILES[exerciseName];

  if (!profile) {
    return [];
  }

  const setCount = faker.number.int({ min: 3, max: 4 });
  const weightVariation = faker.number.int({ min: -2, max: 2 }) * 1.25;
  const weightKg = roundToNearestHalf(
    profile.baseKg + profile.weeklyProgressKg * weekIndex + weightVariation
  );
  const firstSetReps = faker.number.int({
    min: profile.minReps,
    max: profile.maxReps
  });

  return Array.from({ length: setCount }, (_, index) => ({
    workoutExerciseId,
    order: index,
    weightKg,
    reps: Math.max(profile.minReps - 2, firstSetReps - index),
    rpe: faker.helpers.arrayElement([7, 8, 8, 9, null]),
    status: 'completed',
    completedAt:
      completedAt + index * faker.number.int({ min: 3, max: 5 }) * 60_000
  }));
}

function maybeCreatePr(
  bestByExerciseId: Map<string, number>,
  record: Omit<NewPersonalRecord, 'estimated1rm'> & { estimated1rm: number }
): NewPersonalRecord | null {
  const currentBest = bestByExerciseId.get(record.exerciseId) ?? 0;

  if (record.estimated1rm <= currentBest) {
    return null;
  }

  bestByExerciseId.set(record.exerciseId, record.estimated1rm);

  return record;
}

export function runDevSeedIfNeeded(db: DrizzleDb): void {
  if (!__DEV__ || hasDevSeeded(db) || hasWorkoutData(db)) {
    return;
  }

  faker.seed(20260505);

  const exerciseRowsByName = getExerciseRowsByName(db);
  const missingExerciseName = WORKOUT_PLANS.flatMap(
    plan => plan.exerciseNames
  ).find(name => !exerciseRowsByName.has(name));

  if (missingExerciseName) {
    throw new Error(
      `Cannot run dev seed. Missing exercise: ${missingExerciseName}`
    );
  }

  db.transaction(tx => {
    const now = Date.now();
    const personalRecordRows: NewPersonalRecord[] = [];
    const bestPrByExerciseId = new Map<string, number>();

    for (const plan of WORKOUT_PLANS) {
      const template = tx
        .insert(workoutTemplates)
        .values({
          name: plan.name,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get();

      tx.insert(workoutTemplateExercises)
        .values(
          plan.exerciseNames.map((exerciseName, order) => ({
            templateId: template.id,
            exerciseId: exerciseRowsByName.get(exerciseName)!.id,
            order
          }))
        )
        .run();
    }

    for (let workoutIndex = 0; workoutIndex < MAX_WORKOUTS; workoutIndex += 1) {
      const plan = WORKOUT_PLANS[workoutIndex % WORKOUT_PLANS.length];
      const startedAt = getStartedAt(workoutIndex);
      const completedAt =
        startedAt + faker.number.int({ min: 45, max: 95 }) * 60_000;
      const workoutName = faker.helpers.arrayElement([
        plan.name,
        `${plan.name} Day`,
        `${plan.name} Session`
      ]);
      const workout = tx
        .insert(workouts)
        .values({
          name: workoutName,
          status: 'completed',
          startedAt,
          completedAt,
          notes: faker.helpers.arrayElement([
            null,
            null,
            faker.lorem.sentence({ min: 4, max: 9 })
          ])
        })
        .returning()
        .get();

      for (const [order, exerciseName] of plan.exerciseNames.entries()) {
        const exercise = exerciseRowsByName.get(exerciseName)!;
        const workoutExercise = tx
          .insert(workoutExercises)
          .values({
            workoutId: workout.id,
            exerciseId: exercise.id,
            order,
            notes: faker.helpers.arrayElement([null, null, 'Felt smooth'])
          })
          .returning()
          .get();
        const setRows = buildSetRows({
          workoutExerciseId: workoutExercise.id,
          exerciseName,
          weekIndex: Math.floor(workoutIndex / WORKOUT_PLANS.length),
          completedAt: startedAt + (order + 1) * 8 * 60_000
        });

        for (const setRow of setRows) {
          const set = tx.insert(sets).values(setRow).returning().get();
          const estimated1rm = computeEstimated1RM(set.weightKg, set.reps);
          const personalRecord = maybeCreatePr(bestPrByExerciseId, {
            exerciseId: exercise.id,
            setId: set.id,
            weightKg: set.weightKg,
            reps: set.reps,
            estimated1rm,
            achievedAt: set.completedAt ?? completedAt
          });

          if (personalRecord) {
            personalRecordRows.push(personalRecord);
          }
        }
      }
    }

    if (personalRecordRows.length > 0) {
      tx.insert(personalRecords).values(personalRecordRows).run();
    }

    tx.insert(appMeta)
      .values({
        key: DEV_SEED_KEY,
        value: DEV_SEED_VERSION
      })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: {
          value: DEV_SEED_VERSION
        }
      })
      .run();
  });
}
