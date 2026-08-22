# Workout UX and display

Read this when changing workout logging interactions, audio feedback, or compact progress/set summaries.

## Logging

- Optimize for quick scanning, minimal typing, large touch targets, and predictable actions.
- Show previous performance, progress changes, and useful comparisons.
- Keep labels concise and numeric formatting readable; avoid verbose or crowded metrics.
- Use `Pressable` for touch interactions with at least practical `p-3` touch padding.
- Keep one clear touch target per action. Avoid nested touchables, tiny hit areas, hidden actions, and overloaded gestures.

## Audio feedback

- Configure Expo audio mode once at the app/provider boundary. Leaf components do not call `setAudioModeAsync` or `setIsAudioActiveAsync`.
- For short effects, use `useAudioPlayer(..., { downloadFirst: true })`.
- Replay through the relevant player with `pause()`, `seekTo(0)`, then `play()`; serialize replays per player.
- Keep stop behavior local to that `AudioPlayer`. On unmount, invalidate async work rather than touching the player instance.

## Data display

Prefer compact set and progress summaries:

```text
60 × 8, 8, 7
+2 reps / +2.5 kg
```
