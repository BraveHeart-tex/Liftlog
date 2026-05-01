import { useRestTimerStore } from '@/src/features/workouts/stores/rest-timer-store';
import { useEffect, useState } from 'react';

export function useIsRestTimerRunning() {
  const status = useRestTimerStore(state => state.status);
  const endTime = useRestTimerStore(state => state.endTime);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'running' || endTime === null) {
      return;
    }

    const timeoutId = setTimeout(
      () => {
        setNow(Date.now());
      },
      Math.max(0, endTime - Date.now())
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [endTime, status]);

  return status === 'running' && endTime !== null && endTime > now;
}
