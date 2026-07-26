---
target: Exercise Details screen
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
timestamp: 2026-07-26T19-52-50Z
slug: src-app-exercises-id-tsx
---

# Exercise Details critique

## Design Health Score

| #         | Heuristic                       |     Score | Key issue                                                                                |
| --------- | ------------------------------- | --------: | ---------------------------------------------------------------------------------------- |
| 1         | Visibility of system status     |         3 | Loading, empty, latest, and selected states exist; no explicit current/trend conclusion. |
| 2         | Match system / real world       |         3 | Set notation and muscle terms are natural; order does not match the lifter's questions.  |
| 3         | User control and freedom        |         3 | Native back, chart scrubbing, and guarded custom actions are sound.                      |
| 4         | Consistency and standards       |         3 | Token and navigation usage is cohesive; tiny fixed chart text weakens Android fit.       |
| 5         | Error prevention                |         3 | Destructive actions are confirmed; the read-only surface carries little action risk.     |
| 6         | Recognition rather than recall  |         2 | Latest and best values are separated by more than a viewport.                            |
| 7         | Flexibility and efficiency      |         2 | Scrubbing is useful, but fast status checking requires long scrolling and comparison.    |
| 8         | Aesthetic and minimalist design |         1 | Equal cards, repeated best-set facts, and oversized chart chrome create excess travel.   |
| 9         | Error recognition/recovery      |         3 | Action failures are plain-language and recoverable.                                      |
| 10        | Help and documentation          |         2 | The score basis is stated; Est. 1RM remains terse for unfamiliar users.                  |
| **Total** |                                 | **25/40** | **Acceptable; significant information-design work needed.**                              |

## Design Specificity Verdict

**AI-slop verdict: moderate.** The slop is structural, not decorative: exercise identity followed by four same-weight bordered cards, a large line chart, summary rows, ranked rows, and badges. Back Squat, Est. 1RM, and muscle classification make the content specific to LiftLog; the composition could otherwise serve finance, running, or sales analytics. It follows the palette and component vocabulary but does not yet feel like a focused training instrument.

The deterministic scan returned zero findings. That is credible for mechanical style rules, but it does not evaluate hierarchy, duplicated information, vertical composition, or native readability. No false positives were present.

## Overall Impression

The screen is trustworthy, complete, and restrained. Its biggest opportunity is to make one compact performance hierarchy answer “now, direction, strongest sets” before the user travels through analytics chrome.

## What Is Working

1. Useful data coverage: selectable latest/history points, records, top three sets, dates, units, and primary/secondary muscles.
2. Considered interaction and states: loading and empty states are explicit, and chart scrubbing switches between Latest and Selected with haptics.
3. Disciplined foundations: no decorative shadows, controlled radii, tokenized colors, native navigation, and consistent four-point spacing.

## Priority Issues

### [P1] Current performance has no primary tier

The answer to “How am I currently performing?” is embedded in the chart callout. Direction is left to visual inference, and the best evidence lives far below. Make the latest completed score/date the opening performance readout, using only existing values and calculations, with history and best nearby.

### [P1] The chart costs more height than the information earns

The section copy, nested readout, fixed 224dp plot, and single-series legend occupy roughly a viewport. The legend repeats the already-named score, while 10dp muted axes weaken quantitative readability. Preserve the plot and scrubbing, but shorten it, tighten the readout, remove the redundant legend, and retain readable axes.

### [P1] Records duplicate the strongest performance

The same top set, date, and superlative appear as Best set / PR and again as rank 1 / Best. Merge the record summary and ranked performances into one Records region: show the strongest set once, keep Most sets as a secondary record, then show ranks 2–3.

### [P2] Uniform card stacking erases information architecture

Progress, personal records, top sets, and muscles all receive equal bordered-card treatment, and the chart adds another tonal rounded container. This satisfies Flat Until Floating but overuses Tonal Structure and Functional Curve. Use one anchored performance/history region at most; organize the rest with flat sections, spacing, and separators.

### [P1] Android metadata is too fragile

Section labels are muted captions, chart axes are fixed at 10, and the shared Text primitive disables font scaling. The screen-specific fix is to promote key metadata and axes to existing legible roles. The global font-scaling defect is real but should be handled as a separate accessibility change after cross-surface verification.

## Single Recommended Design Direction

**Compact performance instrument.** Keep exercise identity concise, lead with a dense current-performance readout, place a shorter interactive history plot directly under it, merge all records into one flat section, and end with lightweight muscle classification. Preserve all data, calculations, gestures, navigation, semantics, appearances, and adaptive architecture.

## Persona Red Flags

- **Experienced lifter:** must remember the latest score/date, scroll to the best, and mentally compare them; duplicated rank-one data and a one-series legend waste attention.
- **Distracted gym user:** the four answers span multiple screens even though the surface has almost no decisions; the chart becomes the visual goal instead of the current performance.
- **Accessibility-dependent user:** fixed 10dp muted axes and disabled font scaling make a data-heavy Android view unnecessarily fragile.

## Minor Observations

- “Top set performance” is singular while listing three sets.
- Orange rank-one highlighting plus green Best spends two semantic signals on the same fact.
- The four-point rhythm is followed; allocation, not off-grid spacing, is the issue.
- The screenshots do not visibly show chart title, explanatory copy, or axis labels that exist in source. Treat this as screenshot/source drift or an Android legibility issue, not proof the implementation lacks them.

## Product Decision

Choose what “current performance” means in the opening tier: the latest workout's best completed-set score, or the existing latest completed-set summary. No new derived metric is needed.

## Narrow Implementation Sequence

1. Restructure only the Exercise Details composition into identity, current/history, records, and muscles.
2. Compact the existing chart body; preserve all points, selection, haptics, axes, and light/dark tokens.
3. Consolidate Personal records and Top set performance without changing record calculations.
4. Remove redundant legend/status emphasis and promote section/axis text with existing typography roles.
5. Verify Android/iOS, light/dark, loading/empty states, chart touch behavior, navigation, and accessibility semantics.

## Questions to Consider

1. If the chart lost 40% of its height, which pixels are essential to answer “improving or declining?”
2. Why should the lifter encounter the same strongest set twice before muscle classification?
3. If orange means action, selection, or meaningful progress, should it emphasize every historical point or only the active/high-value cue?
