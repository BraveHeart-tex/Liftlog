import { generateUuid } from "@/src/lib/utils/uuid";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  settings: text("settings").notNull().default("{}"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const exercises = sqliteTable("exercises", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  primaryMuscles: text("primary_muscles").notNull().default("[]"),
  secondaryMuscles: text("secondary_muscles").notNull().default("[]"),
  instructions: text("instructions"),
  isArchived: integer("is_archived").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const programs = sqliteTable("programs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isArchived: integer("is_archived").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const programDays = sqliteTable("program_days", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  programId: text("program_id")
    .notNull()
    .references(() => programs.id),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});

export const programExercises = sqliteTable("program_exercises", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  programDayId: text("program_day_id")
    .notNull()
    .references(() => programDays.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  order: integer("order").notNull(),
  targetSets: integer("target_sets").notNull(),
  targetReps: text("target_reps").notNull(),
  targetRpe: integer("target_rpe"),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
});

export const workouts = sqliteTable("workouts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  programId: text("program_id").references(() => programs.id),
  programDayId: text("program_day_id").references(() => programDays.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("in_progress"),
  startedAt: integer("started_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  completedAt: integer("completed_at"),
  notes: text("notes"),
});

export const workoutExercises = sqliteTable("workout_exercises", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  workoutId: text("workout_id")
    .notNull()
    .references(() => workouts.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  order: integer("order").notNull(),
  notes: text("notes"),
});

export const sets = sqliteTable("sets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  workoutExerciseId: text("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id),
  order: integer("order").notNull(),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  rpe: integer("rpe"),
  status: text("status").notNull().default("pending"),
  completedAt: integer("completed_at"),
});

export const personalRecords = sqliteTable("personal_records", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  setId: text("set_id")
    .notNull()
    .references(() => sets.id),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  estimated1rm: real("estimated_1rm").notNull(),
  achievedAt: integer("achieved_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;

export type ProgramDay = typeof programDays.$inferSelect;
export type NewProgramDay = typeof programDays.$inferInsert;

export type ProgramExercise = typeof programExercises.$inferSelect;
export type NewProgramExercise = typeof programExercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type NewPersonalRecord = typeof personalRecords.$inferInsert;
