import type { DrizzleDb } from '@/src/db';
import { appMeta, exercises, type NewExercise } from '@/src/db/schema';
import { normalizeExerciseName } from '@/src/features/exercises/exercise-name.utils';
import { MUSCLE_GROUP } from '@/src/features/exercises/exercise.constants';
import { rebuildPersonalRecordsForExercise } from '@/src/features/progress/progress.repository';
import { and, eq } from 'drizzle-orm';

const HAS_SEEDED_KEY = 'has_seeded';
const LEGACY_EXERCISE_SEED_VERSION_KEY = 'exercise_seed_version';
const PLANK_DURATION_TRACKING_SEED_KEY = 'plank_duration_tracking_seed_version';
const PLANK_DURATION_TRACKING_SEED_VERSION = '1';

const createSeedExercises = (): NewExercise[] => [
  {
    name: 'Bench Press',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.chest]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.frontDelts,
      MUSCLE_GROUP.triceps
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Incline Bench Press',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperChest]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.frontDelts,
      MUSCLE_GROUP.triceps
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Overhead Press',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.shoulders]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.triceps,
      MUSCLE_GROUP.upperChest
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Dumbbell Shoulder Press',
    equipment: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.shoulders]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Lateral Raise',
    equipment: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.sideDelts]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.upperTraps]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Tricep Pushdown',
    equipment: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Skull Crushers',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Barbell Row',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.rearDelts
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Dumbbell Row',
    equipment: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.rearDelts
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Pull Up',
    equipment: 'bodyweight',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.upperBack
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Lat Pulldown',
    equipment: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.upperBack
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Face Pull',
    equipment: 'cable',
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.rearDelts,
      MUSCLE_GROUP.upperBack
    ]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.rotatorCuff]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Bicep Curl',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.forearms]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Hammer Curl',
    equipment: 'dumbbell',
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.brachialis
    ]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.forearms]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Chest-Supported Row',
    equipment: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.rearDelts
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Seated Cable Row',
    equipment: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Dips',
    equipment: 'bodyweight',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.chest, MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.frontDelts]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Back Squat',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.adductors,
      MUSCLE_GROUP.lowerBack
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Front Squat',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.upperBack
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Deadlift',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.hamstrings
    ]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.lowerBack,
      MUSCLE_GROUP.upperBack
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Romanian Deadlift',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.hamstrings,
      MUSCLE_GROUP.glutes
    ]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.lowerBack]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Hip Thrust',
    equipment: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Leg Press',
    equipment: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.hamstrings
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Leg Extension',
    equipment: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Leg Curl',
    equipment: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Walking Lunges',
    equipment: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.hamstrings,
      MUSCLE_GROUP.adductors
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Calf Raise',
    equipment: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.calves]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Bulgarian Split Squat',
    equipment: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.adductors]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Plank',
    equipment: 'bodyweight',
    trackingType: 'duration',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.obliques
    ]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Hanging Leg Raise',
    equipment: 'bodyweight',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs, MUSCLE_GROUP.hipFlexors]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.grip]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Cable Crunch',
    equipment: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.obliques]),
    isCustom: 0,
    isArchived: 0
  }
];

function upsertAppMeta(db: DrizzleDb, key: string, value: string): void {
  db.insert(appMeta)
    .values({
      key,
      value
    })
    .onConflictDoUpdate({
      target: appMeta.key,
      set: {
        value
      }
    })
    .run();
}

function runSeedUpgrades(db: DrizzleDb): void {
  const plankDurationSeed = db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, PLANK_DURATION_TRACKING_SEED_KEY))
    .get();

  if (plankDurationSeed?.value === PLANK_DURATION_TRACKING_SEED_VERSION) {
    return;
  }

  const plank = db
    .select({ id: exercises.id })
    .from(exercises)
    .where(
      and(
        eq(exercises.name, 'Plank'),
        eq(exercises.isCustom, 0),
        eq(exercises.trackingType, 'weight_reps')
      )
    )
    .get();

  if (plank) {
    db.update(exercises)
      .set({ trackingType: 'duration' })
      .where(eq(exercises.id, plank.id))
      .run();
    rebuildPersonalRecordsForExercise(db, plank.id);
  }

  upsertAppMeta(
    db,
    PLANK_DURATION_TRACKING_SEED_KEY,
    PLANK_DURATION_TRACKING_SEED_VERSION
  );
}

export function runSeedIfNeeded(db: DrizzleDb): void {
  const hasSeeded = db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, HAS_SEEDED_KEY))
    .get();
  const legacySeedMarker = db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, LEGACY_EXERCISE_SEED_VERSION_KEY))
    .get();

  if (hasSeeded?.value === 'true') {
    runSeedUpgrades(db);

    return;
  }

  if (legacySeedMarker) {
    upsertAppMeta(db, HAS_SEEDED_KEY, 'true');
    runSeedUpgrades(db);

    return;
  }

  db.transaction(tx => {
    tx.insert(exercises)
      .values(
        createSeedExercises().map(exercise => ({
          ...exercise,
          normalizedName: normalizeExerciseName(exercise.name)
        }))
      )
      .run();
    tx.insert(appMeta)
      .values([
        {
          key: HAS_SEEDED_KEY,
          value: 'true'
        },
        {
          key: PLANK_DURATION_TRACKING_SEED_KEY,
          value: PLANK_DURATION_TRACKING_SEED_VERSION
        }
      ])
      .run();
  });
}
