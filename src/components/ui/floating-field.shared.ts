import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';

export function getFloatingFieldValue({
  controlledValue,
  defaultValue,
  uncontrolledValue
}: {
  controlledValue?: string;
  defaultValue?: string;
  uncontrolledValue?: string;
}) {
  return controlledValue ?? uncontrolledValue ?? defaultValue ?? '';
}

export function shouldFloatFloatingField({
  focused,
  value
}: {
  focused: boolean;
  value: string;
}) {
  return focused || value.length > 0;
}

export function getFloatingFieldAnimation({
  reduceMotion,
  shouldFloat
}: {
  reduceMotion: boolean;
  shouldFloat: boolean;
}) {
  return {
    duration: reduceMotion ? 0 : MOTION_DURATION_MS.standard,
    toValue: shouldFloat ? 1 : 0
  } as const;
}
