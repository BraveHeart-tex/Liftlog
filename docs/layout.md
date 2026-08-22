## Layout

- Use `Screen` for normal pages, forms, scrolling layouts, keyboard handling, and sticky footers. Its default top edge owns the screen safe area; use `edges={[]}` only when a native stack header already owns that edge.
- For custom safe-area roots, use NativeWind safe-area utilities (`pt-safe`, `p-safe`, `pb-safe-offset-*`) on `View`.
- Fixed screen footers should use `Screen`'s `footer` prop and its shared `pb-safe-offset-3` clearance. Custom fixed footers must match that baseline.
- Keep ordinary `pb-*` content spacing separate from safe-area spacing; do not add safe-area utilities to lists unless they are fixed against the screen edge.
- Use `useSafeAreaInsets` only when a numeric inset is required for calculations, not for static padding.
- Use scroll/list wrappers whenever vertical content can exceed the viewport.
- Avoid nested scroll containers and unnecessary `flex-1` on non-scroll stacks; both hide content or footers.
- Sticky footers must stay visible, respect safe areas, and remain reachable while content scrolls.
- Let `Screen` own keyboard behavior. Avoid listeners, manual footer offsets, or custom keyboard animation unless proven necessary.
- Do not set Android keyboard behavior back to `height`; it caused stale bottom gaps after dismissal.
