import type { DrizzleDb } from '@/src/db';
import { appMeta, exercises, type NewExercise } from '@/src/db/schema';
import { MUSCLE_GROUP } from '@/src/features/exercises/constants';
import { eq } from 'drizzle-orm';

const HAS_SEEDED_KEY = 'has_seeded';
const LEGACY_EXERCISE_SEED_VERSION_KEY = 'exercise_seed_version';

const createSeedExercises = (): NewExercise[] => [
  {
    name: 'Bench Press',
    category: 'barbell',
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
    category: 'barbell',
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
    category: 'barbell',
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
    category: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.shoulders]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Lateral Raise',
    category: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.sideDelts]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.upperTraps]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Tricep Pushdown',
    category: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Skull Crushers',
    category: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Barbell Row',
    category: 'barbell',
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
    category: 'dumbbell',
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
    category: 'bodyweight',
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
    category: 'machine',
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
    category: 'cable',
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
    category: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.forearms]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Hammer Curl',
    category: 'dumbbell',
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
    category: 'machine',
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
    category: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Dips',
    category: 'bodyweight',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.chest, MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.frontDelts]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Back Squat',
    category: 'barbell',
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
    category: 'barbell',
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
    category: 'barbell',
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
    category: 'barbell',
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
    category: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Leg Press',
    category: 'machine',
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
    category: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Leg Curl',
    category: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Walking Lunges',
    category: 'dumbbell',
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
    category: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.calves]),
    secondaryMuscles: JSON.stringify([]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.adductors]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Plank',
    category: 'bodyweight',
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
    category: 'bodyweight',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs, MUSCLE_GROUP.hipFlexors]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.grip]),
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Cable Crunch',
    category: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.obliques]),
    isCustom: 0,
    isArchived: 0
  }
];

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
    return;
  }

  if (legacySeedMarker) {
    db.insert(appMeta)
      .values({
        key: HAS_SEEDED_KEY,
        value: 'true'
      })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: {
          value: 'true'
        }
      })
      .run();

    return;
  }

  db.transaction(tx => {
    tx.insert(exercises).values(createSeedExercises()).run();
    tx.insert(appMeta)
      .values({
        key: HAS_SEEDED_KEY,
        value: 'true'
      })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: {
          value: 'true'
        }
      })
      .run();
  });
}
