import { appMeta, healthStepDays } from '@/src/db/schema';
import { SETTINGS_KEYS } from '@/src/features/settings/settings.repository';
import { saveStepSyncResult } from '@/src/features/steps/steps.repository';
import { eq } from 'drizzle-orm';
import assert from 'node:assert/strict';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';
import { createStepDay } from '@/tests/support/factories';

afterEach(closeTestDatabases);

describe('step sync results persist atomically in bulk', () => {
  test('empty input performs no writes', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();

    nodeClient.resetPreparedStatementCount();

    saveStepSyncResult(db, { days: [], syncedAt: 20_000 });

    assert.equal(nodeClient.getPreparedStatementCount(), 0);
    assert.deepEqual(db.select().from(healthStepDays).all(), []);
    assert.equal(
      db
        .select()
        .from(appMeta)
        .where(eq(appMeta.key, SETTINGS_KEYS.stepsLastSyncAt))
        .get(),
      undefined
    );
  });

  test('persists one day and sync metadata', async () => {
    const { db } = await createMigratedTestDatabase();
    const day = createStepDay(1);

    saveStepSyncResult(db, { days: [day], syncedAt: 20_001 });

    assert.deepEqual(db.select().from(healthStepDays).get(), day);
    assert.equal(
      db
        .select({ value: appMeta.value })
        .from(appMeta)
        .where(eq(appMeta.key, SETTINGS_KEYS.stepsLastSyncAt))
        .get()?.value,
      '20001'
    );
  });

  test('persists multiple new days', async () => {
    const { db } = await createMigratedTestDatabase();
    const days = [createStepDay(1), createStepDay(2), createStepDay(3)];

    saveStepSyncResult(db, { days, syncedAt: 20_003 });

    assert.deepEqual(
      db.select().from(healthStepDays).orderBy(healthStepDays.dateKey).all(),
      days
    );
  });

  test('updates existing days from excluded values', async () => {
    const { db } = await createMigratedTestDatabase();
    const original = createStepDay(1);
    const updated = {
      ...original,
      steps: 9_999,
      startAt: 50_000,
      endAt: 60_000,
      syncedAt: 70_000
    };

    saveStepSyncResult(db, { days: [original], syncedAt: 20_001 });
    saveStepSyncResult(db, { days: [updated], syncedAt: 20_002 });

    assert.deepEqual(db.select().from(healthStepDays).get(), updated);
    assert.equal(
      db
        .select({ value: appMeta.value })
        .from(appMeta)
        .where(eq(appMeta.key, SETTINGS_KEYS.stepsLastSyncAt))
        .get()?.value,
      '20002'
    );
  });

  test('chunks only beyond the safe SQLite parameter count', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();
    const days = Array.from({ length: 200 }, (_, index) =>
      createStepDay(index)
    );

    nodeClient.resetPreparedStatementCount();

    saveStepSyncResult(db, { days, syncedAt: 20_200 });

    assert.equal(nodeClient.getPreparedStatementCount(), 3);
    assert.equal(db.select().from(healthStepDays).all().length, 200);
  });

  test('rolls back day writes when metadata persistence fails', async () => {
    const { db, nodeClient } = await createMigratedTestDatabase();
    const original = createStepDay(1);
    const updated = { ...original, steps: 9_999, syncedAt: 30_000 };
    const newDay = createStepDay(2);

    saveStepSyncResult(db, { days: [original], syncedAt: 20_001 });
    nodeClient.execSync(`
      CREATE TRIGGER reject_step_sync_metadata
      BEFORE INSERT ON app_meta
      WHEN NEW.key = 'settings.steps_last_sync_at'
      BEGIN
        SELECT RAISE(ABORT, 'metadata persistence failed');
      END;
      `);

    assert.throws(
      () =>
        saveStepSyncResult(db, {
          days: [updated, newDay],
          syncedAt: 20_002
        }),
      /metadata persistence failed/
    );
    assert.deepEqual(db.select().from(healthStepDays).all(), [original]);
    assert.equal(
      db
        .select({ value: appMeta.value })
        .from(appMeta)
        .where(eq(appMeta.key, SETTINGS_KEYS.stepsLastSyncAt))
        .get()?.value,
      '20001'
    );
  });
});
