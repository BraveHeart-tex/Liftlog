# Reduced motion

LiftLog follows the device's operating-system Reduce Motion accessibility
preference. It does not expose a separate in-app override.

The shared policy lives in
[`use-reduced-motion.hook.ts`](../src/lib/animations/use-reduced-motion.hook.ts).
It wraps Reanimated's live `useReducedMotion()` value, so changes made while
the app is running must take effect immediately.

## Policy

When reduced motion is enabled:

- Disable non-essential enter, exit, layout, press, spring, and timing motion.
- Set animated values directly to their latest state instead of interpolating.
- Stop decorative or infinite loops such as shimmer and pulse effects; render a
  static status treatment instead.
- Use immediate native-stack navigation transitions (`animation: 'none'`).
- Pass `ReduceMotion.Always` to the shared bottom-sheet wrapper. Preserve direct
  sheet gestures and dragging.
- Use `animated: false` for programmatic scrolling.
- Set reorderable-list animation duration to `0` and remove active-item motion.
- Keep functional updates running. Timers, data refreshes, and progress values
  continue, but their visual values snap to the current state.
- Keep loading and accessibility status visible without an animated spinner.

When reduced motion is disabled, preserve the existing motion and durations.

## Implementation rules

1. Import `useReducedMotion` from the shared local hook for custom motion and
   React Native `Animated` code. Do not read `AccessibilityInfo` separately at
   a call site.
2. For Reanimated entering/exiting transitions, either conditionally omit the
   transition or use `.reduceMotion(ReduceMotion.System)` when the system policy
   is sufficient.
3. For timing or spring assignments, use a direct assignment in the reduced
   branch:

   ```ts
   value.value = reduceMotion
     ? nextValue
     : withTiming(nextValue, { duration: MOTION_DURATION_MS.standard });
   ```

4. Include the preference in effects and callbacks that start motion. If the
   preference changes during an animation, stop/cancel the animation and snap
   to the current value.
5. Preserve the interaction and information conveyed by the motion. Reduced
   motion changes presentation, not navigation, gestures, timers, loading
   state, or data behavior.

## Audit checklist

Before merging a new animated or transitioning surface, check:

- [ ] Does it use the shared reduced-motion hook or `ReduceMotion.System`?
- [ ] Are enter/exit/layout and press transitions omitted or made immediate?
- [ ] Are loops and spinners replaced by static feedback?
- [ ] Are programmatic scrolls immediate?
- [ ] Does a runtime preference change stop active motion cleanly?
- [ ] Are user gestures and functional updates preserved?

Useful audit searches:

```sh
rg -n "Animated\\.|withTiming|withSpring|withRepeat|entering=|exiting=|layout=|animation:|animated: true|animationDuration" src
rg -n "useReducedMotion|ReduceMotion.System|ReduceMotion.Always" src
```

The shared implementations to inspect first are
[`bottom-sheet.tsx`](../src/components/ui/bottom-sheet.tsx),
[`snackbar.tsx`](../src/components/ui/snackbar.tsx),
[`reorderable-list.tsx`](../src/components/ui/reorderable-list.tsx), and
[`activity-indicator.tsx`](../src/components/styled/activity-indicator.tsx).
