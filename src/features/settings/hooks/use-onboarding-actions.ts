import { useDrizzle } from '@/src/components/database-provider';
import { completeOnboarding } from '@/src/features/settings/onboarding';
import {
  setWeightUnit,
  type WeightUnit
} from '@/src/features/settings/repository';
import { router } from 'expo-router';
import { useCallback } from 'react';

const workoutRoute = '/(tabs)/workout';

type UseOnboardingActionsParams = {
  name: string;
  weightUnitPreference: WeightUnit;
  setAttemptedSubmit: (attemptedSubmit: boolean) => void;
};

export function useOnboardingActions({
  name,
  weightUnitPreference,
  setAttemptedSubmit
}: UseOnboardingActionsParams) {
  const db = useDrizzle();

  const getStarted = useCallback(() => {
    const trimmedName = name.trim();

    setAttemptedSubmit(true);

    if (trimmedName.length === 0) {
      return;
    }

    completeOnboarding(db, trimmedName);
    setWeightUnit(db, weightUnitPreference);
    router.replace(workoutRoute);
  }, [db, name, setAttemptedSubmit, weightUnitPreference]);

  return {
    getStarted
  };
}
