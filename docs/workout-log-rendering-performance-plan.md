# Log Screen Rendering Performance Plan

## Objective

Make switching between Workouts and Steps on the Android log screen feel immediate by removing JS-thread work from the transition, avoiding duplicate step synchronization, and reducing repeated mount/render cost.

Implement in order. Phase 1 gates the optimization work; Phases 2–3 address the likely primary causes; Phases 4–5 are profiling-gated secondary work.

## Scope

- `src/app/(tabs)/log/index.tsx`
- `src/features/steps/hooks/use-steps-screen.ts`
- `src/features/steps/health-connect.service.ts`
- `src/features/steps/components/steps-sync-host.tsx`
- `src/features/steps/steps.repository.ts`
- `src/lib/db/use-live-with-fallback.hook.ts`
- `src/lib/utils/schedule-idle-task.utils.ts`
- `src/features/workout-log/components/workout-log-calendar.tsx`
- `src/features/workout-log/calendar/*`

No new production dependencies. Do not change schema or generated files.

## Phase 1 — Baseline and attribution

- Measure Workouts → Steps and Steps → Workouts in an Android release/dev-client build.
- Capture JS/UI frame timing for repeated switches, including the first switch after app launch and rapid repeated switches.
- Correlate existing database spans for:
  - `steps.getRecentStepDays`
  - `steps.saveSyncResult`
  - `workoutLog.getCompletedWorkoutCount`
  - `workoutLog.getCompletedWorkoutsForDate`
- Confirm whether `requestIdleCallback` exists in the target React Native runtime.
- Record baseline goals:
  - no visible transition stall attributable to a synchronous database read;
  - no duplicate Health Connect sync for one segment selection;
  - no sustained JS frame drop after the selected content becomes visible.

### Observed baseline

- `requestIdleCallback` exists in the target Android runtime.
- The first observed Workouts mount stalled the JS thread for about 6.07s:
  the first JS frame arrived at 6074.52ms and only one JS frame was observed.
- Steps switches produced first-JS-frame delays of 246–375ms across six runs.
- Repeated Workouts switches produced first-JS-frame delays of 42–541ms after the cold mount.
- No `ui-frame-summary` entries were emitted, so UI-thread frame timing is not
  available from this run. The JS frame results establish a visible JS-thread
  stall, but do not by themselves identify the responsible database operation.
- The supplied logs do not include the database spans or Health Connect sync
  owner logs, so synchronous-read attribution and duplicate-sync status remain
  unconfirmed.

### Phase-gating decision

- Proceed with Phase 2: the repeated 246–375ms Steps delays justify removing
  the Steps mount-time synchronous read.
- Keep Phase 3 attribution-gated until the database spans and sync-owner logs
  are captured for the same switches.
- Profile the Workouts calendar mount as a Phase 4 candidate: the cold 6.07s
  stall and repeated 42–541ms delays are consistent with substantial remount
  work, but the current run does not isolate calendar cost.

## Phase 2 — Remove mount-time blocking work

### Steps data read

- Change the Steps live query to use the same deferred initial-read strategy as the workout queries.
- Keep the initial render on the existing loading state or a safe fallback; load the recent rows after the segment transition/interaction completes.
- Ensure the live subscription is still installed immediately and that database updates replace the fallback data correctly.
- Verify that `query.all()` is no longer reachable during `StepsContent` render.

### Deferred-work fallback

- Confirm whether the existing `requestIdleCallback` path is available and lands after the segment interaction. Only change the `setTimeout(0)` fallback if profiling shows it runs during the transition; use existing React Native APIs and do not add a dependency.
- Preserve cancellation when the segment is switched away before the deferred read runs.
- Keep this change generic to `scheduleIdleTask`; do not add a dependency.

### Verification

- Switch to Steps with 0, 7, and 31 stored step rows.
- Confirm the first frame shows promptly and the data arrives after the transition.
- Confirm switching away cancels deferred work and does not leave subscriptions active.

## Phase 3 — Deduplicate and defer Health Connect work

- Choose one owner for automatic synchronization. Prefer the app-level `StepsSyncHost` for launch/background refresh and make the screen consume stored data plus status; retain screen refresh only when data is stale or the user explicitly requests it.
- Remove the independent `refreshStatus()` call when `syncSteps()` already performs that work.
- Avoid repeated availability and permission initialization within a single sync by reusing the resolved status.
- If both host and screen paths remain necessary, add a single-flight guard so an in-flight sync is reused rather than started again.
- Keep the Health Connect/native work outside the segment interaction using the existing idle/interaction scheduling approach.
- Keep `saveStepSyncResult()` atomic, but ensure its synchronous transaction is not on the initial segment-switch critical path where possible.
- Add cancellation/ownership guards so a screen that unmounts during a shared sync does not continue setting screen-local state unnecessarily. A shared sync may finish and persist data.

### Verification

- With Health Connect available and permissions granted, switch to Steps repeatedly and confirm only one automatic sync is active.
- Confirm no duplicate `steps.saveSyncResult` transactions occur for a single event.
- Test unavailable Health Connect, denied permissions, first connection, stale data, and manual Refresh.
- Confirm step data remains current after returning to the screen.

## Phase 4 — Reduce repeated workout calendar mount cost

Implement only if Phase 1 profiling shows calendar mount work materially contributes to Steps → Workouts latency.

- Avoid rebuilding the full 13-month calendar model during the critical transition; cache deterministic month data or build it after the transition.
- Reduce the initial calendar render window to the minimum needed for the current page while preserving horizontal paging behavior.
- Avoid creating Reanimated selection state/effects for calendar days that cannot be selected or do not need an animation.
- Preserve selected-day animation and accessibility behavior.
- Consider retaining the already-mounted log views only if profiling shows remounting dominates and the memory/subscription cost is acceptable. Do not keep duplicate live queries active without measurement.

### Verification

- Confirm current-month positioning, horizontal paging, marks, date selection, disabled future dates, and reduced-motion behavior.
- Compare cold and repeated Workouts mounts after the change.
- Check memory and live-query subscription counts when switching repeatedly.

## Phase 5 — Remove animation-driven JS rerenders

Implement only if profiling shows the Steps header contributes to the switch stall.

- In `TodayStepRadialCard`, keep the radial progress animation on the UI thread and avoid calling `runOnJS(setDisplayedSteps)` for every animated value change.
- Use a static/initial display value or update the displayed text at a bounded cadence/end-of-animation while preserving the visual animation.
- Keep the chart’s reduced/compact states and accessibility text unchanged.
- Avoid repeated derived work in `StepsContent`: compute the display order once from the query result, rather than sorting the same bounded array in both the hook and component.

### Verification

- Confirm the radial animation remains smooth and the displayed count reaches the final synced value.
- Compare JS render counts during Steps mount with and without today’s radial card.
- Confirm zero, partial, and goal-exceeded progress states.

## Cross-phase risks and decisions

- Do not keep both log subtrees mounted by default. That may preserve UI state, but it also keeps live subscriptions and native work alive; consider it only if profiling proves remount cost dominates after Phases 2–3.
- Do not change database schema, generated files, or add production dependencies.
- Preserve loading, empty, unavailable, refresh, calendar, reduced-motion, and accessibility behavior.
- If profiling shows no material gain from a phase, stop that phase and keep the smaller change set.

## Acceptance criteria

- Segment switching does not perform synchronous SQLite reads during render.
- Automatic Health Connect work is not duplicated by the screen and app-level host.
- Repeated switching does not accumulate subscriptions, pending scheduled reads, or sync transactions.
- The radial chart does not produce per-frame JS state updates during its entrance animation.
- The selected view remains functionally identical, including loading, empty, unavailable, refresh, calendar, and accessibility states.
- Android profiling shows the primary switch path no longer contains a user-visible JS-thread stall.

## Checks after implementation

- `pnpm test`
- `pnpm run ts-check`
- `pnpm run lint`
- `pnpm run prettier:check`
- `graphify update .`
