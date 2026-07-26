---
target: Exercise History screen
total_score: 21
max_score: 36
na_heuristics: 5
p0_count: 0
p1_count: 4
timestamp: 2026-07-26T20-26-44Z
slug: abs-workout-exercise-workoutexerciseid-history-tsx
---

# Exercise History Critique

## Design Health Score

| #         | Heuristic                       |     Score | Key issue                                                                                       |
| --------- | ------------------------------- | --------: | ----------------------------------------------------------------------------------------------- |
| 1         | Visibility of system status     |         2 | Loading and empty states are clear; the 20-session cutoff is invisible.                         |
| 2         | Match system / real world       |         2 | Lifting vocabulary is strong; “from last month” hides a rolling best-score comparison.          |
| 3         | User control and freedom        |         2 | Native back works, but older history beyond the cap is unreachable.                             |
| 4         | Consistency and standards       |         3 | Shared native primitives and tokens are used consistently; the page composition overuses cards. |
| 5         | Error prevention                |       n/a | Read-only surface with no user input or destructive action.                                     |
| 6         | Recognition rather than recall  |         2 | Dates, set values, and PR badges are visible, but cross-session comparison relies on memory.    |
| 7         | Flexibility and efficiency      |         2 | FlashList scroll is efficient; locating an older session is not.                                |
| 8         | Aesthetic and minimalist design |         2 | Calm and restrained, but repeated card chrome crowds out history.                               |
| 9         | Error recovery                  |         2 | Missing-exercise recovery exists; query failure is not distinguished from no data.              |
| 10        | Help and documentation          |         2 | Ordinary history needs no help, but Progression needs clearer meaning.                          |
| **Total** |                                 | **21/36** | **Needs focused refinement**                                                                    |

## Design Specificity Verdict

The content is LiftLog-specific, but the composition is category-interchangeable: two equal analytics cards followed by a stack of rounded cards. It reads as a generic analytics feed containing lifting data, not yet as a focused training ledger.

The deterministic scan returned zero findings. That is credible for the rules it checks: the implementation uses semantic tokens, shared React Native primitives, native navigation, and FlashList. It does not invalidate the visual and product problems, which are primarily hierarchy, density, labeling, and data reach.

Live Android inspection on a Pixel 4 emulator confirmed that the Progression value truncates in the two-column summary and that the populated list scrolls and renders cleanly. No browser overlay applies to this native surface.

## Overall Impression

The screen is calm, readable, and functionally grounded, with good native fundamentals. Its biggest opportunity is to stop presenting every unit of information as an independent card and reorganize the same data into a compact, column-stable ledger.

## What Is Working

- The exercise identity is immediate, recent status is placed before history, and chronology is clear.
- Repeated identical sets are compressed without merging across PR boundaries, preserving both density and PR meaning.
- Set formatting is concise, PR badges are visible, semantic progress colors are already tokenized, and the virtualized list is appropriate for a long native history.
- Loading, empty, and missing-exercise states exist, and the adaptive implementation uses shared primitives rather than platform forks.

## AI-Slop Verdict

**Mild AI-slop signature, not a slop implementation.** The source is disciplined; the visual composition is the problem. Two equal stat cards plus one rounded bordered card per session is the familiar “analytics card stack” default. Repeated tonal surfaces and generous card padding make the screen feel assembled from generic dashboard blocks instead of authored around the act of comparing training sessions.

## Priority Issues

### P1 — The history is not a complete history

**Why it matters:** The data hook silently limits the screen to 20 sessions. A long-term lifter cannot find an older workout and receives no indication that anything is missing. This conflicts with local ownership and the primary user job.

**Fix:** Replace the fixed visible cap with incremental pagination/load-more while retaining FlashList, chronological order, and all calculations. Do not render the whole database at once.

**Suggested command:** `$impeccable optimize`

### P1 — Session cards obstruct comparison and waste the viewport

**Why it matters:** Every date is wrapped in a rounded, bordered, padded card and every set group adds another divider. The repeated chrome reduces visible history and makes dates, indexes, values, and PR states behave like separate mini-layouts rather than stable ledger columns.

**Fix:** Use a flat session section: date and compact metadata on one header row, followed by aligned set rows, with a single quiet separator between sessions. Reserve tonal fill for the top summary only. Keep 16px screen gutters and four-point spacing.

**Suggested command:** `$impeccable distill`

### P1 — The screen omits per-session total work

**Why it matters:** Users cannot answer how much work a session contained without mental arithmetic. LiftLog already computes and formats weight × reps volume in `WorkoutExerciseSummary`, so this is an existing product concept, not a new metric.

**Fix:** Reuse that existing session-total presentation for weight/reps and place it in the session header metadata. Keep other tracking types unchanged rather than inventing substitute metrics.

**Suggested command:** `$impeccable clarify`

### P1 — The summary hierarchy and Progression copy fail on Android

**Why it matters:** Latest PR and Progression receive equal card weight even when one has no data, while the more verbose Progression value visibly truncates (`+54.3 kg from la...`) on the inspected Android viewport. The label also describes rolling best-score windows as “last month,” which is not self-evident.

**Fix:** Replace the two equal cards with one compact two-row summary block or stacked summary strip. Put labels first, allow values to occupy the full remaining width, and never truncate the numeric result. Clarify the existing calculation in compact copy without changing it.

**Suggested command:** `$impeccable layout`

### P2 — Group labels are internally correct but externally ambiguous

**Why it matters:** A repeated group is labeled “3 sets,” while a mixed singleton is labeled “4.” The left column changes meaning from count to index, and the session header already says “N sets.” Mixed sessions therefore require interpretation, and grouped sets do not reveal which positions were grouped.

**Fix:** Use stable positional labels: `1`, `2–4`, `5`. Keep the overall count once in the session header beside total work. Right-align numeric performance values in a consistent column and keep the PR badge in a fixed slot adjacent to the value.

**Suggested command:** `$impeccable typeset`

## Persona Red Flags

- **Progressive-overload lifter:** The latest sets are available, but comparing sessions requires memorizing vertically separated numbers; session workload is absent and the progression label obscures its baseline.
- **Long-term lifter:** Scrolling ends after 20 sessions with no explanation or continuation, so an older workout appears to have vanished.
- **Large-text Android user:** Summary values have insufficient width and already truncate at the current type size; the shared Text primitive also disables font scaling, making this dense numeric surface less adaptable.

## Minor Observations

- The route header plus a separate large exercise-name block spends valuable first-viewport height; the deep-screen title and exercise identity should feel like one hierarchy.
- Dates omit the year, which becomes ambiguous when full older history is reachable.
- The amber star treats Latest PR like a warning/reward decoration. PR is successful performance and should use restrained Rep Green; Ignition Orange should remain reserved for action or meaningful active progress, not ambient card decoration.
- Positive, neutral, and downward progression colors correctly use the semantic progress token family rather than arbitrary orange.
- `Intl.DateTimeFormat` is recreated per rendered entry; cache it at module scope. The current 20-item cap bounds the cost, but pagination makes the cleanup worthwhile.
- The route subscribes to a broad active-workout detail hook even though it only needs exercise identity; a narrower query would reduce unrelated live-query work and re-render triggers.

## Product Decisions

1. Should “Progression” keep its current rolling 30-day best-score calculation and receive precise copy, or should its product meaning be calendar-month based? **Recommendation: keep the calculation and clarify the copy in this scoped pass.**
2. Should a session PR marker mean “at least one PR set occurred” in the session header as well as on the exact row? **Recommendation: keep exact row badges only unless testing shows PR discovery remains slow after the ledger compaction.**

## Recommended Design Direction

Build a **flat training ledger**. Keep the exercise name as the identity anchor, compress Latest PR and Progression into one quiet full-width status band, then render each workout as a border-separated session section rather than a card. Each session header should expose date, one set count, and the already-established total-work value. Beneath it, use stable columns for set position, performance, and PR state. Identical consecutive sets become ranges (`1–3`), while mixed sets remain individual or grouped consecutive ranges. This preserves every datum and calculation while making more history visible and comparison substantially faster.

This direction follows Flat Until Floating, Tonal Structure, Functional Curve, Weight Before Size, and Four-Point Rhythm. Rep Green communicates PR/success; progress tokens communicate direction; Ignition Orange is not introduced where there is no action.

## Narrow Implementation Sequence

1. Add focused presentation tests for mixed sets, repeated identical sets, PR-boundary grouping, narrow progression text, date year behavior, and session totals.
2. Change display labels from count/index ambiguity to positional ranges while preserving grouping and PR boundaries.
3. Refactor only `ExerciseHistoryList` and its directly owned summary/session markup into the status band plus flat session ledger; reuse existing Text, Icon, semantic tokens, and volume formatter.
4. Replace the 20-item cutoff with paged history loading through the existing repository/list layers; keep FlashList and add a quiet loading/end state.
5. Narrow the route’s exercise-identity query, cache the date formatter, and verify populated, loading, empty, missing, light/dark, Android/iOS, font-scale, and long-history cases.

## Questions to Consider

- If the list stopped after 20 workouts today, would a user interpret that as “all my data” or “the app lost my data”?
- Can the top summary earn its height when progression is unavailable, or should the history begin sooner?
- Does a positional range such as `1–3` communicate repeated sets faster than repeating the word “sets” in both the session header and row?
