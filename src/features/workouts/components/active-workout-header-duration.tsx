import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db';
import { formatDuration } from '@/src/lib/utils/date';
import { useEffect, useState } from 'react';

interface ActiveWorkoutHeaderDurationProps {
  startedAt: Workout['startedAt'];
}

export function ActiveWorkoutHeaderDuration({
  startedAt
}: ActiveWorkoutHeaderDurationProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [startedAt]);

  return (
    <Text variant="caption" tone="muted">
      {formatDuration({ startedAt, completedAt: now })}
    </Text>
  );
}
