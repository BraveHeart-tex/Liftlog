import type { DrizzleDb } from '@/src/db/client';
import {
  getSetting,
  setSetting
} from '@/src/features/settings/settings.repository';

const ONBOARDING_KEY = 'onboarding.completed';

export function isOnboardingCompleted(db: DrizzleDb): boolean {
  return getSetting(db, ONBOARDING_KEY) === 'true';
}

export function completeOnboarding(db: DrizzleDb): void {
  setSetting(db, ONBOARDING_KEY, 'true');
}
