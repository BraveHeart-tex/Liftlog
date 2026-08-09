import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

interface FakeSpan {
  status?: { code: number };
  setStatus(status: { code: number }): FakeSpan;
}

interface StartSpanOptions {
  name: string;
  op?: string;
  onlyIfParent?: boolean;
  attributes?: Record<string, string | number | boolean>;
}

interface DatabaseSpanOptions {
  operation: string;
}

interface WithDatabaseSpan {
  <T>(options: DatabaseSpanOptions, operation: () => T): T;
  <T>(options: DatabaseSpanOptions, operation: () => Promise<T>): Promise<T>;
}

const spans: { options: StartSpanOptions; span: FakeSpan }[] = [];

function startSpan<T>(
  options: StartSpanOptions,
  callback: (span: FakeSpan) => T
): T {
  const span: FakeSpan = {
    setStatus(status) {
      span.status = status;

      return span;
    }
  };

  spans.push({ options, span });

  return callback(span);
}

mock.module('@sentry/react-native', {
  namedExports: { startSpan }
});

let withDatabaseSpan: WithDatabaseSpan;

async function loadDatabaseObservability() {
  withDatabaseSpan ??= (await import('@/src/lib/db/database-observability'))
    .withDatabaseSpan;
}

test('database span preserves synchronous success', async () => {
  await loadDatabaseObservability();
  spans.length = 0;

  assert.equal(
    withDatabaseSpan({ operation: 'settings.getWeightUnit' }, () => 'kg'),
    'kg'
  );

  assert.deepEqual(spans[0]?.options, {
    name: 'settings.getWeightUnit',
    op: 'db',
    onlyIfParent: true,
    attributes: {
      'db.system': 'sqlite',
      'db.operation': 'settings.getWeightUnit'
    }
  });
  assert.equal(spans[0]?.span.status?.code, 1);
});

test('database span preserves asynchronous success', async () => {
  await loadDatabaseObservability();
  spans.length = 0;

  await assert.doesNotReject(async () => {
    const result = await withDatabaseSpan(
      { operation: 'workout.getActiveWorkout' },
      async () => 42
    );

    assert.equal(result, 42);
  });

  assert.equal(spans[0]?.span.status?.code, 1);
});

test('database span rethrows synchronous database errors unchanged', async () => {
  await loadDatabaseObservability();
  spans.length = 0;
  const error = new Error('sync database failure');

  assert.throws(
    () =>
      withDatabaseSpan({ operation: 'settings.setWeightUnit' }, () => {
        throw error;
      }),
    thrownError => thrownError === error
  );

  assert.equal(spans[0]?.span.status?.code, 2);
});

test('database span rethrows asynchronous database errors unchanged', async () => {
  await loadDatabaseObservability();
  spans.length = 0;
  const error = new Error('async database failure');

  await assert.rejects(
    withDatabaseSpan({ operation: 'workout.saveWorkout' }, async () =>
      Promise.reject(error)
    ),
    thrownError => thrownError === error
  );

  assert.equal(spans[0]?.span.status?.code, 2);
});
