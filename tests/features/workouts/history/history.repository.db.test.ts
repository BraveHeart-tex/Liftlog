import {
  exercises,
  personalRecords,
  sets,
  workoutExercises,
  workouts
} from '@/src/db/schema';
import type { DrizzleDb } from '@/src/db/client';
import {
  createHistoricalWorkoutEditDraft,
  HistoricalWorkoutEditDraftConflictError,
  saveHistoricalWorkoutDraft,
  saveHistoricalWorkoutEditDraft
} from '@/src/features/workouts/history/history.repository';
import { rebuildPersonalRecordsForExercises } from '@/src/features/progress/progress.repository';
import { eq, inArray } from 'drizzle-orm';
import assert from 'node:assert/strict';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';

afterEach(closeTestDatabases);

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

describe('historical saves rebuild records for all affected exercises', () => {
  test('saves a historical draft with and without new records', async () => {
    const { db } = await createMigratedTestDatabase();

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
    assert.deepEqual(result?.affectedExerciseIds, ['exercise-a', 'exercise-b']);
    assert.deepEqual(getHistoricalPersonalRecordRows(db), [
      {
        exerciseId: 'exercise-a',
        setId: 'historical-draft-set-a',
        reps: 10,
        score: 10
      }
    ]);
  });

  test('saves a historical edit with and without replacement records', async () => {
    const { db } = await createMigratedTestDatabase();

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
    assert.deepEqual(result?.affectedExerciseIds, ['exercise-a', 'exercise-b']);
    assert.deepEqual(
      getHistoricalPersonalRecordRows(db).map(record => ({
        exerciseId: record.exerciseId,
        reps: record.reps,
        score: record.score
      })),
      [{ exerciseId: 'exercise-a', reps: 10, score: 10 }]
    );
  });

  test('renames without replacing source graph IDs', async () => {
    const { db } = await createMigratedTestDatabase();

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
  });

  test('reorders exercises without rebuilding records', async () => {
    const { db } = await createMigratedTestDatabase();

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
  });

  test('adds and removes exercises in batches', async () => {
    const { db } = await createMigratedTestDatabase();

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
    assert.ok(!sourceRows.some(row => row.id === 'source-workout-exercise-b'));
    assert.ok(
      sourceRows.some(
        row => row.exerciseId === 'exercise-c' && row.id !== 'draft-exercise-c'
      )
    );
  });

  test('chunks every historical edit write to the variable limit', async () => {
    const { db } = await createMigratedTestDatabase();
    // Past every per-statement row bound (floor(999 / variables per row))
    // except save's deletes and workout exercise insert; the guard is active.
    const rowCount = 112;
    const seedChunkSize = 50;

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

    for (let index = 0; index < exerciseRows.length; index += seedChunkSize) {
      db.insert(exercises)
        .values(exerciseRows.slice(index, index + seedChunkSize))
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

    const sourceExerciseRows = Array.from({ length: rowCount }, (_, index) => [
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
    ]).flat();

    for (
      let index = 0;
      index < sourceExerciseRows.length;
      index += seedChunkSize
    ) {
      db.insert(workoutExercises)
        .values(sourceExerciseRows.slice(index, index + seedChunkSize))
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

    for (let index = 0; index < sourceSetRows.length; index += seedChunkSize) {
      db.insert(sets)
        .values(sourceSetRows.slice(index, index + seedChunkSize))
        .run();
    }

    const draft = createHistoricalWorkoutEditDraft(db, 'source-workout')!;
    const draftExerciseRows = db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, draft.id))
      .all();
    const draftSetCount = db
      .select()
      .from(sets)
      .where(
        inArray(
          sets.workoutExerciseId,
          draftExerciseRows.map(row => row.id)
        )
      )
      .all().length;

    assert.equal(draftExerciseRows.length, rowCount * 2);
    assert.equal(draftSetCount, rowCount * 3);
    const draftExerciseBySourceId = new Map(
      draftExerciseRows.map(row => [row.sourceWorkoutExerciseId, row])
    );
    const removedDraftExerciseIds = Array.from(
      { length: rowCount },
      (_, index) => draftExerciseBySourceId.get(`source-remove-${index}`)!.id
    );
    const updatedDraftExerciseIds = Array.from(
      { length: rowCount },
      (_, index) => draftExerciseBySourceId.get(`source-update-${index}`)!.id
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
    const addedDraftSetRows = Array.from({ length: rowCount }, (_, index) => ({
      id: `draft-add-set-${index}`,
      workoutExerciseId: `draft-add-${index}`,
      order: 0,
      reps: 3,
      status: 'completed',
      completedAt: 5_000 + index
    }));

    for (let index = 0; index < rowCount; index += seedChunkSize) {
      db.insert(sets)
        .values(addedDraftSetRows.slice(index, index + seedChunkSize))
        .run();
    }

    const result = saveHistoricalWorkoutEditDraft(db, {
      sourceWorkoutId: 'source-workout',
      draftWorkoutId: draft.id
    });

    assert.equal(result?.affectedExerciseIds.length, rowCount * 3);

    const savedExerciseRows = db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, 'source-workout'))
      .all();
    const savedSetRows = db
      .select()
      .from(sets)
      .where(
        inArray(
          sets.workoutExerciseId,
          savedExerciseRows.map(row => row.id)
        )
      )
      .all();

    assert.equal(savedExerciseRows.length, rowCount * 2);
    assert.equal(
      savedExerciseRows.filter(row => row.notes === 'Updated in draft').length,
      rowCount
    );
    assert.equal(
      savedExerciseRows.filter(row => row.id.startsWith('source-remove-'))
        .length,
      0
    );
    assert.equal(savedSetRows.length, rowCount * 2);
    assert.equal(
      savedSetRows.filter(
        row => row.id.startsWith('source-update-set-') && row.reps === 2
      ).length,
      rowCount
    );
    assert.equal(savedSetRows.filter(row => row.reps === 3).length, rowCount);
  });

  test('updates and deletes sets while retaining changed set IDs', async () => {
    const { db } = await createMigratedTestDatabase();

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
      db.select().from(sets).where(eq(sets.id, 'source-workout-set-b')).get(),
      undefined
    );
  });

  test('detects source conflicts and rolls back late failures', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

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
      db.select().from(workouts).where(eq(workouts.id, 'source-workout')).get()
        ?.name,
      'source-workout'
    );
    assert.equal(
      db.select().from(sets).where(eq(sets.id, 'source-workout-set-a')).get()
        ?.reps,
      6
    );
    assert.ok(
      db.select().from(workouts).where(eq(workouts.id, rollbackDraft.id)).get()
    );
  });

  test('preserves set order when record timestamps tie', async () => {
    const { db } = await createMigratedTestDatabase();

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
  });
});
