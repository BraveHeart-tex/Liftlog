# Expo Router navigation

Read this when changing route transitions, links, stack history, or duplicate-screen behavior. Choose the API from the desired stack shape, not from tap timing.

## API selection

| Desired result                                                 | API                   |
| -------------------------------------------------------------- | --------------------- |
| Normal navigation                                              | `navigate`            |
| Always create a new instance                                   | `push`                |
| Remove the current screen from history                         | `replace`             |
| Go back exactly one screen                                     | `back`                |
| Return to an existing earlier screen and drop screens after it | `dismissTo`           |
| Keep only one instance of a route                              | `dangerouslySingular` |

Use `router.navigate()` by default. `push` adds an entry on every call, so rapid taps or duplicate-screen flows should use `navigate`; keep `push` only when duplicates are intentional. Do not solve this with a global debounce.

For nested edit flows such as `Log → Details → Edit`, use `dismissTo({ pathname, params })` to reach the existing screen and remove everything after it. `replace()` only swaps the top screen and leaves stale `Details` underneath. Prefer `dismissTo` over `back` when intermediate screens may exist.

`<Link>` follows the same rules: omit its `push` prop unless a duplicate is intentional, and use `replace` or `dismissTo` for the required history. Use `dangerouslySingular` only when the route has a real uniqueness invariant, such as `id` or `workoutId + exerciseId`.
