import { Text } from '@/src/components/ui/text';
import type { Workout } from '@/src/db';
import { formatDuration } from '@/src/lib/utils/date.utils';
import { useEffect, useState } from 'react';

interface ActiveWorkoutHeaderDurationProps {
  startedAt: Workout['startedAt'];
  exerciseCount?: number;
  completedSetCount?: number;
}

export function ActiveWorkoutHeaderDuration({
  startedAt,
  exerciseCount,
  completedSetCount
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

  const duration = formatDuration({ startedAt, completedAt: now });
  const shouldShowSummary =
    exerciseCount !== undefined && completedSetCount !== undefined;

  if (!shouldShowSummary) {
    return (
      <Text variant="caption" tone="muted">
        {duration}
      </Text>
    );
  }

  return (
    <Text variant="caption" tone="muted" className="mt-1" numberOfLines={1}>
      {duration} · {exerciseCount}{' '}
      {exerciseCount === 1 ? 'exercise' : 'exercises'} · {completedSetCount}{' '}
      {completedSetCount === 1 ? 'set' : 'sets'}
    </Text>
  );
}
