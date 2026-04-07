import { DrizzleDb } from "@/src/db";
import { appMeta, exercises, type NewExercise } from "@/src/db/schema";
import { generateUuid } from "@/src/lib/utils/uuid";
import { eq } from "drizzle-orm";

const HAS_SEEDED_KEY = "has_seeded";

const MUSCLE_GROUP = {
  abs: "abs",
  adductors: "adductors",
  biceps: "biceps",
  brachialis: "brachialis",
  calves: "calves",
  chest: "chest",
  forearms: "forearms",
  frontDelts: "front delts",
  glutes: "glutes",
  grip: "grip",
  hamstrings: "hamstrings",
  hipFlexors: "hip flexors",
  lats: "lats",
  lowerBack: "lower back",
  obliques: "obliques",
  quads: "quads",
  rearDelts: "rear delts",
  rotatorCuff: "rotator cuff",
  shoulders: "shoulders",
  sideDelts: "side delts",
  triceps: "triceps",
  upperBack: "upper back",
  upperChest: "upper chest",
  upperTraps: "upper traps",
} as const;

const SEEDED_EXERCISES: NewExercise[] = [
  {
    id: generateUuid(),
    userId: null,
    name: "Bench Press",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.chest]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.frontDelts,
      MUSCLE_GROUP.triceps,
    ]),
    instructions: "Lower the bar to the mid chest, then press to lockout.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Incline Bench Press",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperChest]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.frontDelts,
      MUSCLE_GROUP.triceps,
    ]),
    instructions:
      "Press from an incline bench with the bar over the upper chest.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Overhead Press",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.shoulders]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.triceps,
      MUSCLE_GROUP.upperChest,
    ]),
    instructions:
      "Press the bar overhead from shoulder height without leaning back.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Dumbbell Shoulder Press",
    category: "dumbbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.shoulders]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    instructions:
      "Press both dumbbells overhead with control through the full range.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Lateral Raise",
    category: "dumbbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.sideDelts]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.upperTraps]),
    instructions:
      "Raise dumbbells out to the sides to shoulder height with soft elbows.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Tricep Pushdown",
    category: "cable",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    instructions:
      "Keep elbows pinned and extend the handle until the arms are straight.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Skull Crushers",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([]),
    instructions:
      "Lower the bar toward the forehead, then extend the elbows to finish.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Barbell Row",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.rearDelts,
    ]),
    instructions:
      "Row the bar to the lower ribs while keeping the torso braced.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Dumbbell Row",
    category: "dumbbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.rearDelts,
    ]),
    instructions:
      "Row the dumbbell toward the hip with the chest supported or braced.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Pull Up",
    category: "bodyweight",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.upperBack,
    ]),
    instructions: "Pull from a dead hang until the chin clears the bar.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Lat Pulldown",
    category: "machine",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.upperBack,
    ]),
    instructions:
      "Pull the handle to the upper chest while keeping the torso stable.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Face Pull",
    category: "cable",
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.rearDelts,
      MUSCLE_GROUP.upperBack,
    ]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.rotatorCuff]),
    instructions:
      "Pull the rope toward the face with elbows high and hands apart.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Bicep Curl",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.forearms]),
    instructions: "Curl the weight without swinging the torso.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Hammer Curl",
    category: "dumbbell",
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.brachialis,
    ]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.forearms]),
    instructions:
      "Curl with a neutral grip and keep the elbows close to the body.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Chest-Supported Row",
    category: "machine",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.biceps,
      MUSCLE_GROUP.rearDelts,
    ]),
    instructions:
      "Pull the handles toward the torso while staying glued to the pad.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Seated Cable Row",
    category: "cable",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.upperBack, MUSCLE_GROUP.lats]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.biceps]),
    instructions: "Row the handle to the mid torso without rocking backward.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Dips",
    category: "bodyweight",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.chest, MUSCLE_GROUP.triceps]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.frontDelts]),
    instructions:
      "Lower until the shoulders are below the elbows, then press up strongly.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Back Squat",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.adductors,
      MUSCLE_GROUP.lowerBack,
    ]),
    instructions:
      "Sit down between the hips and stand up with the bar over midfoot.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Front Squat",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.upperBack,
    ]),
    instructions: "Keep elbows high, stay upright, and squat to full depth.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Deadlift",
    category: "barbell",
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.hamstrings,
    ]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.lowerBack,
      MUSCLE_GROUP.upperBack,
    ]),
    instructions:
      "Push the floor away and lock out with the bar close to the legs.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Romanian Deadlift",
    category: "barbell",
    primaryMuscles: JSON.stringify([
      MUSCLE_GROUP.hamstrings,
      MUSCLE_GROUP.glutes,
    ]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.lowerBack]),
    instructions:
      "Hinge at the hips, lower to a stretch, and stand back up under control.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Hip Thrust",
    category: "barbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    instructions: "Drive the hips up until the torso is parallel to the floor.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Leg Press",
    category: "machine",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.hamstrings,
    ]),
    instructions:
      "Lower the sled under control and press through the full foot.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Leg Extension",
    category: "machine",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads]),
    secondaryMuscles: JSON.stringify([]),
    instructions: "Extend the knees fully and pause briefly at the top.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Leg Curl",
    category: "machine",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.hamstrings]),
    secondaryMuscles: JSON.stringify([]),
    instructions: "Curl the pad toward the glutes without lifting the hips.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Walking Lunges",
    category: "dumbbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.hamstrings,
      MUSCLE_GROUP.adductors,
    ]),
    instructions: "Step long, descend under control, and keep the torso tall.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Calf Raise",
    category: "machine",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.calves]),
    secondaryMuscles: JSON.stringify([]),
    instructions:
      "Rise onto the toes, pause at the top, and lower to a full stretch.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Bulgarian Split Squat",
    category: "dumbbell",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.quads, MUSCLE_GROUP.glutes]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.adductors]),
    instructions:
      "Drop straight down with the rear foot elevated and drive through the front foot.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Plank",
    category: "bodyweight",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs]),
    secondaryMuscles: JSON.stringify([
      MUSCLE_GROUP.glutes,
      MUSCLE_GROUP.obliques,
    ]),
    instructions:
      "Brace hard and keep a straight line from shoulders to ankles.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Hanging Leg Raise",
    category: "bodyweight",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs, MUSCLE_GROUP.hipFlexors]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.grip]),
    instructions: "Lift the legs without swinging and lower with control.",
    isArchived: 0,
  },
  {
    id: generateUuid(),
    userId: null,
    name: "Cable Crunch",
    category: "cable",
    primaryMuscles: JSON.stringify([MUSCLE_GROUP.abs]),
    secondaryMuscles: JSON.stringify([MUSCLE_GROUP.obliques]),
    instructions: "Curl the torso down by driving the ribs toward the hips.",
    isArchived: 0,
  },
];

export function seedDatabase(db: DrizzleDb): void {
  const hasSeeded = db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, HAS_SEEDED_KEY))
    .get();

  if (hasSeeded) {
    return;
  }

  db.transaction((tx) => {
    tx.insert(exercises).values(SEEDED_EXERCISES).run();
    tx.insert(appMeta).values({ key: HAS_SEEDED_KEY, value: "true" }).run();
  });
}

export function runSeedIfNeeded(db: DrizzleDb): void {
  seedDatabase(db);
}
