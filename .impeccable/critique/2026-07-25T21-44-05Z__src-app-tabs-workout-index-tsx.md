---
target: 'Workout Home screenshots: no active workout and active workout'
total_score: 25
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 0
timestamp: 2026-07-25T21-44-05Z
slug: src-app-tabs-workout-index-tsx
---

# Workout Home critique

## Design Health Score

| #         | Heuristic                       |     Score | Key issue                                                                                |
| --------- | ------------------------------- | --------: | ---------------------------------------------------------------------------------------- |
| 1         | Visibility of system status     |         4 | Active workout state and duration are unmistakable.                                      |
| 2         | Match with real world           |         4 | Language and task order fit workout planning and logging.                                |
| 3         | User control and freedom        |         3 | Settings, templates, history, and resume remain reachable.                               |
| 4         | Consistency and standards       |         3 | State swap is coherent; one history empty-state message becomes inaccurate while active. |
| 5         | Error prevention                |         2 | Blank-start versus template-start paths are not explicit.                                |
| 6         | Recognition rather than recall  |         3 | Main actions are visible; recent cards lack strong session discriminators.               |
| 7         | Flexibility and efficiency      |         3 | Blank start, template use, resume, and history support repeat use.                       |
| 8         | Aesthetic and minimalist design |         3 | Clean hierarchy, but the active summary spends excessive viewport height.                |
| 9         | Error recovery                  |       n/a | Not observable or meaningfully exercised on this Home surface.                           |
| 10        | Help and documentation          |       n/a | Not needed to complete the bounded Home tasks under review.                              |
| **Total** |                                 | **25/32** | **Good**                                                                                 |

## Design specificity

Functionally specific, visually conventional. The live timer, exercise/set counts, templates, and training records make this recognizably LiftLog. The dark bordered-card language itself could transfer to many tracking apps; that is a styling observation, not a usability defect.

## Overall verdict

Workout Home has a sound task hierarchy and low cognitive load. Start and Resume are both immediately legible, settings is visible but subordinate, and the order—current action, templates, history—matches user intent. No P1 issue is present. The principal weakness is that the active state over-expands its summary and substantially reduces access to templates and history in the first viewport.

## Findings

### P2 — Active summary consumes too much of the viewport

- **Screenshot evidence:** In `workout-home-active-workout.png`, the active card occupies roughly a quarter of the full screen and pushes Recent Workouts well below its position in `workout-home-no-workout.png`; the third history card is cut by the tab bar. Resume itself is already highly prominent.
- **Smallest viable correction:** Compress the stats region and vertical gaps while retaining status, title, duration, exercise/set counts, and the full-width Resume button.
- **Expected user impact:** Faster reach to templates and history, with less layout displacement between states and no loss of Resume clarity.

### P2 — Blank start and template start are not framed as two workout-start paths

- **Screenshot evidence:** `Start Workout` reads as the sole start action; the following `TEMPLATES` shelf and `+ New` read more like content management than an alternate way to begin a session.
- **Smallest viable correction:** Change one label: either `Start Empty Workout` or `Start from a template` for the section heading.
- **Expected user impact:** First-time users can choose spontaneous versus planned training without opening a template to infer its role.

### P2 — Section-header actions are too small for gym-time interaction

- **Screenshot evidence:** `+ New` and `View all ›` are small, edge-aligned text targets. Source confirms `New` removes normal minimum height and padding, while `View all` wraps only a tight text/icon row.
- **Smallest viable correction:** Keep their visual treatment, but give each an invisible minimum 44 pt iOS / 48 dp Android hit area.
- **Expected user impact:** Fewer missed taps during one-handed, low-attention use.

### P2 — Recent workout cards are weakly distinguishable

- **Screenshot evidence:** Two cards share the name `Saturday workout`; date and duration are the only differentiators. The anomalous `28 hr 50 min` value attracts attention without helping identify session content.
- **Smallest viable correction:** Add one compact discriminator—exercise count, set count, or first one to two exercises—within the existing card height.
- **Expected user impact:** Faster recognition and fewer detail-screen opens when reviewing history.

### P3 — History empty-state copy breaks in the active-workout state

- **Screenshot/source evidence:** The shared empty state says `Start your first session to see history here.` When an active workout exists, the available action is Resume, not Start.
- **Smallest viable correction:** Use state-neutral copy such as `Complete a workout to see it here.`
- **Expected user impact:** Removes contradictory guidance and keeps both Home states semantically consistent.

### P3 — Empty templates look as ready as usable templates

- **Screenshot evidence:** `Lower — 0 exercises — No exercises` occupies the same large slot as the five-exercise routine and states emptiness twice.
- **Smallest viable correction:** Replace the duplicated metadata with a single `Empty template` label and mute it relative to populated routines.
- **Expected user impact:** Faster template scanning and less chance of selecting an unready routine.

## What is working

- Start/Resume is unmistakably the primary action in each state.
- The active workout’s status, elapsed duration, name, and counts are legible at a glance.
- Section order is logical, and settings remains visible without competing with workout actions.
- Cognitive load is low: no decision point exceeds four meaningful visible options.

## Subjective styling preferences, not usability issues

The dark palette, uppercase overlines, rounded cards, restrained orange accent, and generous spacing are coherent with the incumbent design system. Changing those choices would be taste-driven. Likewise, adding chevrons to every pressable card may improve affordance, but the screenshots do not establish it as a material failure.

## Persona red flags

- **First-time lifter:** May not understand blank start versus template start.
- **Returning lifter:** Repeated generic workout names plus date/duration require opening cards to identify sessions.
- **Hurried one-handed gym user:** Small `New` and `View all` hit regions raise miss-tap risk.

## Questions

Questions skipped: the requested scope is bounded and the corrections are straightforward.
