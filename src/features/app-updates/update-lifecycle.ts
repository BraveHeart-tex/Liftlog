import type { UpdateCompletionAcknowledgement } from '@/modules/liftlog-updater/src/types';

export type ReconciliationOperation =
  | 'startup_reconcile'
  | 'foreground_reconcile';

interface UpdateLifecycleDependencies {
  coordinator: {
    reconcile(): Promise<unknown>;
    foregrounded(): Promise<unknown>;
  };
  drainDiagnostics(): Promise<unknown>;
  cancelCompletionNotification(): Promise<unknown>;
  getCompletion(): Promise<UpdateCompletionAcknowledgement | null>;
  acknowledgeCompletion(attemptId: string): Promise<boolean>;
  showCompletion(completion: UpdateCompletionAcknowledgement): void;
  reportCompletion(completion: UpdateCompletionAcknowledgement): void;
  reportReconciliationFailure(
    error: unknown,
    operation: ReconciliationOperation
  ): void;
  keepExclusion(): void;
}

export function createUpdateLifecycle(
  dependencies: UpdateLifecycleDependencies
) {
  let startupInFlight: Promise<void> | undefined;
  const run = async (
    operation: ReconciliationOperation,
    reconcile: () => Promise<unknown>
  ) => {
    try {
      await reconcile();
    } catch (error) {
      dependencies.keepExclusion();

      try {
        dependencies.reportReconciliationFailure(error, operation);
      } catch {
        // Reporting must not alter native ownership or lifecycle behavior.
      }
    } finally {
      try {
        await dependencies.drainDiagnostics();
      } catch {
        // The durable backlog owns retry on the next lifecycle transition.
      }
    }
  };

  const runStartup = async () => {
    try {
      await dependencies.cancelCompletionNotification();
    } catch {
      // Notification cleanup must not block reconciliation or startup.
    }

    let reconciled = false;

    try {
      await dependencies.coordinator.reconcile();
      reconciled = true;
    } catch (error) {
      dependencies.keepExclusion();

      try {
        dependencies.reportReconciliationFailure(error, 'startup_reconcile');
      } catch {
        // Reporting must not alter native ownership or lifecycle behavior.
      }
    }

    if (reconciled) {
      try {
        const completion = await dependencies.getCompletion();

        if (completion) {
          dependencies.showCompletion(completion);
          await dependencies.acknowledgeCompletion(completion.attemptId);

          try {
            dependencies.reportCompletion(completion);
          } catch {
            // Reporting must not alter completion presentation or startup.
          }
        }
      } catch {
        // Durable native state can retry completion on a later startup.
      }
    }

    try {
      await dependencies.drainDiagnostics();
    } catch {
      // The durable backlog owns retry on the next lifecycle transition.
    }
  };

  const started = () => {
    if (!startupInFlight) {
      startupInFlight = runStartup().finally(() => {
        startupInFlight = undefined;
      });
    }

    return startupInFlight;
  };

  return {
    started,
    foregrounded: () =>
      run('foreground_reconcile', () => dependencies.coordinator.foregrounded())
  };
}
