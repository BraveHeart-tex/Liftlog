import { createUpdateLifecycle } from '@/src/features/app-updates/update-lifecycle';
import assert from 'node:assert/strict';
import test from 'node:test';

test('startup reconciles once then drains diagnostics', async () => {
  const calls: string[] = [];
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => calls.push('reconcile'),
      foregrounded: async () => calls.push('foreground')
    },
    drainDiagnostics: async () => calls.push('drain'),
    reportReconciliationFailure: () => calls.push('report'),
    keepExclusion: () => calls.push('exclude')
  });

  await lifecycle.started();

  assert.deepEqual(calls, ['reconcile', 'drain']);
});

test('startup and foreground report original reconciliation errors and remain fail-open', async () => {
  const source = new Error('native state unavailable');
  const reports: { error: unknown; operation: string }[] = [];
  let drains = 0;
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => {
        throw source;
      },
      foregrounded: async () => {
        throw source;
      }
    },
    drainDiagnostics: async () => {
      drains += 1;

      throw new Error('reporting unavailable');
    },
    reportReconciliationFailure: (error, operation) => {
      reports.push({ error, operation });

      throw new Error('Sentry unavailable');
    },
    keepExclusion: () => undefined
  });

  await lifecycle.started();
  await lifecycle.foregrounded();

  assert.deepEqual(reports, [
    { error: source, operation: 'startup_reconcile' },
    { error: source, operation: 'foreground_reconcile' }
  ]);
  assert.equal(drains, 2);
});

test('unknown native ownership keeps exclusion active when reconciliation fails', async () => {
  let excluded = false;
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => undefined,
      foregrounded: async () => {
        throw new Error('unknown ownership');
      }
    },
    drainDiagnostics: async () => undefined,
    reportReconciliationFailure: () => undefined,
    keepExclusion: () => {
      excluded = true;
    }
  });

  await lifecycle.foregrounded();

  assert.equal(excluded, true);
});

test('foreground uses coordinator foreground orchestration instead of startup reconciliation', async () => {
  const calls: string[] = [];
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => calls.push('startup'),
      foregrounded: async () => calls.push('foreground')
    },
    drainDiagnostics: async () => calls.push('drain'),
    reportReconciliationFailure: () => undefined,
    keepExclusion: () => undefined
  });

  await lifecycle.foregrounded();

  assert.deepEqual(calls, ['foreground', 'drain']);
});
