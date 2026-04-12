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
    instructions: 'Lower the bar to the mid chest, then press to lockout.',
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
    instructions:
      'Press from an incline bench with the bar over the upper chest.',
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
    instructions:
      'Press the bar overhead from shoulder height without leaning back.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Dumbbell Shoulder Press',
    category: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.shoulders]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    instructions:
      'Press both dumbbells overhead with control through the full range.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Lateral Raise',
    category: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.sideDelts]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.upperTraps]),
    instructions:
      'Raise dumbbells out to the sides to shoulder height with soft elbows.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Tricep Pushdown',
    category: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    instructions:
      'Keep elbows pinned and extend the handle until the arms are straight.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Skull Crushers',
    category: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    instructions:
      'Lower the bar toward the forehead, then extend the elbows to finish.',
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
    instructions:
      'Row the bar to the lower ribs while keeping the torso braced.',
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
    instructions:
      'Row the dumbbell toward the hip with the chest supported or braced.',
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
    instructions: 'Pull from a dead hang until the chin clears the bar.',
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
    instructions:
      'Pull the handle to the upper chest while keeping the torso stable.',
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
    instructions:
      'Pull the rope toward the face with elbows high and hands apart.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Bicep Curl',
    category: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.forearms]),
    instructions: 'Curl the weight without swinging the torso.',
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
    instructions:
      'Curl with a neutral grip and keep the elbows close to the body.',
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
    instructions:
      'Pull the handles toward the torso while staying glued to the pad.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Seated Cable Row',
    category: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    instructions: 'Row the handle to the mid torso without rocking backward.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Dips',
    category: 'bodyweight',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.chest, MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.frontDelts]),
    instructions:
      'Lower until the shoulders are below the elbows, then press up strongly.',
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
    instructions:
      'Sit down between the hips and stand up with the bar over midfoot.',
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
    instructions: 'Keep elbows high, stay upright, and squat to full depth.',
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
    instructions:
      'Push the floor away and lock out with the bar close to the legs.',
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
    instructions:
      'Hinge at the hips, lower to a stretch, and stand back up under control.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Hip Thrust',
    category: 'barbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    instructions: 'Drive the hips up until the torso is parallel to the floor.',
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
    instructions:
      'Lower the sled under control and press through the full foot.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Leg Extension',
    category: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([]),
    instructions: 'Extend the knees fully and pause briefly at the top.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Leg Curl',
    category: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    secondaryMuscles: JSON.stringify([]),
    instructions: 'Curl the pad toward the glutes without lifting the hips.',
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
    instructions: 'Step long, descend under control, and keep the torso tall.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Calf Raise',
    category: 'machine',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.calves]),
    secondaryMuscles: JSON.stringify([]),
    instructions:
      'Rise onto the toes, pause at the top, and lower to a full stretch.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'dumbbell',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.adductors]),
    instructions:
      'Drop straight down with the rear foot elevated and drive through the front foot.',
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
    instructions:
      'Brace hard and keep a straight line from shoulders to ankles.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Hanging Leg Raise',
    category: 'bodyweight',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs, MUSCLE_GROUP.hipFlexors]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.grip]),
    instructions: 'Lift the legs without swinging and lower with control.',
    isCustom: 0,
    isArchived: 0
  },
  {
    name: 'Cable Crunch',
    category: 'cable',
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.obliques]),
    instructions: 'Curl the torso down by driving the ribs toward the hips.',
    isCustom: 0,
    isArchived: 0
  }
];

export function seedDatabase(db: DrizzleDb): void {
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

export function runSeedIfNeeded(db: DrizzleDb): void {
  seedDatabase(db);
}
