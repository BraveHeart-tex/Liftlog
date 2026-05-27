import type { HealthConnectAvailability } from '@/src/features/steps/health-connect';
import { requestActivityRecognitionPermission } from '@/src/features/steps/step-counter-permissions';
import { StepCounter, type StepCounterChangeEvent } from 'expo-step-counter';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type LiveStepCounterStatus =
  | 'idle'
  | 'checking'
  | 'active'
  | 'unsupported'
  | 'unavailable'
  | 'no_sensor'
  | 'permission_denied'
  | 'error';

interface UseLiveStepCounterParams {
  baselineDateKey: string;
  availability: HealthConnectAvailability;
  baselineSteps: number;
  canReadHealthConnectSteps: boolean;
  isEnabled: boolean;
  stepGoal: number;
}

interface UseLiveStepCounterResult {
  error: string | null;
  liveDelta: number;
  status: LiveStepCounterStatus;
  steps: number | null;
}

function normalizeStepCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function useLiveStepCounter({
  baselineDateKey,
  availability,
  baselineSteps,
  canReadHealthConnectSteps,
  isEnabled,
  stepGoal
}: UseLiveStepCounterParams): UseLiveStepCounterResult {
  const baselineRef = useRef(normalizeStepCount(baselineSteps));
  const baselineDateKeyRef = useRef(baselineDateKey);
  const isFocusedRef = useRef(false);
  const isStartedRef = useRef(false);
  const [event, setEvent] = useState<StepCounterChangeEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LiveStepCounterStatus>('idle');

  const shouldRun =
    Platform.OS === 'android' &&
    availability === 'available' &&
    canReadHealthConnectSteps &&
    isEnabled;

  const startCounter = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setStatus('unsupported');
      setEvent(null);

      return;
    }

    if (!shouldRun) {
      setStatus('idle');
      setEvent(null);

      return;
    }

    setStatus('checking');
    setError(null);

    try {
      if (!StepCounter.isAvailable()) {
        setStatus('no_sensor');
        setEvent(null);

        return;
      }

      const hasPermission = await requestActivityRecognitionPermission();

      if (!isFocusedRef.current) {
        return;
      }

      if (!hasPermission) {
        setStatus('permission_denied');
        setEvent(null);

        return;
      }

      StepCounter.start(
        baselineRef.current,
        stepGoal,
        baselineDateKeyRef.current
      );
      isStartedRef.current = true;
      setStatus('active');
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : 'Could not start live step counter.';

      isStartedRef.current = false;
      setError(message);
      setEvent(null);
      setStatus('error');
    }
  }, [shouldRun, stepGoal]);

  useEffect(() => {
    const nextBaseline = normalizeStepCount(baselineSteps);

    if (baselineDateKey !== baselineDateKeyRef.current) {
      baselineDateKeyRef.current = baselineDateKey;
      baselineRef.current = nextBaseline;
      setEvent(null);

      if (isStartedRef.current) {
        StepCounter.updateBaseline(nextBaseline, stepGoal, baselineDateKey);
      }

      return;
    }

    if (nextBaseline <= baselineRef.current) {
      return;
    }

    baselineRef.current = nextBaseline;

    if (isStartedRef.current) {
      StepCounter.updateBaseline(nextBaseline, stepGoal, baselineDateKey);
    }
  }, [baselineDateKey, baselineSteps, stepGoal]);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      const stepSubscription = StepCounter.addStepCountListener(nextEvent => {
        const eventBaseline = normalizeStepCount(
          nextEvent.healthConnectBaseline
        );

        baselineRef.current = Math.max(baselineRef.current, eventBaseline);
        setEvent({
          ...nextEvent,
          healthConnectBaseline: eventBaseline,
          liveDelta: normalizeStepCount(nextEvent.liveDelta),
          steps: normalizeStepCount(nextEvent.steps)
        });
        setError(null);
        setStatus('active');
      });
      const errorSubscription = StepCounter.addErrorListener(nextError => {
        isStartedRef.current = false;
        setError(nextError.message);
        setEvent(null);
        setStatus('error');
      });

      void startCounter();

      return () => {
        isFocusedRef.current = false;
        stepSubscription.remove();
        errorSubscription.remove();
      };
    }, [startCounter])
  );

  return {
    error,
    liveDelta: normalizeStepCount(event?.liveDelta ?? 0),
    status,
    steps: event?.steps ?? null
  };
}
