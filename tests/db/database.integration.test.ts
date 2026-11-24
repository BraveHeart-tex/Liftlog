import {
  exercises,
  personalRecords,
  sets,
  workoutExercises,
  workouts
} from '@/src/db/schema';
import {
  createDrizzleDb,
  runDatabaseMigrations,
  type DrizzleDb
} from '@/src/db/client';
import { completeWorkout } from '@/src/features/workouts/active/active.repository';
import {
  createCompletedSet,
  deleteCompletedSet,
  updateCompletedSet
} from '@/src/features/workouts/set-entry/set-entry.repository';
import {
  createHistoricalWorkoutEditDraft,
  HistoricalWorkoutEditDraftConflictError,
  saveHistoricalWorkoutDraft,
  saveHistoricalWorkoutEditDraft
} from '@/src/features/workouts/history/history.repository';
import { getRecentExerciseIdsQuery } from '@/src/features/workouts/exercise-selection/exercise-selection.repository';
import {
  getExerciseHistoryQuery,
  mapExerciseHistoryRows,
  rebuildPersonalRecordsForExercises
} from '@/src/features/progress/progress.repository';
import { eq, inArray } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { SQLiteDatabase } from 'expo-sqlite';
import assert from 'node:assert/strict';
import type { SQLInputValue } from 'node:sqlite';
import test from 'node:test';
import {
  createMigratedTestDatabase,
  createTestDatabase,
  loadMigrations,
  rejectPersonalRecordRebuilds
} from '@/tests/support/db';
import {
  createTrackedSet,
  seedTrackedExercise
} from '@/tests/support/factories';

function getPersonalRecordSetIds(db: DrizzleDb) {
  return db
    .select({ setId: personalRecords.setId })
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, 'exercise-1'))
    .orderBy(personalRecords.achievedAt)
    .all()
    .map(record => record.setId);
}

function seedHistoricalExercises(db: DrizzleDb) {
  db.insert(exercises)
    .values([
      {
        id: 'exercise-a',
        name: 'Exercise A',
        normalizedName: 'exercise a',
        equipment: 'other',
        trackingType: 'reps'
      },
      {
        id: 'exercise-b',
        name: 'Exercise B',
        normalizedName: 'exercise b',
        equipment: 'other',
        trackingType: 'reps'
      }
    ])
    .run();
}

function insertHistoricalWorkout(
  db: DrizzleDb,
  {
    id,
    status,
    reps,
    sourceWorkoutId
  }: {
    id: string;
    status: string;
    reps: [number, number];
    sourceWorkoutId?: string;
  }
) {
  db.insert(workouts)
    .values({
      id,
      name: id,
      status,
      startedAt: 1_000,
      dateKey: '1970-01-01',
      sourceWorkoutId
    })
    .run();
  db.insert(workoutExercises)
    .values([
      {
        id: `${id}-exercise-a`,
        workoutId: id,
        exerciseId: 'exercise-a',
        order: 0
      },
      {
        id: `${id}-exercise-b`,
        workoutId: id,
        exerciseId: 'exercise-b',
        order: 1
      }
    ])
    .run();
  db.insert(sets)
    .values([
      {
        id: `${id}-set-a`,
        workoutExerciseId: `${id}-exercise-a`,
        order: 0,
        reps: reps[0],
        status: 'completed',
        completedAt: 2_000
      },
      {
        id: `${id}-set-b`,
        workoutExerciseId: `${id}-exercise-b`,
        order: 0,
        reps: reps[1],
        status: 'completed',
        completedAt: 3_000
      }
    ])
    .run();
}

function getHistoricalPersonalRecordRows(db: DrizzleDb) {
  return db
    .select({
      exerciseId: personalRecords.exerciseId,
      setId: personalRecords.setId,
      reps: personalRecords.reps,
      score: personalRecords.score
    })
    .from(personalRecords)
    .orderBy(personalRecords.exerciseId, personalRecords.achievedAt)
    .all();
}

test('completeWorkout conditionally completes in-progress workouts', async t => {
  const nodeClient = createTestDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations())
    );

    await t.test('completes an in-progress workout', () => {
      const completedAt = 2_000;

      db.insert(workouts)
        .values({
          id: 'in-progress-workout',
          name: 'In Progress',
          status: 'in_progress',
          startedAt: 1_000,
          dateKey: '1970-01-01'
        })
        .run();
      t.mock.method(Date, 'now', () => completedAt);

      completeWorkout(db, 'in-progress-workout');

      const completedWorkout = db
        .select()
        .from(workouts)
        .where(eq(workouts.id, 'in-progress-workout'))
        .get();

      assert.equal(completedWorkout?.status, 'completed');
      assert.equal(completedWorkout?.completedAt, completedAt);
    });

    await t.test('does nothing for a missing workout', () => {
      assert.doesNotThrow(() => completeWorkout(db, 'missing-workout'));
      assert.equal(
        db
          .select()
          .from(workouts)
          .where(eq(workouts.id, 'missing-workout'))
          .get(),
        undefined
      );
    });

    await t.test('does nothing for an already completed workout', () => {
      const existingWorkout = db
        .insert(workouts)
        .values({
          id: 'completed-workout',
          name: 'Completed',
          status: 'completed',
          startedAt: 3_000,
          dateKey: '1970-01-01',
          completedAt: 4_000,
          notes: 'Keep me'
        })
        .returning()
        .get();
      t.mock.method(Date, 'now', () => 5_000);

      completeWorkout(db, 'completed-workout');

      assert.deepEqual(
        db
          .select()
          .from(workouts)
          .where(eq(workouts.id, 'completed-workout'))
          .get(),
        existingWorkout
      );
    });

    await t.test('retains the persisted date key', () => {
      const persistedDateKey = '2025-12-31';

      db.insert(workouts)
        .values({
          id: 'timezone-workout',
          name: 'Timezone Change',
          status: 'in_progress',
          startedAt: Date.UTC(2026, 0, 1, 1),
          dateKey: persistedDateKey
        })
        .run();

      completeWorkout(db, 'timezone-workout');

      assert.equal(
        db
          .select({ dateKey: workouts.dateKey })
          .from(workouts)
          .where(eq(workouts.id, 'timezone-workout'))
          .get()?.dateKey,
        persistedDateKey
      );
    });
  } finally {
    nodeClient.closeSync();
  }
});

test('recent exercises are deduplicated before the limit', async () => {
  const nodeClient = createTestDatabase();
  const sqliteClient = nodeClient as unknown as SQLiteDatabase;
  const db = createDrizzleDb(sqliteClient);

  try {
    await runDatabaseMigrations(sqliteClient, () =>
      migrate(db, loadMigrations())
    );

    db.insert(exercises)
      .values([
        {
          id: 'exercise-a',
          name: 'A',
          normalizedName: 'a',
          equipment: 'other'
        },
        {
          id: 'exercise-b',
          name: 'B',
          normalizedName: 'b',
          equipment: 'other'
        },
        {
          id: 'exercise-c',
          name: 'C',
          normalizedName: 'c',
          equipment: 'other'
        },
        {
          id: 'exercise-d',
          name: 'D',
          normalizedName: 'd',
          equipment: 'other'
        },
        {
          id: 'exercise-archived',
          name: 'Archived',
          normalizedName: 'archived',
          equipment: 'other'
        },
        {
          id: 'exercise-in-progress',
          name: 'In Progress',
          normalizedName: 'in progress',
          equipment: 'other'
        }
      ])
      .run();
    db.update(exercises)
      .set({ isArchived: 1 })
      .where(eq(exercises.id, 'exercise-archived'))
      .run();
    db.insert(workouts)
      .values([
        {
          id: 'workout-in-progress',
          name: 'In Progress',
          status: 'in_progress',
          startedAt: 700,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-latest',
          name: 'Latest',
          status: 'completed',
          startedAt: 500,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-repeat',
          name: 'Repeat',
          status: 'completed',
          startedAt: 400,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-tie-c',
          name: 'Tie C',
          status: 'completed',
          startedAt: 300,
          dateKey: '1970-01-01'
        },
        {
          id: 'workout-tie-d',
          name: 'Tie D',
          status: 'completed',
          startedAt: 300,
          dateKey: '1970-01-01'
        }
      ])
      .run();
    db.insert(workoutExercises)
      .values([
        {
          id: 'usage-in-progress',
          workoutId: 'workout-in-progress',
          exerciseId: 'exercise-in-progress',
          order: 0
        },
        {
          id: 'usage-latest-archived',
          workoutId: 'workout-latest',
          exerciseId: 'exercise-archived',
          order: 0
        },
        {
          id: 'usage-latest-b',
          workoutId: 'workout-latest',
          exerciseId: 'exercise-b',
          order: 1
        },
        {
          id: 'usage-latest-a',
          workoutId: 'workout-latest',
          exerciseId: 'exercise-a',
          order: 2
        },
        {
          id: 'usage-repeat-a',
          workoutId: 'workout-repeat',
          exerciseId: 'exercise-a',
          order: 0
        },
        {
          id: 'usage-repeat-b',
          workoutId: 'workout-repeat',
          exerciseId: 'exercise-b',
          order: 1
        },
        {
          id: 'usage-tie-c',
          workoutId: 'workout-tie-c',
          exerciseId: 'exercise-c',
          order: 0
        },
        {
          id: 'usage-tie-d',
          workoutId: 'workout-tie-d',
          exerciseId: 'exercise-d',
          order: 0
        }
      ])
      .run();

    const recentExercisesQuery = getRecentExerciseIdsQuery(db, [], 4);
    const recentExerciseIds = recentExercisesQuery
      .all()
      .map(row => row.exerciseId);

    assert.deepEqual(
      (
        recentExercisesQuery as unknown as {
          getUsedTables: () => string[];
        }
      )
        .getUsedTables()
        .sort(),
      ['exercises', 'workout_exercises', 'workouts']
    );
    assert.equal(recentExerciseIds.length, 4);
    assert.equal(new Set(recentExerciseIds).size, 4);
    assert.deepEqual(recentExerciseIds, [
      'exercise-b',
      'exercise-a',
      'exercise-c',
      'exercise-d'
    ]);

    assert.deepEqual(
      getRecentExerciseIdsQuery(db, ['exercise-b'], 3)
        .all()
        .map(row => row.exerciseId),
      ['exercise-a', 'exercise-c', 'exercise-d']
    );
  } finally {
    nodeClient.closeSync();
  }
});

test('exercise history selects workouts and sets by completed sets', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  try {
    db.insert(exercises)
      .values({
        id: 'exercise-history',
        name: 'History exercise',
        normalizedName: 'history exercise',
        equipment: 'other'
      })
      .run();
    db.insert(workouts)
      .values([
        {
          id: 'pending-only',
          name: 'Pending only',
          status: 'completed',
          startedAt: 500,
          dateKey: '1970-01-01'
        },
        {
          id: 'mixed',
          name: 'Mixed',
          status: 'completed',
          startedAt: 400,
          dateKey: '1970-01-01'
        },
        {
          id: 'completed',
          name: 'Completed',
          status: 'completed',
          startedAt: 300,
          dateKey: '1970-01-01'
        },
        {
          id: 'probe',
          name: 'Probe',
          status: 'completed',
          startedAt: 200,
          dateKey: '1970-01-01'
        }
      ])
      .run();
    db.insert(workoutExercises)
      .values(
        ['pending-only', 'mixed', 'completed', 'probe'].map(workoutId => ({
          id: `${workoutId}-exercise`,
          workoutId,
          exerciseId: 'exercise-history',
          order: 0
        }))
      )
      .run();
    db.insert(sets)
      .values([
        {
          id: 'pending-only-set',
          workoutExerciseId: 'pending-only-exercise',
          order: 0,
          status: 'pending'
        },
        {
          id: 'mixed-pending',
          workoutExerciseId: 'mixed-exercise',
          order: 0,
          status: 'pending'
        },
        {
          id: 'mixed-completed-1',
          workoutExerciseId: 'mixed-exercise',
          order: 1,
          status: 'completed'
        },
        {
          id: 'mixed-completed-2',
          workoutExerciseId: 'mixed-exercise',
          order: 2,
          status: 'completed'
        },
        {
          id: 'completed-set-1',
          workoutExerciseId: 'completed-exercise',
          order: 0,
          status: 'completed'
        },
        {
          id: 'completed-set-2',
          workoutExerciseId: 'completed-exercise',
          order: 1,
          status: 'completed'
        },
        {
          id: 'probe-set',
          workoutExerciseId: 'probe-exercise',
          order: 0,
          status: 'completed'
        }
      ])
      .run();

    const query = getExerciseHistoryQuery(db, 'exercise-history', 2, {
      includeLimitProbe: true,
      includeProgression: true
    });
    // Node SQLite object rows collapse duplicate join column names.
    nodeClient.execSync(`
      PRAGMA short_column_names = OFF;
      PRAGMA full_column_names = ON;
    `);
    const mapped = mapExerciseHistoryRows(query.all());
    nodeClient.execSync(`
      PRAGMA full_column_names = OFF;
      PRAGMA short_column_names = ON;
    `);

    assert.deepEqual(
      mapped.visibleWorkoutRows.map(row => row.workout.id),
      ['mixed', 'completed', 'probe']
    );
    assert.deepEqual(
      mapped.progressionWorkoutRows.map(row => row.workout.id),
      ['mixed', 'completed', 'probe']
    );
    assert.deepEqual(
      mapped.setRows.map(row => [row.workoutId, row.set.id]),
      [
        ['mixed', 'mixed-completed-1'],
        ['mixed', 'mixed-completed-2'],
        ['completed', 'completed-set-1'],
        ['completed', 'completed-set-2'],
        ['probe', 'probe-set']
      ]
    );
    assert.ok(mapped.setRows.every(row => row.set.status === 'completed'));

    const generatedQuery = query.toSQL();
    const queryPlan = nodeClient.getAllSync<{ detail: string }>(
      `EXPLAIN QUERY PLAN ${generatedQuery.sql}`,
      generatedQuery.params as SQLInputValue[]
    );
    const queryPlanDetails = queryPlan.map(row => row.detail).join('\n');

    assert.match(
      queryPlanDetails,
      /workout_exercises_exercise_id_workout_id_idx/
    );
    assert.match(queryPlanDetails, /sets_workout_exercise_id_status_order_idx/);
  } finally {
    nodeClient.closeSync();
  }
});

test('completed set commands maintain personal records atomically', async t => {
  await t.test('creates a new personal record', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);

      const result = createTrackedSet(db, 'record-set', 12, 1);

      assert.equal(result.set.id, 'record-set');
      assert.equal(result.isNewPersonalRecord, true);
      assert.deepEqual(getPersonalRecordSetIds(db), [
        'baseline-set',
        'record-set'
      ]);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test('creates a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      rejectPersonalRecordRebuilds(nodeClient);

      const result = createTrackedSet(db, 'non-record-set', 8, 1);

      assert.equal(result.set.id, 'non-record-set');
      assert.equal(result.isNewPersonalRecord, false);
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test(
    'does not report a zero score as a personal record',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        db.update(exercises)
          .set({ trackingType: 'weight_reps' })
          .where(eq(exercises.id, 'exercise-1'))
          .run();

        const result = createCompletedSet(db, {
          id: 'zero-score-set',
          workoutExerciseId: 'workout-exercise-1',
          order: 0,
          weightKg: 0,
          reps: 10,
          completedAt: 1
        });

        assert.equal(result.isNewPersonalRecord, false);
        assert.deepEqual(getPersonalRecordSetIds(db), []);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test(
    'rebuilds after editing the current record downward',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        createTrackedSet(db, 'baseline-set', 10, 0);
        createTrackedSet(db, 'record-set', 12, 1);

        const result = updateCompletedSet(db, 'record-set', { reps: 8 });

        assert.equal(result?.set.reps, 8);
        assert.equal(result?.isNewPersonalRecord, false);
        assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test('edits a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      createTrackedSet(db, 'non-record-set', 8, 1);
      rejectPersonalRecordRebuilds(nodeClient);

      const result = updateCompletedSet(db, 'non-record-set', { reps: 9 });

      assert.equal(result?.set.reps, 9);
      assert.equal(result?.isNewPersonalRecord, false);
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test(
    'rebuilds when editing a non-record into the historical record chain',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        createTrackedSet(db, 'baseline-set', 10, 0);
        createTrackedSet(db, 'latest-record-set', 20, 2);
        createTrackedSet(db, 'historical-non-record-set', 8, 1);

        const result = updateCompletedSet(db, 'historical-non-record-set', {
          reps: 15
        });

        assert.equal(result?.isNewPersonalRecord, false);
        assert.deepEqual(getPersonalRecordSetIds(db), [
          'baseline-set',
          'historical-non-record-set',
          'latest-record-set'
        ]);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test('rebuilds after deleting the current record', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      createTrackedSet(db, 'record-set', 12, 1);

      const deletedSet = deleteCompletedSet(db, 'record-set');

      assert.equal(deletedSet?.id, 'record-set');
      assert.equal(
        db.select().from(sets).where(eq(sets.id, 'record-set')).get(),
        undefined
      );
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test('deletes a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      createTrackedSet(db, 'non-record-set', 8, 1);
      rejectPersonalRecordRebuilds(nodeClient);

      const deletedSet = deleteCompletedSet(db, 'non-record-set');

      assert.equal(deletedSet?.id, 'non-record-set');
      assert.equal(
        db.select().from(sets).where(eq(sets.id, 'non-record-set')).get(),
        undefined
      );
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test(
    'rolls back the set mutation when rebuilding fails',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedTrackedExercise(db);
        createTrackedSet(db, 'baseline-set', 10, 0);
        rejectPersonalRecordRebuilds(nodeClient);

        assert.throws(() => createTrackedSet(db, 'record-set', 12, 1));
        assert.equal(
          db.select().from(sets).where(eq(sets.id, 'record-set')).get(),
          undefined
        );
        assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
      } finally {
        nodeClient.closeSync();
      }
    }
  );
});

test('historical saves rebuild records for all affected exercises', async t => {
  await t.test(
    'saves a historical draft with and without new records',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedHistoricalExercises(db);
        insertHistoricalWorkout(db, {
          id: 'historical-draft',
          status: 'historical_draft',
          reps: [10, 0]
        });
        db.insert(personalRecords)
          .values([
            {
              id: 'stale-record-a',
              exerciseId: 'exercise-a',
              setId: 'historical-draft-set-a',
              trackingType: 'reps',
              score: 999,
              reps: 999,
              estimated1rm: 0,
              achievedAt: 1
            },
            {
              id: 'stale-record-b',
              exerciseId: 'exercise-b',
              setId: 'historical-draft-set-b',
              trackingType: 'reps',
              score: 999,
              reps: 999,
              estimated1rm: 0,
              achievedAt: 1
            }
          ])
          .run();

        const result = saveHistoricalWorkoutDraft(db, 'historical-draft');

        assert.equal(result?.workout.id, 'historical-draft');
        assert.equal(result?.workout.status, 'completed');
        assert.deepEqual(result?.affectedExerciseIds, [
          'exercise-a',
          'exercise-b'
        ]);
        assert.deepEqual(getHistoricalPersonalRecordRows(db), [
          {
            exerciseId: 'exercise-a',
            setId: 'historical-draft-set-a',
            reps: 10,
            score: 10
          }
        ]);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test(
    'saves a historical edit with and without replacement records',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedHistoricalExercises(db);
        insertHistoricalWorkout(db, {
          id: 'source-workout',
          status: 'completed',
          reps: [5, 5]
        });
        const draft = createHistoricalWorkoutEditDraft(db, 'source-workout')!;
        const draftExercises = db
          .select()
          .from(workoutExercises)
          .where(eq(workoutExercises.workoutId, draft.id))
          .all();
        const draftExerciseA = draftExercises.find(
          row => row.exerciseId === 'exercise-a'
        )!;
        const draftExerciseB = draftExercises.find(
          row => row.exerciseId === 'exercise-b'
        )!;

        db.update(sets)
          .set({ reps: 10 })
          .where(eq(sets.workoutExerciseId, draftExerciseA.id))
          .run();
        db.update(sets)
          .set({ reps: 0 })
          .where(eq(sets.workoutExerciseId, draftExerciseB.id))
          .run();
        rebuildPersonalRecordsForExercises(db, [
          'exercise-a',
          'exercise-b',
          'exercise-a'
        ]);

        const result = saveHistoricalWorkoutEditDraft(db, {
          sourceWorkoutId: 'source-workout',
          draftWorkoutId: draft.id
        });

        assert.equal(result?.workout.id, 'source-workout');
        assert.deepEqual(result?.affectedExerciseIds, [
          'exercise-a',
          'exercise-b'
        ]);
        assert.deepEqual(
          getHistoricalPersonalRecordRows(db).map(record => ({
            exerciseId: record.exerciseId,
            reps: record.reps,
            score: record.score
          })),
          [{ exerciseId: 'exercise-a', reps: 10, score: 10 }]
        );
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test('renames without replacing source graph IDs', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedHistoricalExercises(db);
      insertHistoricalWorkout(db, {
        id: 'source-workout',
        status: 'completed',
        reps: [5, 5]
      });
      const draft = createHistoricalWorkoutEditDraft(db, 'source-workout')!;
      const sourceExerciseIds = db
        .select({ id: workoutExercises.id })
        .from(workoutExercises)
        .where(eq(workoutExercises.workoutId, 'source-workout'))
        .all();
      const sourceSetIds = db
        .select({ id: sets.id })
        .from(sets)
        .all()
        .filter(row => row.id.startsWith('source-workout'));

      db.update(workouts)
        .set({ name: 'Renamed workout' })
        .where(eq(workouts.id, draft.id))
        .run();

      const result = saveHistoricalWorkoutEditDraft(db, {
        sourceWorkoutId: 'source-workout',
        draftWorkoutId: draft.id
      });

      assert.equal(result?.workout.name, 'Renamed workout');
      assert.deepEqual(result?.affectedExerciseIds, []);
      assert.deepEqual(
        db
          .select({ id: workoutExercises.id })
          .from(workoutExercises)
          .where(eq(workoutExercises.workoutId, 'source-workout'))
          .all(),
        sourceExerciseIds
      );
      assert.deepEqual(
        db
          .select({ id: sets.id })
          .from(sets)
          .all()
          .filter(row => row.id.startsWith('source-workout')),
        sourceSetIds
      );
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test('reorders exercises without rebuilding records', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedHistoricalExercises(db);
      insertHistoricalWorkout(db, {
        id: 'source-workout',
        status: 'completed',
        reps: [5, 5]
      });
      const draft = createHistoricalWorkoutEditDraft(db, 'source-workout')!;
      const draftRows = db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.workoutId, draft.id))
        .all();

      for (const row of draftRows) {
        db.update(workoutExercises)
          .set({ order: row.order === 0 ? 1 : 0 })
          .where(eq(workoutExercises.id, row.id))
          .run();
      }

      const result = saveHistoricalWorkoutEditDraft(db, {
        sourceWorkoutId: 'source-workout',
        draftWorkoutId: draft.id
      });

      assert.deepEqual(result?.affectedExerciseIds, []);
      assert.deepEqual(
        db
          .select({ id: workoutExercises.id, order: workoutExercises.order })
          .from(workoutExercises)
          .where(eq(workoutExercises.workoutId, 'source-workout'))
          .all()
          .sort((left, right) => left.order - right.order),
        [
          { id: 'source-workout-exercise-b', order: 0 },
          { id: 'source-workout-exercise-a', order: 1 }
        ]
      );
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test('adds and removes exercises in batches', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedHistoricalExercises(db);
      db.insert(exercises)
        .values({
          id: 'exercise-c',
          name: 'Exercise C',
          normalizedName: 'exercise c',
          equipment: 'other',
          trackingType: 'reps'
        })
        .run();
      insertHistoricalWorkout(db, {
        id: 'source-workout',
        status: 'completed',
        reps: [5, 5]
      });
      const draft = createHistoricalWorkoutEditDraft(db, 'source-workout')!;
      const draftExerciseB = db
        .select()
        .from(workoutExercises)
        .where(
          eq(
            workoutExercises.sourceWorkoutExerciseId,
            'source-workout-exercise-b'
          )
        )
        .get()!;

      db.delete(workoutExercises)
        .where(eq(workoutExercises.id, draftExerciseB.id))
        .run();
      db.insert(workoutExercises)
        .values({
          id: 'draft-exercise-c',
          workoutId: draft.id,
          exerciseId: 'exercise-c',
          order: 1
        })
        .run();
      db.insert(sets)
        .values({
          id: 'draft-set-c',
          workoutExerciseId: 'draft-exercise-c',
          order: 0,
          reps: 7,
          status: 'completed',
          completedAt: 4_000
        })
        .run();

      const result = saveHistoricalWorkoutEditDraft(db, {
        sourceWorkoutId: 'source-workout',
        draftWorkoutId: draft.id
      });
      const sourceRows = db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.workoutId, 'source-workout'))
        .all();

      assert.deepEqual(
        new Set(result?.affectedExerciseIds),
        new Set(['exercise-b', 'exercise-c'])
      );
      assert.ok(sourceRows.some(row => row.id === 'source-workout-exercise-a'));
      assert.ok(
        !sourceRows.some(row => row.id === 'source-workout-exercise-b')
      );
      assert.ok(
        sourceRows.some(
          row =>
            row.exerciseId === 'exercise-c' && row.id !== 'draft-exercise-c'
        )
      );
    } finally {
      nodeClient.closeSync();
    }
  });

  await t.test(
    'chunks every historical edit mutation at the batch boundary',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();
      const rowCount = 101;

      try {
        const exerciseRows = Array.from({ length: rowCount }, (_, index) => [
          {
            id: `remove-exercise-${index}`,
            name: `Remove Exercise ${index}`,
            normalizedName: `remove exercise ${index}`,
            equipment: 'other',
            trackingType: 'reps'
          },
          {
            id: `update-exercise-${index}`,
            name: `Update Exercise ${index}`,
            normalizedName: `update exercise ${index}`,
            equipment: 'other',
            trackingType: 'reps'
          },
          {
            id: `add-exercise-${index}`,
            name: `Add Exercise ${index}`,
            normalizedName: `add exercise ${index}`,
            equipment: 'other',
            trackingType: 'reps'
          }
        ]).flat();

        for (let index = 0; index < exerciseRows.length; index += 100) {
          db.insert(exercises)
            .values(exerciseRows.slice(index, index + 100))
            .run();
        }

        db.insert(workouts)
          .values({
            id: 'source-workout',
            name: 'Batch workout',
            status: 'completed',
            startedAt: 1_000,
            dateKey: '1970-01-01'
          })
          .run();

        const sourceExerciseRows = Array.from(
          { length: rowCount },
          (_, index) => [
            {
              id: `source-remove-${index}`,
              workoutId: 'source-workout',
              exerciseId: `remove-exercise-${index}`,
              order: index
            },
            {
              id: `source-update-${index}`,
              workoutId: 'source-workout',
              exerciseId: `update-exercise-${index}`,
              order: rowCount + index
            }
          ]
        ).flat();

        for (let index = 0; index < sourceExerciseRows.length; index += 100) {
          db.insert(workoutExercises)
            .values(sourceExerciseRows.slice(index, index + 100))
            .run();
        }

        const sourceSetRows = Array.from({ length: rowCount }, (_, index) => [
          {
            id: `source-remove-set-${index}`,
            workoutExerciseId: `source-remove-${index}`,
            order: 0,
            reps: 1,
            status: 'completed',
            completedAt: 2_000 + index
          },
          {
            id: `source-update-set-${index}`,
            workoutExerciseId: `source-update-${index}`,
            order: 0,
            reps: 1,
            status: 'completed',
            completedAt: 3_000 + index
          },
          {
            id: `source-delete-set-${index}`,
            workoutExerciseId: `source-update-${index}`,
            order: 1,
            reps: 1,
            status: 'completed',
            completedAt: 4_000 + index
          }
        ]).flat();

        for (let index = 0; index < sourceSetRows.length; index += 100) {
          db.insert(sets)
            .values(sourceSetRows.slice(index, index + 100))
            .run();
        }

        const draft = createHistoricalWorkoutEditDraft(db, 'source-workout')!;
        const draftExerciseRows = db
          .select()
          .from(workoutExercises)
          .where(eq(workoutExercises.workoutId, draft.id))
          .all();
        const draftExerciseBySourceId = new Map(
          draftExerciseRows.map(row => [row.sourceWorkoutExerciseId, row])
        );
        const removedDraftExerciseIds = Array.from(
          { length: rowCount },
          (_, index) =>
            draftExerciseBySourceId.get(`source-remove-${index}`)!.id
        );
        const updatedDraftExerciseIds = Array.from(
          { length: rowCount },
          (_, index) =>
            draftExerciseBySourceId.get(`source-update-${index}`)!.id
        );

        db.delete(workoutExercises)
          .where(inArray(workoutExercises.id, removedDraftExerciseIds))
          .run();
        db.update(workoutExercises)
          .set({ notes: 'Updated in draft' })
          .where(inArray(workoutExercises.id, updatedDraftExerciseIds))
          .run();

        const draftSetRows = db
          .select()
          .from(sets)
          .where(inArray(sets.workoutExerciseId, updatedDraftExerciseIds))
          .all();
        const draftSetBySourceId = new Map(
          draftSetRows.map(row => [row.sourceSetId, row])
        );
        const updatedDraftSetIds = Array.from(
          { length: rowCount },
          (_, index) => draftSetBySourceId.get(`source-update-set-${index}`)!.id
        );
        const removedDraftSetIds = Array.from(
          { length: rowCount },
          (_, index) => draftSetBySourceId.get(`source-delete-set-${index}`)!.id
        );

        db.update(sets)
          .set({ reps: 2 })
          .where(inArray(sets.id, updatedDraftSetIds))
          .run();
        db.delete(sets).where(inArray(sets.id, removedDraftSetIds)).run();

        db.insert(workoutExercises)
          .values(
            Array.from({ length: rowCount }, (_, index) => ({
              id: `draft-add-${index}`,
              workoutId: draft.id,
              exerciseId: `add-exercise-${index}`,
              order: rowCount + index
            }))
          )
          .run();
        db.insert(sets)
          .values(
            Array.from({ length: rowCount }, (_, index) => ({
              id: `draft-add-set-${index}`,
              workoutExerciseId: `draft-add-${index}`,
              order: 0,
              reps: 3,
              status: 'completed',
              completedAt: 5_000 + index
            }))
          )
          .run();

        nodeClient.startRecordingPreparedStatements();
        const result = saveHistoricalWorkoutEditDraft(db, {
          sourceWorkoutId: 'source-workout',
          draftWorkoutId: draft.id
        });
        const statements = nodeClient.stopRecordingPreparedStatements();
        const countStatements = (pattern: RegExp) =>
          statements.filter(statement => pattern.test(statement.source)).length;

        assert.equal(result?.affectedExerciseIds.length, rowCount * 3);
        assert.equal(countStatements(/^delete from "sets"/), 2);
        assert.equal(countStatements(/^delete from "workout_exercises"/), 2);
        assert.equal(countStatements(/^insert into "workout_exercises"/), 2);
        assert.equal(countStatements(/^update "workout_exercises"/), 2);
        assert.equal(countStatements(/^insert into "sets"/), 2);
        assert.equal(countStatements(/^update "sets"/), 2);
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test(
    'updates and deletes sets while retaining changed set IDs',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedHistoricalExercises(db);
        insertHistoricalWorkout(db, {
          id: 'source-workout',
          status: 'completed',
          reps: [5, 5]
        });
        const draft = createHistoricalWorkoutEditDraft(db, 'source-workout')!;
        const draftSetA = db
          .select()
          .from(sets)
          .where(eq(sets.sourceSetId, 'source-workout-set-a'))
          .get()!;
        const draftSetB = db
          .select()
          .from(sets)
          .where(eq(sets.sourceSetId, 'source-workout-set-b'))
          .get()!;

        db.update(sets)
          .set({ reps: 12, rpe: 8, completedAt: 9_000 })
          .where(eq(sets.id, draftSetA.id))
          .run();
        db.delete(sets).where(eq(sets.id, draftSetB.id)).run();

        const result = saveHistoricalWorkoutEditDraft(db, {
          sourceWorkoutId: 'source-workout',
          draftWorkoutId: draft.id
        });

        assert.deepEqual(
          new Set(result?.affectedExerciseIds),
          new Set(['exercise-a', 'exercise-b'])
        );
        const updatedSet = db
          .select()
          .from(sets)
          .where(eq(sets.id, 'source-workout-set-a'))
          .get();

        assert.equal(updatedSet?.id, 'source-workout-set-a');
        assert.equal(updatedSet?.reps, 12);
        assert.equal(updatedSet?.rpe, 8);
        assert.equal(updatedSet?.completedAt, 9_000);
        assert.equal(
          db
            .select()
            .from(sets)
            .where(eq(sets.id, 'source-workout-set-b'))
            .get(),
          undefined
        );
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test(
    'detects source conflicts and rolls back late failures',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      try {
        seedHistoricalExercises(db);
        insertHistoricalWorkout(db, {
          id: 'source-workout',
          status: 'completed',
          reps: [5, 5]
        });
        const conflictedDraft = createHistoricalWorkoutEditDraft(
          db,
          'source-workout'
        )!;

        db.update(sets)
          .set({ reps: 6 })
          .where(eq(sets.id, 'source-workout-set-a'))
          .run();
        assert.throws(
          () =>
            saveHistoricalWorkoutEditDraft(db, {
              sourceWorkoutId: 'source-workout',
              draftWorkoutId: conflictedDraft.id
            }),
          HistoricalWorkoutEditDraftConflictError
        );
        assert.ok(
          db
            .select()
            .from(workouts)
            .where(eq(workouts.id, conflictedDraft.id))
            .get()
        );

        db.delete(workouts).where(eq(workouts.id, conflictedDraft.id)).run();
        const rollbackDraft = createHistoricalWorkoutEditDraft(
          db,
          'source-workout'
        )!;
        db.update(workouts)
          .set({ name: 'Must roll back' })
          .where(eq(workouts.id, rollbackDraft.id))
          .run();
        nodeClient.execSync(`
        CREATE TRIGGER reject_historical_draft_delete
        BEFORE DELETE ON workouts
        WHEN OLD.id = '${rollbackDraft.id}'
        BEGIN
          SELECT RAISE(ABORT, 'late save failure');
        END;
      `);

        assert.throws(() =>
          saveHistoricalWorkoutEditDraft(db, {
            sourceWorkoutId: 'source-workout',
            draftWorkoutId: rollbackDraft.id
          })
        );
        assert.equal(
          db
            .select()
            .from(workouts)
            .where(eq(workouts.id, 'source-workout'))
            .get()?.name,
          'source-workout'
        );
        assert.equal(
          db
            .select()
            .from(sets)
            .where(eq(sets.id, 'source-workout-set-a'))
            .get()?.reps,
          6
        );
        assert.ok(
          db
            .select()
            .from(workouts)
            .where(eq(workouts.id, rollbackDraft.id))
            .get()
        );
      } finally {
        nodeClient.closeSync();
      }
    }
  );

  await t.test('preserves set order when record timestamps tie', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    try {
      seedHistoricalExercises(db);
      insertHistoricalWorkout(db, {
        id: 'a-later-set',
        status: 'completed',
        reps: [20, 0]
      });
      insertHistoricalWorkout(db, {
        id: 'z-earlier-set',
        status: 'completed',
        reps: [10, 0]
      });
      db.update(sets)
        .set({ order: 1 })
        .where(eq(sets.id, 'a-later-set-set-a'))
        .run();

      rebuildPersonalRecordsForExercises(db, ['exercise-a']);

      assert.deepEqual(
        getHistoricalPersonalRecordRows(db).map(record => ({
          setId: record.setId,
          reps: record.reps
        })),
        [
          { setId: 'z-earlier-set-set-a', reps: 10 },
          { setId: 'a-later-set-set-a', reps: 20 }
        ]
      );
    } finally {
      nodeClient.closeSync();
    }
  });
});
