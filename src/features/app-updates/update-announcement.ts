import type { UpdateState } from './update.types';

interface AutomaticUpdateSchedulerDependencies {
  schedule(callback: () => void): () => void;
  check(): Promise<void>;
}

export function isUpdateAnnouncementEligible(state: UpdateState) {
  return Boolean(
    state.release && state.dismissedVersionCode !== state.release.versionCode
  );
}

export const UPDATE_DETAILS_ROUTE = '/update-details';

export function shouldShowUpdateAnnouncement(
  state: UpdateState,
  pathname: string
) {
  return (
    pathname !== '/settings' &&
    pathname !== UPDATE_DETAILS_ROUTE &&
    isUpdateAnnouncementEligible(state)
  );
}

export function createAutomaticUpdateScheduler(
  dependencies: AutomaticUpdateSchedulerDependencies
) {
  let cancelScheduled: (() => void) | undefined;

  const scheduleCheck = () => {
    cancelScheduled?.();
    cancelScheduled = dependencies.schedule(() => {
      cancelScheduled = undefined;
      void dependencies.check().catch(() => undefined);
    });
  };

  return {
    started: scheduleCheck,
    foregrounded: scheduleCheck,
    dispose() {
      cancelScheduled?.();
      cancelScheduled = undefined;
    }
  };
}
