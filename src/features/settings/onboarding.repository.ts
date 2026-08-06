import type { DrizzleDb } from '@/src/db/client';
import { appMeta } from '@/src/db/schema';
import {
  getSetting,
  SETTINGS_KEYS,
  type WeightUnit
} from '@/src/features/settings/settings.repository';

const ONBOARDING_KEY = 'onboarding.completed';

interface CompleteOnboardingWithPreferencesParams {
  weightUnit: WeightUnit;
}

export function isOnboardingCompleted(db: DrizzleDb): boolean {
  return getSetting(db, ONBOARDING_KEY) === 'true';
}

export function completeOnboardingWithPreferences(
  db: DrizzleDb,
  { weightUnit }: CompleteOnboardingWithPreferencesParams
) {
  return db.transaction(tx => {
    tx.insert(appMeta)
      .values({ key: SETTINGS_KEYS.weightUnit, value: weightUnit })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: { value: weightUnit }
      })
      .run();
    tx.insert(appMeta)
      .values({ key: ONBOARDING_KEY, value: 'true' })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: { value: 'true' }
      })
      .run();

    return { status: 'success' } as const;
  });
}
