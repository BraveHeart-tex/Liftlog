# 003 — Respect reduced motion in shared snackbar motion

- **Status**: TODO
- **Commit**: 56c2a2e
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1 file, shared host motion branch

## Problem

The shared snackbar always animates a 12px entrance/exit translation and uses a
spring to restore a rejected drag. The project already uses Reanimated’s
`useReducedMotion` in shared interaction primitives, but `SnackbarHost` does
not read the preference.

Current code:

```tsx
// src/components/ui/snackbar.tsx:213-237
useEffect(() => {
  progress.stopAnimation();

  if (!message) {
    Animated.timing(progress, {
      toValue: 0,
      duration: MOTION_DURATION_MS.exit,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && !useSnackbarStore.getState().message) {
        setRenderedMessage(null);
      }
    });

    return;
  }

  setRenderedMessage(message);
  progress.setValue(0);
  dragY.setValue(0);
  Animated.timing(progress, {
    toValue: 1,
    duration: MOTION_DURATION_MS.standard,
    useNativeDriver: true
  }).start();
```

```tsx
// src/components/ui/snackbar.tsx:269-282
transform: [
  {
    translateY: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 0]
    })
  },
  { translateY: dragY }
];
```

```tsx
// src/components/ui/snackbar.tsx:170-175
Animated.spring(dragY, {
  toValue: 0,
  damping: 18,
  stiffness: 220,
  useNativeDriver: true
}).start();
```

## Target

Use `useReducedMotion()` in `SnackbarHost` and branch only the incidental
motion:

- Keep the existing opacity transition and announcement behavior.
- Under reduced motion, set the entrance interpolation’s translateY output to
  `[0, 0]`; do not animate the snackbar into position.
- Under reduced motion, snap a rejected drag back to zero instead of running
  the spring. Direct finger tracking and swipe-to-dismiss remain functional.
- Keep normal motion unchanged: 12px entrance translation, native-driver
  transform/opacity, and the existing damping/stiffness spring.
- If the preference changes while a snackbar is visible, stop the current
  animation and retarget without a jump; the next state transition must honor
  the new preference.

Reduced motion means gentler motion, not removal of useful feedback: retain
opacity and accessibility announcements, and do not disable dismissal.

## Repo conventions to follow

- Import and call `useReducedMotion` from `react-native-reanimated`, matching
  `src/lib/animations/use-press-scale.hook.tsx:4-16`.
- Reuse `MOTION_DURATION_MS` rather than adding a second duration scale.
- Keep all animated properties on the native driver and limit motion changes to
  `transform` and `opacity`.

## Steps

1. Add `const reduceMotion = useReducedMotion()` to `SnackbarHost`.
2. Thread `reduceMotion` through the host’s entrance/exit and replacement
   effect so animated opacity remains, while translation is zeroed for reduced
   motion and current animations are stopped safely when the preference flips.
3. Branch both spring-return sites (`onPanResponderRelease` rejection and
   `onPanResponderTerminate`) so reduced motion snaps `dragY` to zero and
   normal motion retains the current spring config.
4. Confirm that the replacement handoff from plan 002 does not reintroduce
   translation or a spring when reduced motion is enabled.

## Boundaries

- Do NOT disable opacity, announcements, direct drag tracking, or dismissal.
- Do NOT override Gorhom BottomSheet’s system reduced-motion behavior.
- Do NOT modify pressable feedback, feature-specific animations, route
  transitions, dialogs, or action-sheet consumers.
- Do NOT add dependencies or a new motion abstraction.

## Verification

- **Mechanical**: `pnpm exec eslint src/components/ui/snackbar.tsx` and
  `pnpm exec tsc --noEmit`.
- **Feel check**: enable Android reduced motion, show/dismiss/replace a
  snackbar, reject a partial drag, and verify there is no entrance translation
  or spring rebound while opacity remains understandable. Disable reduced
  motion and confirm normal movement returns.
- **Review**: run `review-animations` against the diff. Resolve any
  accessibility, interruptibility, or non-GPU-motion blocker.
- **Done when**: reduced motion removes incidental movement without breaking
  gesture semantics, announcements, safe-area placement, replacement, or
  dismissal.
