import { generateUuid } from '@/src/lib/utils/uuid';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});

export const exercises = sqliteTable('exercises', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  name: text('name').notNull(),
  category: text('category').notNull(),
  primaryMuscles: text('primary_muscles').notNull().default('[]'),
  secondaryMuscles: text('secondary_muscles').notNull().default('[]'),
  instructions: text('instructions'),
  isCustom: integer('is_custom').notNull().default(0),
  isArchived: integer('is_archived').notNull().default(0),
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now())
});

export const workouts = sqliteTable('workouts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  name: text('name').notNull(),
  status: text('status').notNull().default('in_progress'),
  startedAt: integer('started_at')
    .notNull()
    .$defaultFn(() => Date.now()),
  completedAt: integer('completed_at'),
  notes: text('notes')
});

export const workoutExercises = sqliteTable('workout_exercises', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  order: integer('order').notNull(),
  notes: text('notes')
});

export const sets = sqliteTable('sets', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  workoutExerciseId: text('workout_exercise_id')
    .notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  rpe: integer('rpe'),
  status: text('status').notNull().default('pending'),
  completedAt: integer('completed_at')
});

export const personalRecords = sqliteTable('personal_records', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUuid()),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  setId: text('set_id')
    .notNull()
    .references(() => sets.id, { onDelete: 'cascade' }),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  estimated1rm: real('estimated_1rm').notNull(),
  achievedAt: integer('achieved_at').notNull()
});

export type AppMeta = typeof appMeta.$inferSelect;
export type NewAppMeta = typeof appMeta.$inferInsert;

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type NewPersonalRecord = typeof personalRecords.$inferInsert;
