import { MOTION_DURATION_MS } from '@/src/lib/animations/motion.constants';
import { cn } from '@/src/lib/utils/cn.utils';
import { useEffect, useRef, type ReactNode } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

export type SetFormFieldTone = 'neutral' | 'valid' | 'committed' | 'error';

export interface SetFormFieldColors {
  background: [string, string, string, string];
  border: [string, string, string, string];
}

const toneProgress: Record<SetFormFieldTone, number> = {
  neutral: 0,
  valid: 1,
  committed: 2,
  error: 3
};

interface SetFormFieldSurfaceProps {
  children: ReactNode;
  className?: string;
  colors: SetFormFieldColors;
  tone: SetFormFieldTone;
}

export function SetFormFieldSurface({
  children,
  className,
  colors,
  tone
}: SetFormFieldSurfaceProps) {
  const progress = useSharedValue(toneProgress[tone]);

  useEffect(() => {
    progress.value = withTiming(toneProgress[tone], {
      duration: MOTION_DURATION_MS.standard
    });
  }, [progress, tone]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2, 3],
      colors.background
    ),
    borderColor: interpolateColor(progress.value, [0, 1, 2, 3], colors.border)
  }));

  return (
    <Animated.View
      className={cn('min-h-12 rounded-lg border', className)}
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  );
}

interface SetFormSaveSurfaceProps {
  children: ReactNode;
  colors: SetFormFieldColors;
  isCommitted: boolean;
  tone: SetFormFieldTone;
}

export function SetFormSaveSurface({
  children,
  colors,
  isCommitted,
  tone
}: SetFormSaveSurfaceProps) {
  const previousIsCommitted = useRef(isCommitted);
  const progress = useSharedValue(toneProgress[tone]);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(toneProgress[tone], {
      duration: MOTION_DURATION_MS.standard
    });
  }, [progress, tone]);

  useEffect(() => {
    if (isCommitted && !previousIsCommitted.current) {
      scale.value = withSequence(
        withSpring(1.14, { damping: 10, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
    }

    previousIsCommitted.current = isCommitted;
  }, [isCommitted, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1, 2, 3],
      colors.background
    ),
    borderColor: interpolateColor(progress.value, [0, 1, 2, 3], colors.border),
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View
      className="h-12 w-12 rounded-lg border"
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  );
}
