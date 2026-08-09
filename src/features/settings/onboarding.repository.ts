import type { DrizzleDb } from '@/src/db/client';
import { appMeta } from '@/src/db/schema';
import {
  SETTINGS_KEYS,
  type WeightUnit
} from '@/src/features/settings/settings.repository';
import { withDatabaseSpan } from '@/src/lib/db/database-observability';
import { eq } from 'drizzle-orm';

const ONBOARDING_KEY = 'onboarding.completed';

interface CompleteOnboardingWithPreferencesParams {
  weightUnit: WeightUnit;
}

export function isOnboardingCompleted(db: DrizzleDb): boolean {
  return withDatabaseSpan(
    {
      operation: 'onboarding.isCompleted',
      feature: 'onboarding',
      access: 'read'
    },
    () =>
      db.select().from(appMeta).where(eq(appMeta.key, ONBOARDING_KEY)).get()
        ?.value === 'true'
  );
}

export function completeOnboardingWithPreferences(
  db: DrizzleDb,
  { weightUnit }: CompleteOnboardingWithPreferencesParams
) {
  return withDatabaseSpan(
    {
      operation: 'onboarding.complete',
      feature: 'onboarding',
      access: 'write'
    },
    () =>
      db.transaction(tx => {
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
      })
  );
}
