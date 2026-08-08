import type { DrizzleDb } from '@/src/db/client';
import {
  exercises,
  personalRecords,
  sets,
  workoutExercises,
  workouts,
  type Exercise,
  type NewPersonalRecord,
  type Set,
  type Workout
} from '@/src/db/schema';
import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/sqlite-core';
import {
  computeEstimated1RM,
  getPersonalRecordSnapshot,
  getSetScore,
  resolveTrackingType
} from '@/src/features/progress/tracking.domain';

export function getPersonalRecordsByExerciseQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id']
) {
  return db
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, exerciseId))
    .orderBy(desc(personalRecords.achievedAt));
}

const TWO_MONTHS_MS = 2 * 30 * 24 * 60 * 60 * 1000;

interface ExerciseHistoryQueryRow {
  workout: Workout;
  set: Set | null;
  isVisible: number;
  isProgression: number;
}

interface ExerciseHistoryRows {
  visibleWorkoutRows: { workout: Workout }[];
  progressionWorkoutRows: { workout: Workout }[];
  setRows: { workoutId: Workout['id']; set: Set }[];
}

interface ExerciseHistoryQueryOptions {
  beforeStartedAt?: Workout['startedAt'];
  includeProgression?: boolean;
  includeLimitProbe?: boolean;
}

export function getExerciseHistoryQuery(
  db: DrizzleDb,
  exerciseId: Exercise['id'],
  visibleWorkoutLimit: number,
  options: ExerciseHistoryQueryOptions = {}
) {
  const {
    beforeStartedAt,
    includeProgression = false,
    includeLimitProbe = false
  } = options;
  const visibleWorkoutIds = db.$with('visible_exercise_history_workouts').as(
    db
      .selectDistinct({
        id: workouts.id,
        startedAt: workouts.startedAt
      })
      .from(workouts)
      .innerJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
      .innerJoin(
        sets,
        and(
          eq(sets.workoutExerciseId, workoutExercises.id),
          eq(sets.status, 'completed')
        )
      )
      .where(
        and(
          eq(workouts.status, 'completed'),
          eq(workoutExercises.exerciseId, exerciseId),
          beforeStartedAt !== undefined
            ? sql`${workouts.startedAt} < ${beforeStartedAt}`
            : undefined
        )
      )
      .orderBy(desc(workouts.startedAt), desc(workouts.id))
      .limit(visibleWorkoutLimit + (includeLimitProbe ? 1 : 0))
  );
  const visiblePageWorkoutIds = db
    .$with('visible_exercise_history_page_workouts')
    .as(
      db
        .select({
          id: visibleWorkoutIds.id,
          startedAt: visibleWorkoutIds.startedAt
        })
        .from(visibleWorkoutIds)
        .orderBy(desc(visibleWorkoutIds.startedAt), desc(visibleWorkoutIds.id))
        .limit(visibleWorkoutLimit)
    );
  const latestVisibleStartedAt = db
    .select({ startedAt: visibleWorkoutIds.startedAt })
    .from(visibleWorkoutIds)
    .orderBy(desc(visibleWorkoutIds.startedAt), desc(visibleWorkoutIds.id))
    .limit(1);
  const progressionWorkoutIds = db
    .$with('progression_exercise_history_workouts')
    .as(
      db
        .selectDistinct({
          id: workouts.id,
          startedAt: workouts.startedAt
        })
        .from(workouts)
        .innerJoin(
          workoutExercises,
          eq(workouts.id, workoutExercises.workoutId)
        )
        .innerJoin(
          sets,
          and(
            eq(sets.workoutExerciseId, workoutExercises.id),
            eq(sets.status, 'completed')
          )
        )
        .where(
          and(
            eq(workouts.status, 'completed'),
            eq(workoutExercises.exerciseId, exerciseId),
            includeProgression
              ? sql`${workouts.startedAt} >= (${latestVisibleStartedAt}) - ${TWO_MONTHS_MS}`
              : eq(workouts.id, '')
          )
        )
    );
  const selectedWorkoutIds = db.$with('selected_exercise_history_workouts').as(
    unionAll(
      db
        .select({
          id: visibleWorkoutIds.id,
          isVisible: sql<number>`1`.as('is_visible'),
          isProgression: sql<number>`0`.as('is_progression'),
          loadSets: sql<number>`0`.as('load_sets')
        })
        .from(visibleWorkoutIds),
      db
        .select({
          id: visiblePageWorkoutIds.id,
          isVisible: sql<number>`1`.as('is_visible'),
          isProgression: sql<number>`0`.as('is_progression'),
          loadSets: sql<number>`1`.as('load_sets')
        })
        .from(visiblePageWorkoutIds),
      db
        .select({
          id: progressionWorkoutIds.id,
          isVisible: sql<number>`0`.as('is_visible'),
          isProgression: sql<number>`1`.as('is_progression'),
          loadSets: sql<number>`1`.as('load_sets')
        })
        .from(progressionWorkoutIds)
    )
  );
  const uniqueSelectedWorkoutIds = db
    .$with('unique_selected_exercise_history_workouts')
    .as(
      db
        .select({
          id: selectedWorkoutIds.id,
          isVisible: sql<number>`max(${selectedWorkoutIds.isVisible})`.as(
            'is_visible'
          ),
          isProgression:
            sql<number>`max(${selectedWorkoutIds.isProgression})`.as(
              'is_progression'
            ),
          loadSets: sql<number>`max(${selectedWorkoutIds.loadSets})`.as(
            'load_sets'
          )
        })
        .from(selectedWorkoutIds)
        .groupBy(selectedWorkoutIds.id)
    );

  return db
    .with(
      visibleWorkoutIds,
      visiblePageWorkoutIds,
      progressionWorkoutIds,
      selectedWorkoutIds,
      uniqueSelectedWorkoutIds
    )
    .select({
      workout: workouts,
      set: sets,
      isVisible: uniqueSelectedWorkoutIds.isVisible,
      isProgression: uniqueSelectedWorkoutIds.isProgression
    })
    .from(uniqueSelectedWorkoutIds)
    .innerJoin(workouts, eq(workouts.id, uniqueSelectedWorkoutIds.id))
    .leftJoin(
      workoutExercises,
      and(
        eq(workoutExercises.workoutId, workouts.id),
        eq(workoutExercises.exerciseId, exerciseId)
      )
    )
    .leftJoin(
      sets,
      and(
        eq(sets.workoutExerciseId, workoutExercises.id),
        eq(sets.status, 'completed'),
        eq(uniqueSelectedWorkoutIds.loadSets, 1)
      )
    )
    .orderBy(
      desc(workouts.startedAt),
      desc(workouts.id),
      asc(workoutExercises.order),
      asc(sets.order)
    );
}

export function mapExerciseHistoryRows(
  rows: ExerciseHistoryQueryRow[]
): ExerciseHistoryRows {
  const visibleWorkoutRows: { workout: Workout }[] = [];
  const progressionWorkoutRows: { workout: Workout }[] = [];
  const setRows: { workoutId: Workout['id']; set: Set }[] = [];
  const visibleWorkoutIds = new Set<Workout['id']>();
  const progressionWorkoutIds = new Set<Workout['id']>();

  for (const row of rows) {
    if (row.isVisible && !visibleWorkoutIds.has(row.workout.id)) {
      visibleWorkoutIds.add(row.workout.id);
      visibleWorkoutRows.push({ workout: row.workout });
    }

    if (row.isProgression && !progressionWorkoutIds.has(row.workout.id)) {
      progressionWorkoutIds.add(row.workout.id);
      progressionWorkoutRows.push({ workout: row.workout });
    }

    if (row.set) {
      setRows.push({ workoutId: row.workout.id, set: row.set });
    }
  }

  return { visibleWorkoutRows, progressionWorkoutRows, setRows };
}

export function buildExerciseHistory(
  workoutRows: { workout: Workout }[],
  setRows: { workoutId: Workout['id']; set: Set }[]
): { workout: Workout; sets: Set[] }[] {
  const seenWorkoutIds = new Set<Workout['id']>();
  const workoutHistory: Workout[] = [];

  for (const row of workoutRows) {
    if (seenWorkoutIds.has(row.workout.id)) {
      continue;
    }

    seenWorkoutIds.add(row.workout.id);
    workoutHistory.push(row.workout);
  }

  if (workoutHistory.length === 0) {
    return [];
  }

  const limitedWorkoutIds = new Set(workoutHistory.map(workout => workout.id));
  const setsByWorkoutId = new Map<Workout['id'], Set[]>();

  for (const row of setRows) {
    if (!limitedWorkoutIds.has(row.workoutId)) {
      continue;
    }

    const existingSets = setsByWorkoutId.get(row.workoutId);

    if (existingSets) {
      existingSets.push(row.set);
      continue;
    }

    setsByWorkoutId.set(row.workoutId, [row.set]);
  }

  return workoutHistory.map(workout => {
    const setsForWorkout = setsByWorkoutId.get(workout.id) ?? [];

    return {
      workout,
      sets: setsForWorkout
    };
  });
}

function getCompletedSetsForPersonalRecords(
  db: DrizzleDb,
  exerciseIds: Exercise['id'][]
) {
  const achievedAt =
    sql<number>`coalesce(${sets.completedAt}, ${workouts.startedAt})`.as(
      'achieved_at'
    );

  return db
    .select({
      exerciseId: sql<Exercise['id']>`${exercises.id}`.as('exercise_id'),
      trackingType: sql<string>`${exercises.trackingType}`.as('tracking_type'),
      set: sets,
      achievedAt
    })
    .from(exercises)
    .leftJoin(workoutExercises, eq(exercises.id, workoutExercises.exerciseId))
    .leftJoin(
      workouts,
      and(
        eq(workoutExercises.workoutId, workouts.id),
        inArray(workouts.status, ['completed', 'in_progress'])
      )
    )
    .leftJoin(
      sets,
      and(
        eq(sets.workoutExerciseId, workoutExercises.id),
        eq(sets.status, 'completed'),
        isNotNull(workouts.id)
      )
    )
    .where(inArray(exercises.id, exerciseIds))
    .orderBy(
      asc(exercises.id),
      asc(achievedAt),
      asc(sets.order),
      asc(workouts.id),
      asc(workoutExercises.order),
      asc(sets.id)
    )
    .all();
}

export function rebuildPersonalRecordsForExercise(
  db: DrizzleDb,
  exerciseId: Exercise['id']
): void {
  rebuildPersonalRecordsForExercises(db, [exerciseId]);
}

export function rebuildPersonalRecordsForExercises(
  db: DrizzleDb,
  exerciseIds: Exercise['id'][]
): void {
  const uniqueExerciseIds = Array.from(new Set(exerciseIds));

  if (uniqueExerciseIds.length === 0) {
    return;
  }

  db.transaction(tx => {
    rebuildPersonalRecordsForExercisesInTransaction(tx, uniqueExerciseIds);
  });
}

export function rebuildPersonalRecordsForExerciseInTransaction(
  db: DrizzleDb,
  exerciseId: Exercise['id']
): void {
  rebuildPersonalRecordsForExercisesInTransaction(db, [exerciseId]);
}

export function rebuildPersonalRecordsForExercisesInTransaction(
  db: DrizzleDb,
  exerciseIds: Exercise['id'][]
): void {
  const uniqueExerciseIds = Array.from(new Set(exerciseIds));

  if (uniqueExerciseIds.length === 0) {
    return;
  }

  const completedSetRows = getCompletedSetsForPersonalRecords(
    db,
    uniqueExerciseIds
  );
  const bestScoreByExerciseId = new Map<Exercise['id'], number>();
  const newRecords: NewPersonalRecord[] = [];

  for (const row of completedSetRows) {
    if (!row.set || row.achievedAt === null) {
      continue;
    }

    const trackingType = resolveTrackingType(row.trackingType);
    const score = getSetScore(trackingType, row.set);
    const bestScore = bestScoreByExerciseId.get(row.exerciseId) ?? 0;

    if (score === null || score <= bestScore) {
      continue;
    }

    bestScoreByExerciseId.set(row.exerciseId, score);
    newRecords.push({
      exerciseId: row.exerciseId,
      setId: row.set.id,
      achievedAt: row.achievedAt,
      ...getPersonalRecordSnapshot(trackingType, row.set, score)
    });
  }

  db.delete(personalRecords)
    .where(inArray(personalRecords.exerciseId, uniqueExerciseIds))
    .run();

  if (newRecords.length > 0) {
    db.insert(personalRecords).values(newRecords).run();
  }
}

export { computeEstimated1RM };
