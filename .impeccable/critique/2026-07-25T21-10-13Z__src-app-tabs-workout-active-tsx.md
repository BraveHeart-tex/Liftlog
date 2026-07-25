---
target: Complete Active Workout experience
total_score: 32
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-07-25T21-10-13Z
slug: src-app-tabs-workout-active-tsx
---

## Overall implementation verdict

Conditional pass. The Active Workout experience is visually coherent across the supplied active, long, and rest states. The stable header-card-footer hierarchy, 16px gutters, card cadence, and bounded timer expansion read as one system. Two P1 state-integrity defects and one P2 temporary-state defect prevent a fully final verdict.

## Findings

### P1 — Management Mode removals bypass Cancel

- Screenshot evidence: Management Mode presents Cancel/Save as a commit boundary while exercise rows expose destructive removal.
- Smallest viable correction: Keep removals in the same draft as reorder and superset edits, then commit them only on Save.
- Expected user impact: Prevents irreversible exercise and logged-set loss after a user explicitly taps Cancel.

### P1 — Terminal workout transitions leave the rest timer alive

- Screenshot evidence: The rest-timer state shows Rest 00:25 and Finish simultaneously; Discard remains available through workout actions.
- Smallest viable correction: On successful Finish, Discard, or Replace, cancel only a timer whose context belongs to the outgoing workout before navigation.
- Expected user impact: Prevents stale post-workout alarms, snackbars, and notification routing after the session no longer exists.

### P2 — Management Mode hides a still-running rest timer

- Screenshot evidence: The blue timer strip is persistent in the rest state but absent in Management Mode even though the countdown continues globally.
- Smallest viable correction: Preserve the existing timer widget in its current bottom strip during Management Mode; hide only Add and Finish.
- Expected user impact: Keeps countdown visibility and Skip/+30 access while users briefly reorder or manage supersets.
