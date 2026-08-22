# Reduced motion

Read this when adding or changing animation, transitions, loading indicators, gestures, programmatic scrolling, or native-stack navigation animation.

LiftLog follows the device operating system's Reduce Motion preference and has no separate in-app override. The policy is centralized in [`use-reduced-motion.hook.ts`](../src/lib/animations/use-reduced-motion.hook.ts), which wraps Reanimated's live `useReducedMotion()` value so runtime preference changes apply immediately.

## Policy

When reduced motion is enabled:

- Disable non-essential enter, exit, layout, press, spring, and timing motion.
- Assign animated values directly to their latest state instead of interpolating.
- Render shimmer, pulse, and other decorative or infinite loops as static status treatments.
- Use immediate native-stack transitions with `animation: 'none'`.
- Pass `ReduceMotion.Always` to the shared bottom-sheet wrapper while preserving sheet gestures and dragging.
- Use `animated: false` for programmatic scrolling.
- Set reorderable-list animation duration to `0` and remove active-item motion.
- Keep timers, data refreshes, progress values, loading status, and accessibility status working and visible; their visual values snap to the current state.

When reduced motion is disabled, preserve the existing motion and durations.

## Implementation

1. Import `useReducedMotion` from the shared local hook for custom motion and React Native `Animated` code. Call sites do not read `AccessibilityInfo` separately.
2. For Reanimated entering, exiting, or layout transitions, omit the transition conditionally or use `.reduceMotion(ReduceMotion.System)` when the system policy is sufficient.
3. For timing or spring assignments, make the reduced branch direct:

   ```ts
   value.value = reduceMotion
     ? nextValue
     : withTiming(nextValue, { duration: MOTION_DURATION_MS.standard });
   ```

4. Include the preference in effects and callbacks that start motion. If it changes during an animation, stop or cancel the animation and snap to the current value.
5. Preserve what the motion communicates. Reduced motion changes presentation, not navigation, gestures, timers, loading state, or data behavior.

## Merge checklist

- [ ] Shared `useReducedMotion` or `ReduceMotion.System` is used.
- [ ] Enter, exit, layout, and press transitions are omitted or immediate.
- [ ] Loops and spinners have static feedback.
- [ ] Programmatic scrolling is immediate.
- [ ] A runtime preference change stops active motion cleanly.
- [ ] Gestures and functional updates remain intact.

Useful searches:

```sh
rg -n "Animated\\.|withTiming|withSpring|withRepeat|entering=|exiting=|layout=|animation:|animated: true|animationDuration" src
rg -n "useReducedMotion|ReduceMotion.System|ReduceMotion.Always" src
```

Inspect these shared implementations first: [`bottom-sheet.tsx`](../src/components/ui/bottom-sheet.tsx), [`snackbar.tsx`](../src/components/ui/snackbar.tsx), [`reorderable-list.tsx`](../src/components/ui/reorderable-list.tsx), and [`activity-indicator.tsx`](../src/components/styled/activity-indicator.tsx).
