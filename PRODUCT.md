# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

LiftLog is for self-directed gym-goers focused on hypertrophy and strength. They use it during active training sessions and need to record their work with minimal interruption, little attention, and comfortable thumb-first interactions so they can stay focused on lifting.

## Product Purpose

LiftLog makes workout logging fast and frictionless without requiring an account, an internet connection, or a cloud service. It helps lifters record workouts as they happen, track progressive overload, and review their training history while keeping their data on their device.

Success means a user can move through an active workout quickly and confidently while still benefiting from capable training tools and useful progress history.

## Positioning

LiftLog is a local-first, privacy-first workout tracker optimized for speed during real training sessions. It combines no-account, offline operation with capable features such as supersets, multiple exercise tracking types, timers, templates, and progress history, without allowing advanced features to obstruct the core logging flow.

## Operating Context

- Used primarily in the gym during active hypertrophy and strength workouts.
- Interactions compete with rest periods and the physical demands of training, so they must require minimal attention and work comfortably one-handed.
- Users can start, resume, and complete workouts; log exercise sets; organize supersets; use rest timers; save workout templates; and review calendar and exercise history.
- Users can search a built-in exercise library, create custom exercises, and track progress across recorded workouts.
- On Android, LiftLog can count live steps and sync step history through Health Connect.
- User data is stored locally on the device through SQLite.

## Capabilities and Constraints

- One shared React Native and Expo codebase serves iOS and Android while adapting naturally to each platform's conventions.
- The app must remain fully usable offline.
- No account, cloud service, or network connection may be required for core operation.
- Workout interactions must remain highly responsive, including screen transitions and animations.
- Implementation must prioritize smooth motion, minimal unnecessary rendering, and high runtime performance.
- Native-feeling behavior and focused execution take priority over adding more features.
- Advanced capabilities must remain subordinate to the primary job of logging a workout quickly.
- Current workout capabilities include sets with weight and repetitions, supersets, multiple exercise tracking types, rest timers, workout templates, progressive-overload feedback, exercise history, and custom exercises.

## Brand Commitments

- Product name: LiftLog.
- Product character: direct, focused, private, capable, and native-feeling.
- Existing app icon and splash assets live in `assets/images/`.
- Simplicity must not come at the cost of capable workout tracking, and capability must not introduce unnecessary complexity.

## Evidence on Hand

- `README.md` documents the product promise, feature set, local-only architecture, and current screenshots.
- `src/app/` and `src/features/` contain the implemented workout, exercise, history, progress, settings, and Android step-tracking flows.
- `assets/images/` contains the current app icon, Android adaptive icon layers, and splash icon.
- `assets/sounds/` contains shipped rest-timer and stopwatch feedback sounds.
- No testimonials, customer claims, benchmarks, pricing claims, or public adoption evidence were established during initialization; future work must not fabricate them.

## Product Principles

1. Keep the lifter focused on lifting, not operating the app.
2. Make the common workout action immediate; keep advanced tools available but out of the way.
3. Preserve user ownership through local, offline, no-account operation.
4. Favor native behavior, responsiveness, and reliability over feature quantity.
5. Adapt to iOS and Android conventions without splitting LiftLog into separate products.
