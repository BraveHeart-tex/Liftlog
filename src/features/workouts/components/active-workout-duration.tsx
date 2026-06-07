import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db';
import { formatTimerDuration } from '@/src/lib/utils/date';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

interface ActiveWorkoutDurationProps {
  startedAt: Workout['startedAt'];
}

export const ActiveWorkoutDuration = ({
  startedAt
}: ActiveWorkoutDurationProps) => {
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());

      const intervalId = setInterval(() => {
        setNow(Date.now());
      }, 1000);

      return () => {
        clearInterval(intervalId);
      };
    }, [])
  );

  return (
    <Text variant="small" tone="muted">
      {formatTimerDuration((now - startedAt) / 1000)}
    </Text>
  );
};
