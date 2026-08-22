# Layout

Read this when changing `Screen`, safe-area ownership, scrolling, keyboard behavior, or fixed footers.

## Screen and safe areas

- Use `Screen` for normal pages, forms, scrolling layouts, keyboard handling, and sticky footers. Its default top edge owns the screen safe area; use `edges={[]}` only when a native stack header owns that edge.
- For a custom safe-area root, put NativeWind safe-area utilities such as `pt-safe`, `p-safe`, or `pb-safe-offset-*` on the `View`.
- Use `Screen`'s `footer` prop for fixed footers; its shared clearance is `pb-safe-offset-3`. A custom fixed footer matches that baseline.
- Keep ordinary `pb-*` content spacing separate from safe-area spacing. Lists use safe-area utilities only when fixed against the screen edge.
- Use `useSafeAreaInsets` when a numeric inset is required for a calculation or native/third-party prop; use utilities for static padding.

## Scrolling and keyboard

- Use a scroll or list wrapper whenever content can exceed the viewport.
- Keep one vertical scroll container. Nested containers and unnecessary `flex-1` on non-scroll stacks can hide content or footers.
- Keep sticky footers visible, safe-area-aware, and reachable while content scrolls.
- Let `Screen` own keyboard behavior. Add listeners, manual footer offsets, or custom keyboard animation only when a proven requirement remains.
- Keep Android keyboard behavior away from `height`; it caused stale bottom gaps after dismissal.

For bottom-sheet safe-area baselines, use [`bottom-sheet.md`](bottom-sheet.md). For NativeWind styling and input rules, use [`styling.md`](styling.md).
