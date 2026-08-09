import type { DrizzleDb } from '@/src/db/client';
import {
  syncStepDaysFromHealthConnect,
  type StepSyncResult
} from '@/src/features/steps/health-connect.service';
import { saveStepSyncResult } from '@/src/features/steps/steps.repository';

interface StepSyncOptions {
  isInitial: boolean;
}

interface InFlightSync {
  isInitial: boolean;
  promise: Promise<StepSyncResult>;
}

let inFlightSync: InFlightSync | null = null;

export function syncAndSaveStepDays(
  db: DrizzleDb,
  options: StepSyncOptions
): Promise<StepSyncResult> {
  const existingSync = inFlightSync;

  if (existingSync) {
    if (existingSync.isInitial || !options.isInitial) {
      return existingSync.promise;
    }

    return existingSync.promise.then(
      () => syncAndSaveStepDays(db, options),
      () => syncAndSaveStepDays(db, options)
    );
  }

  const promise = syncStepDaysFromHealthConnect(options)
    .then(result => {
      const firstDay = result.days[0];

      if (firstDay) {
        saveStepSyncResult(db, {
          days: result.days,
          syncedAt: firstDay.syncedAt
        });
      }

      return result;
    })
    .finally(() => {
      if (inFlightSync?.promise === promise) {
        inFlightSync = null;
      }
    });

  inFlightSync = {
    isInitial: options.isInitial,
    promise
  };

  return promise;
}
