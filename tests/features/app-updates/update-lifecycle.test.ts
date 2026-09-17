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
    cancelCompletionNotification: async () => calls.push('cancel-notification'),
    getCompletion: async () => null,
    acknowledgeCompletion: async () => false,
    showCompletion: () => calls.push('show-completion'),
    reportCompletion: () => calls.push('report-completion'),
    reportReconciliationFailure: () => calls.push('report'),
    keepExclusion: () => calls.push('exclude')
  });

  await lifecycle.started();

  assert.deepEqual(calls, ['cancel-notification', 'reconcile', 'drain']);
});

test('startup shows then acknowledges a proven completion exactly once', async () => {
  const shown: unknown[] = [];
  const reported: unknown[] = [];
  let pending = {
    attemptId: 'attempt-1',
    installedVersionName: '1.1.0',
    installedVersionCode: 11
  };
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => undefined,
      foregrounded: async () => undefined
    },
    drainDiagnostics: async () => undefined,
    cancelCompletionNotification: async () => undefined,
    getCompletion: async () => pending,
    acknowledgeCompletion: async attemptId => {
      if (pending?.attemptId !== attemptId) {
        return false;
      }

      const completion = pending;
      pending = null as never;

      return Boolean(completion);
    },
    showCompletion: completion => shown.push(completion),
    reportCompletion: completion => reported.push(completion),
    reportReconciliationFailure: () => undefined,
    keepExclusion: () => undefined
  });

  await lifecycle.started();
  await lifecycle.started();

  assert.deepEqual(shown, [
    {
      attemptId: 'attempt-1',
      installedVersionName: '1.1.0',
      installedVersionCode: 11
    }
  ]);
  assert.deepEqual(reported, shown);
});

test('startup retains completion when snackbar queuing fails', async () => {
  let acknowledged = false;
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => undefined,
      foregrounded: async () => undefined
    },
    drainDiagnostics: async () => undefined,
    cancelCompletionNotification: async () => undefined,
    getCompletion: async () => ({
      attemptId: 'attempt-1',
      installedVersionName: '1.1.0',
      installedVersionCode: 11
    }),
    acknowledgeCompletion: async () => {
      acknowledged = true;

      return true;
    },
    showCompletion: () => {
      throw new Error('snackbar unavailable');
    },
    reportCompletion: () => undefined,
    reportReconciliationFailure: () => undefined,
    keepExclusion: () => undefined
  });

  await lifecycle.started();

  assert.equal(acknowledged, false);
});

test('concurrent startup calls present one completion once', async () => {
  let releaseCompletion!: () => void;
  let completionReads = 0;
  let shows = 0;
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => undefined,
      foregrounded: async () => undefined
    },
    drainDiagnostics: async () => undefined,
    cancelCompletionNotification: async () => undefined,
    getCompletion: async () => {
      completionReads += 1;
      await new Promise<void>(resolve => {
        releaseCompletion = resolve;
      });

      return {
        attemptId: 'attempt-1',
        installedVersionName: '1.1.0',
        installedVersionCode: 11
      };
    },
    acknowledgeCompletion: async () => true,
    showCompletion: () => {
      shows += 1;
    },
    reportCompletion: () => undefined,
    reportReconciliationFailure: () => undefined,
    keepExclusion: () => undefined
  });

  const first = lifecycle.started();
  const concurrent = lifecycle.started();
  await new Promise(resolve => setImmediate(resolve));
  releaseCompletion();
  await Promise.all([first, concurrent]);

  assert.equal(completionReads, 1);
  assert.equal(shows, 1);
});

test('startup notification cleanup and completion reporting stay fail-open', async () => {
  const calls: string[] = [];
  const lifecycle = createUpdateLifecycle({
    coordinator: {
      reconcile: async () => calls.push('reconcile'),
      foregrounded: async () => undefined
    },
    drainDiagnostics: async () => calls.push('drain'),
    cancelCompletionNotification: async () => {
      throw new Error('notification unavailable');
    },
    getCompletion: async () => ({
      attemptId: 'attempt-1',
      installedVersionName: '1.1.0',
      installedVersionCode: 11
    }),
    acknowledgeCompletion: async () => true,
    showCompletion: () => calls.push('show'),
    reportCompletion: () => {
      calls.push('report-completion');

      throw new Error('Sentry unavailable');
    },
    reportReconciliationFailure: () => undefined,
    keepExclusion: () => undefined
  });

  await lifecycle.started();

  assert.deepEqual(calls, ['reconcile', 'show', 'report-completion', 'drain']);
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
    cancelCompletionNotification: async () => undefined,
    getCompletion: async () => null,
    acknowledgeCompletion: async () => false,
    showCompletion: () => undefined,
    reportCompletion: () => undefined,
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
    cancelCompletionNotification: async () => undefined,
    getCompletion: async () => null,
    acknowledgeCompletion: async () => false,
    showCompletion: () => undefined,
    reportCompletion: () => undefined,
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
    cancelCompletionNotification: async () => calls.push('cancel'),
    getCompletion: async () => null,
    acknowledgeCompletion: async () => false,
    showCompletion: () => undefined,
    reportCompletion: () => undefined,
    reportReconciliationFailure: () => undefined,
    keepExclusion: () => undefined
  });

  await lifecycle.foregrounded();

  assert.deepEqual(calls, ['foreground', 'drain']);
});
