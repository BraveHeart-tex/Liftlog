import { useDrizzle } from '@/src/components/database-provider';
import { completeOnboarding } from '@/src/features/settings/onboarding.service';
import {
  setWeightUnit,
  type WeightUnit
} from '@/src/features/settings/settings.repository';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

const workoutRoute = '/(tabs)/workout';

interface UseOnboardingActionsParams {
  weightUnitPreference: WeightUnit;
}

export function useOnboardingActions({
  weightUnitPreference
}: UseOnboardingActionsParams) {
  const db = useDrizzle();
  const isStartingRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);

  const getStarted = useCallback(() => {
    if (isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;
    setIsStarting(true);
    completeOnboarding(db);
    setWeightUnit(db, weightUnitPreference);
    router.replace(workoutRoute);
  }, [db, weightUnitPreference]);

  return {
    getStarted,
    isStarting
  };
}
