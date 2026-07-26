import { useDrizzle } from '@/src/components/database-provider';
import { completeOnboarding } from '@/src/features/settings/onboarding.service';
import {
  setWeightUnit,
  type WeightUnit
} from '@/src/features/settings/settings.repository';
import { router } from 'expo-router';
import { useCallback } from 'react';

const workoutRoute = '/(tabs)/workout';

interface UseOnboardingActionsParams {
  weightUnitPreference: WeightUnit;
}

export function useOnboardingActions({
  weightUnitPreference
}: UseOnboardingActionsParams) {
  const db = useDrizzle();

  const getStarted = useCallback(() => {
    completeOnboarding(db);
    setWeightUnit(db, weightUnitPreference);
    router.replace(workoutRoute);
  }, [db, weightUnitPreference]);

  return {
    getStarted
  };
}
