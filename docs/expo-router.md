# Expo Router Nav Rules

Pick API by intended stack shape, not click timing.

**Default:** `router.navigate()`. Only deviate for a specific history need.

- **Rapid taps / dupe screens:** `push` adds a new entry every call → repeated presses stack dupes. Use `navigate` instead. Don't debounce globally — fix the API choice. Keep `push` only when duplicates are intentional.

- **Edit→save nested flows** (`Log → Details → Edit`): don't `replace()` (only swaps top screen, leaving stale `Details` beneath). Use `dismissTo({pathname, params})` to return to the existing screen and drop everything after it. Prefer `dismissTo` over `back` whenever intermediate screens might exist — intent is "reach X," not "go back N times."

- **`<Link>`:** same rules. Skip `push` prop unless dupes are wanted; use `replace`/`dismissTo` for those specific histories.

- **`dangerouslySingular`:** only for routes with a real uniqueness invariant (e.g., dynamic routes unique by `id`, or `workoutId+exerciseId`).

**Cheat sheet:**
| Need | API |
|---|---|
| Normal navigation | `navigate` |
| Always new instance | `push` |
| Remove current from history | `replace` |
| Exactly one screen back | `back` |
| Return to existing earlier screen | `dismissTo` |
| Only one instance ever | `dangerouslySingular` |

**Principle:** design the stack, then pick the API that produces it.
