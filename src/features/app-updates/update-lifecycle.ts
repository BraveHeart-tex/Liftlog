export type ReconciliationOperation =
  | 'startup_reconcile'
  | 'foreground_reconcile';

interface UpdateLifecycleDependencies {
  coordinator: {
    reconcile(): Promise<unknown>;
    foregrounded(): Promise<unknown>;
  };
  drainDiagnostics(): Promise<unknown>;
  reportReconciliationFailure(
    error: unknown,
    operation: ReconciliationOperation
  ): void;
  keepExclusion(): void;
}

export function createUpdateLifecycle(
  dependencies: UpdateLifecycleDependencies
) {
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

  return {
    started: () =>
      run('startup_reconcile', () => dependencies.coordinator.reconcile()),
    foregrounded: () =>
      run('foreground_reconcile', () => dependencies.coordinator.foregrounded())
  };
}
