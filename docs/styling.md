## Styling

Use NativeWind `className` with semantic tokens from `global.css`. Use shared `cn`; do not add local merge helpers.

No hardcoded colors, font sizes, radius, or theme values. Inline styles are only for animation, native-only props, or layout edge cases.

## Third-Party Components

Use styled wrappers for third-party components with multiple style props. Avoid direct imports that bypass project styling.

## NativeWind

- NativeWind is preview-versioned. Do not use `remapProps` or `cssInterop`; use `styled(...)`.
- Use raw theme tokens only for native/third-party props that cannot consume classes.
- Do not add global `lineHeight` tokens; React Native treats line height as layout height.

Use the shared text primitive and typography classes.
