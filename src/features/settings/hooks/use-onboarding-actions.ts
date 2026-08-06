import { useDrizzle } from '@/src/components/database-provider';
import { completeOnboardingWithPreferences } from '@/src/features/settings/onboarding.repository';
import type { WeightUnit } from '@/src/features/settings/settings.repository';
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

    try {
      const result = completeOnboardingWithPreferences(db, {
        weightUnit: weightUnitPreference
      });

      if (result.status === 'success') {
        router.replace(workoutRoute);
      }
    } catch (error) {
      isStartingRef.current = false;
      setIsStarting(false);
      console.error('Failed to complete onboarding', error);
    }
  }, [db, weightUnitPreference]);

  return {
    getStarted,
    isStarting
  };
}
