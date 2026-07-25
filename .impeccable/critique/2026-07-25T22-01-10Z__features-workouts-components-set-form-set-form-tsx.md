---
target: Exercise Set Form screenshots
total_score: 29
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-07-25T22-01-10Z
slug: features-workouts-components-set-form-set-form-tsx
---

# Exercise Set Form critique

## Overall verdict

Conditional pass. The short-state form is clear, tactile, and recognizably LiftLog, but it stops meeting the “minimal attention” goal as sets accumulate. The main risks are color-dependent save state, repeated manual entry, and loss of the next action in long lists.

## Usability issues

1. **P1 — Committed and uncommitted rows are distinguished mainly by color**
   - Evidence: `set-form-commited.png` and `set-form-uncommitted.png` keep the same values, fields, geometry, and checkmark; green versus orange carries the state.
   - Smallest correction: add one persistent non-color state cue and make the committed check read as status rather than the same save action.
   - Impact: fewer missed saves and fewer redundant attempts to commit an already logged set.

2. **P1 — Repeated sets require avoidable re-entry**
   - Evidence: `set-form-many-sets.png` shows previous-session values for rows 2–4, but each KG and REPS field starts at 0.
   - Smallest correction: prefill a new row with the most relevant known values while keeping both fields editable.
   - Impact: fewer taps, less transcription, and faster logging under fatigue.

3. **P1 — The long-list layout pushes the logging loop out of view**
   - Evidence: `set-form-many-sets.png` fits only a few complete rows; set 5 is cut by the bottom navigation and Add Set is below the viewport.
   - Smallest correction: ensure the last editable row and Add Set can clear the fixed navigation, and remove only excess vertical space from repeated rows.
   - Impact: less scroll hunting and lower late-workout logging friction.

4. **P2 — Swipe actions are taught conditionally and too late**
   - Evidence: the hint appears in `set-form-commited.png`, is absent from `set-form-uncommitted.png`, and falls below the visible list in `set-form-many-sets.png`; only `set-form-swipable-actions.png` exposes copy/delete.
   - Smallest correction: teach the gesture at the first swipeable row and keep that teaching available before it can fall below a long list.
   - Impact: more users discover copy/delete without trial-and-error.

5. **P2 — Add Set remains equally prominent while the current row is unsaved**
   - Evidence: `set-form-uncommitted.png` presents a normal full-width Add Set immediately below the orange pending row.
   - Smallest correction: make the relationship explicit by subordinating Add Set until the row is logged or clarifying what Add Set does to the pending row.
   - Impact: less hesitation and fewer incomplete or duplicate rows.

## Stylistic preference

6. **P3 — Large container curvature is softer than LiftLog’s approved language**
   - Evidence: the history capsule and large rounded set/empty-state containers across the screenshots feel softer than the controlled, equipment-like radii in the design language.
   - Smallest correction: modestly normalize only the large-container radii.
   - Impact: stronger brand consistency; negligible task-efficiency change.

## What is already working

The exercise → history/suggestion → current-set hierarchy is strong. Set values dominate each row while “Previous” stays secondary. The empty state is useful, explains the next step, and gives one unmistakable primary action. Swipe actions themselves are large, separated, and semantically colored once revealed.
