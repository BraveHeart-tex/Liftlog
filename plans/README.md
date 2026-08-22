# Implementation plans

| #   | Plan                                             | Severity | Status |
| --- | ------------------------------------------------ | -------- | ------ |
| 001 | Make BottomSheet dismissal latest-intent safe    | HIGH     | TODO   |
| 002 | Make snackbar replacement interruptible          | HIGH     | TODO   |
| 003 | Respect reduced motion in shared snackbar motion | HIGH     | TODO   |
| 004 | Standardize empty and fallback states            | MEDIUM   | TODO   |
| 005 | Migrate to domain-first folder structure         | ARCH     | TODO   |

## Recommended execution order

1. **001** — independent BottomSheet race fix.
2. **002** — snackbar replacement and stale timeout/callback handoff.
3. **003** — snackbar reduced-motion branch; depends on 002 because both edit
   the shared host effect and gesture return paths.
4. **004** — independent empty-state consistency refactor.
5. Run each plan's verification checklist, including typecheck/lint and the
   focused Android scenarios where applicable.
6. Run `review-animations` against plans 001–003. Resolve every blocker, then
   repeat the Android matrix and mark plans DONE only after physical validation.

## Shared acceptance matrix

- Route transitions remain native-owned; no screen-level route double-entry.
- BottomSheet: gesture dismissal, backdrop dismissal, hardware back, keyboard
  open, safe-area footer, rapid close/reopen.
- Snackbar: entrance, replacement during entrance/visible/exit, drag velocity,
  rejected drag, immediate reopen, stale timeout protection, reduced motion.
- Native `Alert` confirmation behavior remains unchanged.
