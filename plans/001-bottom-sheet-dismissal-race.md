# 001 — Make BottomSheet dismissal latest-intent safe

- **Status**: TODO
- **Commit**: 56c2a2e
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 1 file, small shared-primitive change

## Problem

`BottomSheet` uses a controlled `isOpen` prop, but every native dismissal calls
`onClose` without checking whether a newer open intent superseded that
dismissal. A fast close/reopen can therefore receive the old `onDismiss` after
the sheet is visible again and close the newly reopened sheet.

Current code:

```tsx
// src/components/ui/bottom-sheet.tsx:113-117
const handleDismiss = useCallback(() => {
  setIsContentReady(false);
  Keyboard.dismiss();
  onClose();
}, [onClose]);
```

```tsx
// src/components/ui/bottom-sheet.tsx:146-155
useEffect(() => {
  if (isOpen) {
    sheetRef.current?.present();

    return;
  }

  setIsContentReady(false);
  sheetRef.current?.dismiss();
}, [isOpen]);
```

The same callback is used for gesture/backdrop/hardware dismissal through the
native modal, so a fix must preserve user-driven close behavior and keyboard
cleanup.

## Target

Use a small ref-based dismissal-intent guard in this primitive:

- Every controlled `isOpen=false` transition records a dismissal in flight.
- If `isOpen=true` arrives before that dismissal callback, mark the old
  dismissal superseded and present the sheet.
- The callback for a superseded dismissal clears its stale bookkeeping and
  does not call `onClose`.
- A dismissal initiated by the user while no controlled dismissal is in flight
  still calls `onClose`, so pan-down, backdrop, and hardware back continue to
  update the parent state.
- `Keyboard.dismiss()` and `setIsContentReady(false)` still run exactly once
  for the actual dismissal callback.
- Do not add a timer, debounce, animation replacement, or dependency.

The guard must be generation- or in-flight-based, not only `if (isOpen)` in
`handleDismiss`; an old native callback can arrive after a new `present()` and
would otherwise look like a current user dismissal.

## Repo conventions to follow

- Keep the parent as the source of truth for controlled visibility, matching
  `isOpen` and `onClose` in `src/components/ui/bottom-sheet.tsx:36-48`.
- Use React refs for native callback coordination, as this component already
  uses `useRef` for `BottomSheetModal` at `src/components/ui/bottom-sheet.tsx:93`.
- Preserve the existing Gorhom props and keyboard configuration documented in
  `docs/bottom-sheet.md`.

## Steps

1. Add refs beside `sheetRef` to track whether a controlled dismissal is in
   flight and whether it was superseded by a reopen. Keep them outside render
   state so native callbacks read current coordination state.
2. In the `isOpen` effect, record a controlled dismissal immediately before
   `dismiss()`. On an open transition, clear/supersede that controlled
   dismissal before calling `present()`.
3. Update `handleDismiss` to ignore only the stale callback from a superseded
   controlled dismissal. For a current controlled dismissal or user-driven
   native dismissal, preserve the existing cleanup and call `onClose()`.
4. Verify that repeated `false → true → false` changes do not leave the
   bookkeeping stuck and that a normal pan/backdrop/hardware close still
   reaches `onClose` exactly once.

## Boundaries

- Do NOT change sheet snap points, keyboard behavior, safe-area classes,
  backdrop opacity, gesture thresholds, or Gorhom configuration.
- Do NOT change any feature-specific sheet consumer.
- Do NOT add dependencies or introduce a global overlay coordinator.

## Verification

- **Mechanical**: `pnpm exec eslint src/components/ui/bottom-sheet.tsx` and
  `pnpm exec tsc --noEmit`.
- **Feel check**: on Android, open a sheet, dismiss it, immediately reopen it,
  and confirm the reopened sheet stays open and its content does not jump.
  Repeat with backdrop tap, pan-down, and hardware back. Open a keyboard sheet
  and confirm dismissal still hides the keyboard and restores the parent
  layout.
- **Review**: run `review-animations` against the diff. Resolve any finding
  involving interruption, gesture ownership, reduced motion, or stale native
  callbacks before marking DONE.
- **Done when**: no stale close occurs during rapid reopen, normal native
  dismissal still updates controlled state, and keyboard/safe-area behavior is
  unchanged.
