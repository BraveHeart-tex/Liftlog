# Haptics Refactor Plan

Status: planned

Goal: add haptic feedback only at meaningful state changes and completion moments. Do not make every tappable control vibrate.

## Principles

- Reuse `expo-haptics`; add no production dependency.
- Trigger feedback after the action succeeds, not when a confirmation dialog opens.
- Prefer semantic helpers for selection, light/medium impact, success, and warning feedback.
- Keep existing stronger rest-timer completion feedback; avoid duplicate feedback.
- Do not add feedback to typing, focus, wheel-picker movement, navigation-only taps, calendar changes, or routine `+30 sec` adjustments.

## Implementation checklist

### Haptic foundation

- [ ] Add or consolidate shared semantic haptic helpers around the existing `expo-haptics` usage.
- [ ] Preserve platform handling already used by navigation and segmented controls.
- [ ] Ensure haptic failures remain non-blocking and are logged consistently.

### Workout lifecycle

- [ ] Add one medium impact after successful blank-workout creation.
- [ ] Add the same feedback after successful template/repeat workout creation.
- [ ] Add the same feedback after successful “discard active workout and start” creation, without double-vibrating the destructive step.
- [ ] Keep resume-only navigation silent.
- [ ] Keep active-workout completion success feedback.

### Rest timer

- [ ] Add light feedback after a valid timer starts.
- [ ] Add light feedback when the compact-widget “Skip” action successfully cancels the timer.
- [ ] Reuse the existing pause/resume/end-rest feedback in the sheet.
- [ ] Keep `+30 sec`, picker movement, and timer completion behavior unchanged unless needed to prevent duplication.

### Set logging and editing

- [ ] Keep light feedback for newly completed sets.
- [ ] Keep success notification feedback for new PRs.
- [ ] Suppress ordinary feedback when updating an already-completed set, unless the update produces a PR.
- [ ] Add one warning/light impact after confirmed persisted-set deletion succeeds.
- [ ] Keep draft-row add/delete and invalid form feedback silent.

### Exercise and template changes

- [ ] Add light feedback after an exercise is successfully added to an active workout.
- [ ] Add light feedback after a custom exercise is successfully created and attached to an active workout.
- [ ] In multi-select exercise pickers, provide feedback once when the final “Add exercises” action commits, not for every pending selection.
- [ ] Add light/medium feedback after active-workout exercise reorder/superset edits save successfully.
- [ ] Add light/medium feedback after template exercise edits save successfully.
- [ ] Add success feedback after standalone custom exercise creation or detail editing succeeds.

### Historical logging

- [ ] Add success notification feedback after a historical workout draft saves.
- [ ] Add success notification feedback after historical workout edits save.
- [ ] Keep navigation into the historical draft/editor silent.

### Destructive actions

- [ ] Add one warning/medium feedback after active workout discard succeeds.
- [ ] Add one warning/medium feedback after completed workout deletion succeeds.
- [ ] Add one warning/medium feedback after set deletion succeeds.
- [ ] Add one warning/medium feedback after custom exercise archive/delete succeeds.
- [ ] Add one warning/medium feedback after template deletion succeeds.
- [ ] Add one warning/medium feedback after rest-timer preset deletion succeeds.
- [ ] Do not trigger feedback when the user cancels, the mutation fails, or the item is already absent.

## Optional follow-up

- [ ] Add selection feedback to the kg/lb choice during onboarding if device testing shows the choice feels under-acknowledged.

## Verification checklist

- [ ] Test every added path on iOS and Android.
- [ ] Verify feedback happens once per successful action.
- [ ] Verify failed saves/deletes do not produce success or warning feedback.
- [ ] Verify confirmation cancellation is silent.
- [ ] Verify PR feedback remains stronger than ordinary set completion.
- [ ] Verify rest-timer completion does not gain an additional duplicate pulse.
- [ ] Verify accessibility, reduced-motion behavior, and offline behavior are unchanged.
- [ ] Run relevant unit/type checks and update the graph with `graphify update .` after implementation changes.

## Primary code areas

- `src/components/ui/pressable-surface.tsx`
- `src/lib/haptics/navigation.haptics.ts`
- `src/features/workouts/hooks/use-workout-start.ts`
- `src/features/workouts/hooks/use-exercise-track-actions.ts`
- `src/features/workouts/components/rest-timer-idle-content.tsx`
- `src/features/workouts/components/rest-timer-widget.tsx`
- `src/features/workouts/components/active-workout-content.tsx`
- `src/features/workouts/components/set-form/use-set-form-controller.ts`
- `src/app/workouts/backfill/[id].tsx`
- `src/app/workouts/edit/[id].tsx`
- `src/app/workouts/[id].tsx`
- `src/app/workouts/templates/[id].tsx`
- `src/app/exercises/[id].tsx`
- `src/app/exercises/new.tsx`
- `src/app/exercises/edit/[id].tsx`
