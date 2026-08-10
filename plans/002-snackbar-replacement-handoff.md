# 002 — Make snackbar replacement interruptible

- **Status**: TODO
- **Commit**: 56c2a2e
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 1 file, shared host/store coordination

## Problem

Snackbar replacement swaps the store message immediately, then resets the
single visual progress value to the hidden state. This cuts off an existing
snackbar during replacement and restarts the new entrance from zero. The
timeout also dismisses through an unkeyed current-message action, so an old
timer must never be able to remove a newer message.

Current code:

```tsx
// src/components/ui/snackbar.tsx:103-115
showSnackbar: options => {
  const currentMessage = get().message;

  set({
    message: {
      id: nextSnackbarId,
      ...options
    }
  });

  if (currentMessage) {
    notifySnackbarDismissed(currentMessage);
  }

  nextSnackbarId += 1;
},
```

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

  const timeoutId = setTimeout(
    dismissSnackbar,
    message.durationMs ?? DEFAULT_SNACKBAR_DURATION_MS
  );
```

## Target

Keep one visible snackbar slot with latest-message-wins semantics:

- Replacement changes the displayed message immediately but preserves the
  current `progress` value instead of forcing a hidden→visible restart.
- The entrance timing retargets from the current progress value. A snackbar
  that is already visible stays visually present; one currently entering or
  exiting continues from its current point.
- A replacement does not inherit a previous drag displacement. Return
  `dragY` to zero with an interruptible spring (or an immediate reset only
  when reduced motion is enabled), never a visible jump.
- Add an id-scoped store action for the auto-dismiss timeout. The timeout for
  message A may dismiss only message A; it must be a no-op after message B
  replaces A.
- Preserve the existing logical callback contract: `onDismiss` fires once when
  the message is replaced or dismissed, not once per visual animation frame.
- A dismiss followed immediately by a new message must retarget the same
  progress value and keep the new message mounted.

Use only transform and opacity for motion. Keep the existing
`MOTION_DURATION_MS.standard` (180ms) and `MOTION_DURATION_MS.exit` (160ms)
unless an on-device feel check proves the existing values fail the under-300ms
budget.

## Repo conventions to follow

- Reuse `MOTION_DURATION_MS` from `src/lib/animations/motion.constants.ts`.
- Keep shared snackbar state in the existing Zustand store at
  `src/components/ui/snackbar.tsx:101-133`.
- Use native-driver `Animated` for this existing shared host, matching the
  current transform/opacity implementation at `src/components/ui/snackbar.tsx:269-282`.
- Keep snackbars anchored with `useSafeAreaInsets`, as required by
  `docs/layout.md`.

## Steps

1. Add an id-scoped dismissal action to the store and use it for the captured
   message timeout. Keep public manual dismissal behavior unchanged.
2. In the host effect, distinguish a new message from the `null → message`
   entrance. For replacement, update `renderedMessage` and animate progress
   toward `1` from its current value; do not call `progress.setValue(0)`.
3. Replace unconditional `dragY.setValue(0)` during replacement with an
   interruptible return to zero; ensure a currently dragged snackbar cannot
   jump when a replacement arrives.
4. Ensure the exit completion callback clears `renderedMessage` only if the
   completed animation still belongs to the message-less state. A newly
   arrived message must remain mounted.
5. Exercise replacement from the rest-timer consumer and ordinary success
   notifications, including replacement during entrance, full visibility,
   drag, and exit.

## Boundaries

- Do NOT queue multiple snackbars or add a second overlay host.
- Do NOT change snackbar copy, variants, placement offset, action layout, or
  accessibility announcement text.
- Do NOT change feature-specific notification producers except for tests or a
  narrowly required id-handling call site.
- Do NOT add dependencies or replace the existing animation library.

## Verification

- **Mechanical**: `pnpm exec eslint src/components/ui/snackbar.tsx` and
  `pnpm exec tsc --noEmit`.
- **Feel check**: trigger snackbars rapidly; confirm replacement never flashes,
  disappears, or restarts from below. Swipe while replacing, release before
  and after the dismiss threshold, and confirm velocity/gesture ownership is
  preserved. Dismiss and immediately show another snackbar; confirm the old
  exit completion and timeout cannot remove the new one.
- **Review**: run `review-animations` against the diff and resolve blockers
  for restart-from-zero motion, non-interruptible drag behavior, or stale
  callbacks.
- **Done when**: replacement is one continuous visible handoff, old timers
  and callbacks cannot affect newer messages, and all movement remains on
  transform/opacity.
