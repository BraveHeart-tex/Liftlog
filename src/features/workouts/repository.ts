import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  sets,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates,
  type NewSet,
  type NewWorkout,
  type NewWorkoutExercise,
  type Set,
  type Workout,
  type WorkoutExercise,
  type WorkoutTemplate,
  type WorkoutTemplateExercise
} from '@/src/db/schema';
import { resolveTemplateName } from '@/src/lib/utils/workout';
import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm';

function getWorkoutRecordById(
  db: DrizzleDb,
  id: Workout['id']
): Workout | undefined {
  return db.select().from(workouts).where(eq(workouts.id, id)).get();
}

function getSetRecordById(db: DrizzleDb, id: Set['id']): Set | undefined {
  return db.select().from(sets).where(eq(sets.id, id)).get();
}

function getWorkoutTemplateRecordById(
  db: DrizzleDb,
  id: WorkoutTemplate['id']
): WorkoutTemplate | undefined {
  return db
    .select()
    .from(workoutTemplates)
    .where(eq(workoutTemplates.id, id))
    .get();
}

export function getWorkoutsQuery(db: DrizzleDb) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'completed'))
    .orderBy(desc(workouts.startedAt));
}

export function getWorkouts(db: DrizzleDb): Workout[] {
  return getWorkoutsQuery(db).all();
}

export function getRecentWorkoutsQuery(db: DrizzleDb, limit: number) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'completed'))
    .orderBy(desc(workouts.startedAt))
    .limit(limit);
}

export function getRecentWorkouts(db: DrizzleDb, limit: number): Workout[] {
  return getRecentWorkoutsQuery(db, limit).all();
}

export function getRecentExerciseIdsQuery(
  db: DrizzleDb,
  excludedExerciseIds: string[] = []
) {
  return db
    .select({ exerciseId: workoutExercises.exerciseId })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(
      and(
        eq(workouts.status, 'completed'),
        eq(exercises.isArchived, 0),
        excludedExerciseIds.length > 0
          ? notInArray(workoutExercises.exerciseId, excludedExerciseIds)
          : undefined
      )
    )
    .orderBy(desc(workouts.startedAt), asc(workoutExercises.order));
}

export function getRecentExerciseIdRows(
  db: DrizzleDb,
  excludedExerciseIds: string[] = []
): { exerciseId: string }[] {
  return getRecentExerciseIdsQuery(db, excludedExerciseIds).all();
}

export function getRecentExerciseIds(
  db: DrizzleDb,
  excludedExerciseIds: string[] = []
): string[] {
  const seenExerciseIds = new Set<string>();
  const recentExerciseIds: string[] = [];

  for (const row of getRecentExerciseIdRows(db, excludedExerciseIds)) {
    if (seenExerciseIds.has(row.exerciseId)) {
      continue;
    }

    seenExerciseIds.add(row.exerciseId);
    recentExerciseIds.push(row.exerciseId);
  }

  return recentExerciseIds;
}

export function getActiveWorkoutQuery(db: DrizzleDb) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.status, 'in_progress'))
    .orderBy(desc(workouts.startedAt));
}

export function getActiveWorkout(db: DrizzleDb): Workout | undefined {
  return getActiveWorkoutQuery(db).get();
}

export function getWorkoutByIdQuery(db: DrizzleDb, id: Workout['id']) {
  return db.select().from(workouts).where(eq(workouts.id, id));
}

export function getWorkoutById(
  db: DrizzleDb,
  id: Workout['id']
): Workout | undefined {
  return getWorkoutRecordById(db, id);
}

export function getWorkoutExercisesQuery(
  db: DrizzleDb,
  workoutId: Workout['id']
) {
  return db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.order));
}

export function getWorkoutExercises(
  db: DrizzleDb,
  workoutId: Workout['id']
): WorkoutExercise[] {
  return getWorkoutExercisesQuery(db, workoutId).all();
}

export function getWorkoutExercisesForWorkoutsQuery(
  db: DrizzleDb,
  workoutIds: Workout['id'][]
) {
  if (workoutIds.length === 0) {
    return getWorkoutExercisesQuery(db, '');
  }

  return db
    .select()
    .from(workoutExercises)
    .where(inArray(workoutExercises.workoutId, workoutIds))
    .orderBy(asc(workoutExercises.order));
}

export function getWorkoutExercisesForWorkouts(
  db: DrizzleDb,
  workoutIds: Workout['id'][]
): WorkoutExercise[] {
  return getWorkoutExercisesForWorkoutsQuery(db, workoutIds).all();
}

export function getWorkoutExerciseByIdQuery(
  db: DrizzleDb,
  id: WorkoutExercise['id']
) {
  return db.select().from(workoutExercises).where(eq(workoutExercises.id, id));
}

export function getWorkoutExerciseById(
  db: DrizzleDb,
  id: WorkoutExercise['id']
): WorkoutExercise | undefined {
  return getWorkoutExerciseByIdQuery(db, id).get();
}

export function getWorkoutTemplatesQuery(db: DrizzleDb) {
  return db
    .select()
    .from(workoutTemplates)
    .orderBy(
      desc(workoutTemplates.updatedAt),
      desc(workoutTemplates.createdAt)
    );
}

export function getWorkoutTemplates(db: DrizzleDb): WorkoutTemplate[] {
  return getWorkoutTemplatesQuery(db).all();
}

export function getWorkoutTemplateByIdQuery(
  db: DrizzleDb,
  id: WorkoutTemplate['id']
) {
  return db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
}

export function getWorkoutTemplateById(
  db: DrizzleDb,
  id: WorkoutTemplate['id']
): WorkoutTemplate | undefined {
  return getWorkoutTemplateRecordById(db, id);
}

export function getWorkoutTemplateExercisesQuery(
  db: DrizzleDb,
  templateId: WorkoutTemplate['id']
) {
  return db
    .select()
    .from(workoutTemplateExercises)
    .where(eq(workoutTemplateExercises.templateId, templateId))
    .orderBy(asc(workoutTemplateExercises.order));
}

export function getWorkoutTemplateExercises(
  db: DrizzleDb,
  templateId: WorkoutTemplate['id']
): WorkoutTemplateExercise[] {
  return getWorkoutTemplateExercisesQuery(db, templateId).all();
}

export function getWorkoutTemplateExercisesForTemplatesQuery(
  db: DrizzleDb,
  templateIds: WorkoutTemplate['id'][]
) {
  if (templateIds.length === 0) {
    return getWorkoutTemplateExercisesQuery(db, '');
  }

  return db
    .select()
    .from(workoutTemplateExercises)
    .where(inArray(workoutTemplateExercises.templateId, templateIds))
    .orderBy(asc(workoutTemplateExercises.order));
}

export function getWorkoutTemplateExercisesForTemplates(
  db: DrizzleDb,
  templateIds: WorkoutTemplate['id'][]
): WorkoutTemplateExercise[] {
  return getWorkoutTemplateExercisesForTemplatesQuery(db, templateIds).all();
}

export function getSetsByWorkoutExerciseIdQuery(
  db: DrizzleDb,
  workoutExerciseId: WorkoutExercise['id']
) {
  return db
    .select()
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId))
    .orderBy(asc(sets.order));
}

export function getSetsByWorkoutExerciseId(
  db: DrizzleDb,
  workoutExerciseId: WorkoutExercise['id']
): Set[] {
  return getSetsByWorkoutExerciseIdQuery(db, workoutExerciseId).all();
}

export function getSetsForWorkoutExercisesQuery(
  db: DrizzleDb,
  workoutExerciseIds: WorkoutExercise['id'][]
) {
  if (workoutExerciseIds.length === 0) {
    return db
      .select()
      .from(sets)
      .where(eq(sets.workoutExerciseId, ''))
      .orderBy(asc(sets.order));
  }

  return db
    .select()
    .from(sets)
    .where(inArray(sets.workoutExerciseId, workoutExerciseIds))
    .orderBy(asc(sets.order));
}

export function getSetsForWorkoutExercises(
  db: DrizzleDb,
  workoutExerciseIds: WorkoutExercise['id'][]
): Set[] {
  return getSetsForWorkoutExercisesQuery(db, workoutExerciseIds).all();
}

export function createWorkout(db: DrizzleDb, data: NewWorkout): Workout {
  return db.insert(workouts).values(data).returning().get();
}

export function updateWorkoutName(
  db: DrizzleDb,
  id: Workout['id'],
  name: Workout['name']
): Workout | undefined {
  return db
    .update(workouts)
    .set({ name })
    .where(eq(workouts.id, id))
    .returning()
    .get();
}

export function deleteWorkout(db: DrizzleDb, id: Workout['id']): boolean {
  const existingWorkout = getWorkoutRecordById(db, id);

  if (!existingWorkout) {
    return false;
  }

  db.delete(workouts).where(eq(workouts.id, id)).run();

  return true;
}

export function updateWorkoutTemplateName(
  db: DrizzleDb,
  id: WorkoutTemplate['id'],
  name: WorkoutTemplate['name']
): WorkoutTemplate | undefined {
  const existingTemplate = getWorkoutTemplateRecordById(db, id);

  if (!existingTemplate) {
    return undefined;
  }

  return db
    .update(workoutTemplates)
    .set({
      name: resolveTemplateName(name),
      updatedAt: Date.now()
    })
    .where(eq(workoutTemplates.id, id))
    .returning()
    .get();
}

export function completeWorkout(db: DrizzleDb, id: Workout['id']): void {
  db.update(workouts)
    .set({
      status: 'completed',
      completedAt: Date.now()
    })
    .where(eq(workouts.id, id))
    .run();
}

export function createWorkoutExercise(
  db: DrizzleDb,
  data: NewWorkoutExercise
): WorkoutExercise {
  return db.insert(workoutExercises).values(data).returning().get();
}

export function deleteWorkoutExercise(
  db: DrizzleDb,
  id: WorkoutExercise['id']
): void {
  db.delete(workoutExercises).where(eq(workoutExercises.id, id)).run();
}

export function deleteWorkoutTemplate(
  db: DrizzleDb,
  id: WorkoutTemplate['id']
): void {
  db.delete(workoutTemplates).where(eq(workoutTemplates.id, id)).run();
}

export function createSet(db: DrizzleDb, data: NewSet): Set {
  return db.insert(sets).values(data).returning().get();
}

export function updateSet(
  db: DrizzleDb,
  id: Set['id'],
  data: Partial<NewSet>
): Set | undefined {
  if (Object.keys(data).length === 0) {
    return getSetRecordById(db, id);
  }

  return db.update(sets).set(data).where(eq(sets.id, id)).returning().get();
}

export function deleteSet(db: DrizzleDb, id: Set['id']): void {
  db.delete(sets).where(eq(sets.id, id)).run();
}

export function createWorkoutTemplateFromWorkout(
  db: DrizzleDb,
  {
    name,
    workoutExerciseRows
  }: {
    name: string;
    workoutExerciseRows: Pick<WorkoutExercise, 'exerciseId' | 'order'>[];
  }
): WorkoutTemplate {
  const now = Date.now();
  let createdTemplate: WorkoutTemplate | undefined;

  // create the template record first, then copy the ordered
  // exercise rows in the same transaction so the saved preset stays consistent.
  db.transaction(tx => {
    createdTemplate = tx
      .insert(workoutTemplates)
      .values({
        name: resolveTemplateName(name),
        createdAt: now,
        updatedAt: now
      })
      .returning()
      .get();

    const createdTemplateRow = createdTemplate;

    if (!createdTemplateRow || workoutExerciseRows.length === 0) {
      return;
    }

    tx.insert(workoutTemplateExercises)
      .values(
        workoutExerciseRows.map(workoutExercise => ({
          templateId: createdTemplateRow.id,
          exerciseId: workoutExercise.exerciseId,
          order: workoutExercise.order
        }))
      )
      .run();
  });

  if (!createdTemplate) {
    throw new Error('Failed to create workout template.');
  }

  return createdTemplate;
}

export function createWorkoutFromTemplate(
  db: DrizzleDb,
  {
    templateId,
    discardWorkoutId
  }: {
    templateId: WorkoutTemplate['id'];
    discardWorkoutId?: Workout['id'];
  }
): Workout | undefined {
  let createdWorkout: Workout | undefined;

  db.transaction(tx => {
    const template = tx
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.id, templateId))
      .get();

    if (!template) {
      return;
    }

    const templateExerciseRows = tx
      .select()
      .from(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.templateId, templateId))
      .orderBy(asc(workoutTemplateExercises.order))
      .all();

    createdWorkout = tx
      .insert(workouts)
      .values({
        name: template.name,
        status: 'in_progress',
        startedAt: Date.now()
      })
      .returning()
      .get();

    const createdWorkoutRow = createdWorkout;

    if (!createdWorkoutRow) {
      return;
    }

    if (templateExerciseRows.length > 0) {
      tx.insert(workoutExercises)
        .values(
          templateExerciseRows.map(templateExercise => ({
            workoutId: createdWorkoutRow.id,
            exerciseId: templateExercise.exerciseId,
            order: templateExercise.order,
            notes: null
          }))
        )
        .run();
    }

    if (discardWorkoutId) {
      tx.delete(workouts).where(eq(workouts.id, discardWorkoutId)).run();
    }
  });

  return createdWorkout;
}
