import type { RestTimerNotificationAccess } from './rest-timer.coordinator';

export function createLatestRestTimerNotificationAccessReconciler(
  read: () => Promise<RestTimerNotificationAccess>,
  apply: (access: RestTimerNotificationAccess) => void
) {
  let requestGeneration = 0;

  return async () => {
    const generation = ++requestGeneration;
    const access = await read();

    if (generation === requestGeneration) {
      apply(access);
    }
  };
}
