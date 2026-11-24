import { exercises, personalRecords, sets } from '@/src/db/schema';
import type { DrizzleDb } from '@/src/db/client';
import {
  createCompletedSet,
  deleteCompletedSet,
  updateCompletedSet
} from '@/src/features/workouts/set-entry/set-entry.repository';
import { eq } from 'drizzle-orm';
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import {
  closeTestDatabases,
  createMigratedTestDatabase,
  rejectPersonalRecordRebuilds
} from '@/tests/support/db';
import {
  createTrackedSet,
  seedTrackedExercise
} from '@/tests/support/factories';

afterEach(closeTestDatabases);

function getPersonalRecordSetIds(db: DrizzleDb) {
  return db
    .select({ setId: personalRecords.setId })
    .from(personalRecords)
    .where(eq(personalRecords.exerciseId, 'exercise-1'))
    .orderBy(personalRecords.achievedAt)
    .all()
    .map(record => record.setId);
}

test('completed set commands maintain personal records atomically', async t => {
  await t.test('creates a new personal record', async () => {
    const { db } = await createMigratedTestDatabase();

    seedTrackedExercise(db);
    createTrackedSet(db, 'baseline-set', 10, 0);

    const result = createTrackedSet(db, 'record-set', 12, 1);

    assert.equal(result.set.id, 'record-set');
    assert.equal(result.isNewPersonalRecord, true);
    assert.deepEqual(getPersonalRecordSetIds(db), [
      'baseline-set',
      'record-set'
    ]);
  });

  await t.test('creates a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    seedTrackedExercise(db);
    createTrackedSet(db, 'baseline-set', 10, 0);
    rejectPersonalRecordRebuilds(nodeClient);

    const result = createTrackedSet(db, 'non-record-set', 8, 1);

    assert.equal(result.set.id, 'non-record-set');
    assert.equal(result.isNewPersonalRecord, false);
    assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
  });

  await t.test(
    'does not report a zero score as a personal record',
    async () => {
      const { db } = await createMigratedTestDatabase();

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
    }
  );

  await t.test(
    'rebuilds after editing the current record downward',
    async () => {
      const { db } = await createMigratedTestDatabase();

      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      createTrackedSet(db, 'record-set', 12, 1);

      const result = updateCompletedSet(db, 'record-set', { reps: 8 });

      assert.equal(result?.set.reps, 8);
      assert.equal(result?.isNewPersonalRecord, false);
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    }
  );

  await t.test('edits a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    seedTrackedExercise(db);
    createTrackedSet(db, 'baseline-set', 10, 0);
    createTrackedSet(db, 'non-record-set', 8, 1);
    rejectPersonalRecordRebuilds(nodeClient);

    const result = updateCompletedSet(db, 'non-record-set', { reps: 9 });

    assert.equal(result?.set.reps, 9);
    assert.equal(result?.isNewPersonalRecord, false);
    assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
  });

  await t.test(
    'rebuilds when editing a non-record into the historical record chain',
    async () => {
      const { db } = await createMigratedTestDatabase();

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
    }
  );

  await t.test('rebuilds after deleting the current record', async () => {
    const { db } = await createMigratedTestDatabase();

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
  });

  await t.test('deletes a non-record set without rebuilding', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

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
  });

  await t.test(
    'rolls back the set mutation when rebuilding fails',
    async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      seedTrackedExercise(db);
      createTrackedSet(db, 'baseline-set', 10, 0);
      rejectPersonalRecordRebuilds(nodeClient);

      assert.throws(() => createTrackedSet(db, 'record-set', 12, 1));
      assert.equal(
        db.select().from(sets).where(eq(sets.id, 'record-set')).get(),
        undefined
      );
      assert.deepEqual(getPersonalRecordSetIds(db), ['baseline-set']);
    }
  );
});
