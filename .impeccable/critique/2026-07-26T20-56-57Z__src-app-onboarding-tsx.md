---
target: LiftLog onboarding flow
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-07-26T20-56-57Z
slug: src-app-onboarding-tsx
---

# LiftLog onboarding critique

## Design Health Score

| #         | Heuristic                       |     Score | Key issue                                                              |
| --------- | ------------------------------- | --------: | ---------------------------------------------------------------------- |
| 1         | Visibility of system status     |         3 | Selection is obvious; no progress is needed for one step.              |
| 2         | Match system / real world       |         2 | “Profile” falsely implies identity or account setup.                   |
| 3         | User control and freedom        |         2 | Choice is reversible later, but system Back is the only retreat.       |
| 4         | Consistency and standards       |         3 | Shared primitives are consistent; exclusive-choice semantics are weak. |
| 5         | Error prevention                |         2 | Valid default, but completion has no guarded/loading state.            |
| 6         | Recognition rather than recall  |         4 | Two explicit choices with strong selected state.                       |
| 7         | Flexibility and efficiency      |         3 | One choice and one CTA; locale default is not inferred.                |
| 8         | Aesthetic and minimalist design |         2 | Low clutter becomes under-informative and spatially inert.             |
| 9         | Error recovery                  |         1 | No visible persistence failure or retry path.                          |
| 10        | Help and documentation          |         3 | Reversibility is explained; destination and reason are not.            |
| **Total** |                                 | **25/40** | **Fair foundation; weak activation story.**                            |

## Design Specificity Verdict

Functionally disciplined but category-interchangeable. The warm dark field, flat hierarchy, and orange action/selection states fit LiftLog, but “Welcome / profile / kg-lb / Get started” could belong to any health app. It does not communicate fast logging, offline operation, no account, or the concrete first useful action.

The deterministic scan returned zero findings for `src/app/onboarding.tsx`. That is a clean syntax/pattern result, not a clean accessibility result: the shared Text primitive disables font scaling, which the narrowed detector did not catch. Native browser overlays were not applicable.

## Overall Impression

The flow is admirably short and calm. Its biggest opportunity is to turn a generic setup gate into a direct, truthful handoff to the first workout without adding slides, decoration, or feature inventory.

## What’s Working

1. One required choice and one tap make time-to-product excellent.
2. Orange is used semantically for selection and decisive action.
3. Full-width bottom CTA and large unit targets are thumb-friendly.

## AI-slop verdict

Moderate startup-onboarding slop in copy and composition, not in visual effects. There are no gradients, glossy illustrations, card stacks, or gamification. The generic welcome language, vague CTA, oversized empty middle, and large rounded choice slabs make the screen feel like a template rather than training equipment.

## Priority Issues

### [P1] Value proposition is absent and misframed

“Set up your profile” contradicts the no-account/private product truth and describes setup that does not occur. Replace the welcome/profile framing with one compact outcome statement plus local/offline/no-account reassurance.

### [P1] The CTA hides the first useful action

“Get started” repeats the subtitle and does not say where the user goes. Name the actual handoff, preferably “Start a workout,” if that matches the destination state.

### [P1] Large-text and compact-screen resilience is blocked

The shared Text primitive sets `allowFontScaling={false}`. The onboarding Screen is non-scroll, uses `edges={[]}`, and relies on fixed vertical distribution. Respect scaling and use reflowing content with a safe-area-aware footer.

### [P2] The composition reads as a generic unfinished slide

The large empty middle adds neither product meaning nor operational focus. Keep a single screen, but tighten it into a coherent setup task: value, unit choice, reassurance, sticky action. Do not add an illustration, card, gradient, or progress dots.

### [P2] Exclusive-choice semantics are weaker than the visual model

The kg/lb controls are announced as independent buttons. Expose a clear group label and radio/segmented selection semantics while preserving selected state and native target sizes.

## Persona Red Flags

- **Hurried lifter:** the one-step path is strong, but “Get started” does not promise workout logging and the empty field adds scan/travel distance.
- **Privacy-conscious first-timer:** “profile” implies identity/account setup; the local, offline, no-account promise is absent.
- **Large-text or low-vision user:** scaling is disabled; once corrected, the fixed non-scroll layout risks clipping on small screens and with translations.

## Recommended Direction

Keep exactly one setup screen and frame it as a direct handoff into training. Use an outcome-led headline, one short line stating “fast, offline, stored on this device, no account,” a “Choose your units” exclusive control with change-later reassurance, and a bottom CTA naming the workout action. Use no progress indicator, Skip, illustration, feature list, permission request, or extra slide.

## Step Changes

- Rewrite the welcome/profile framing; do not add a value-proposition slide.
- Merge product reassurance and required setup on the same screen.
- Keep the unit choice first only if it is truly required; otherwise defer it to first weight entry.
- Keep the existing workout destination but label the final action concretely.

## Unresolved Product Decisions

1. Is weight unit required before the first workout, or can locale/default plus inline correction handle it?
2. Does the current destination immediately expose “Start a workout,” making that CTA promise exact?
3. Should the one-line privacy promise name all three truths, or prioritize “No account. Works offline.” for translation resilience?

## Narrow Implementation Sequence

1. Confirm unit timing and exact destination action.
2. Rewrite onboarding headline, support line, task label, and CTA only.
3. Make this screen scroll/reflow with a safe footer; address text scaling at the correct shared ownership boundary.
4. Strengthen exclusive-choice semantics and screen-reader reading order.
5. QA compact height, 200% type, pseudo-localization, light/dark/high contrast, system Back, and repeated CTA taps on iOS and Android.

## Questions to Consider

1. If this is not a profile, why does the first screen say it is?
2. Can the screen prove fast, offline, and no-account operation in one short block?
3. Is unit choice important enough to delay the first workout?
