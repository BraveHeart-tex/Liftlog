## Workout UX

- Optimize logging for quick scanning, minimal typing, large touch targets, and predictable actions.
- Show previous performance, progress changes, and useful comparisons.
- Keep labels concise and numeric formatting readable. Avoid verbose or crowded metrics.
- Use `Pressable` for touch interactions. Minimum practical touch padding is `p-3`.
- Avoid nested touchables, tiny hit areas, hidden actions, and overloaded gestures.

## Audio Feedback

- Configure Expo audio mode once at the app/provider boundary.
- For short effects, use `useAudioPlayer(..., { downloadFirst: true })`.
- Replay effects via `pause()`, `seekTo(0)`, then `play()`; serialize replays per player.
- Keep stop behavior local to the relevant `AudioPlayer`; avoid global audio activation/deactivation.
- Do not touch `AudioPlayer` instances during unmount cleanup; invalidate async work instead.

## Data Display

Prefer compact set/progress summaries:

```
60 × 8, 8, 7
+2 reps / +2.5 kg
```
