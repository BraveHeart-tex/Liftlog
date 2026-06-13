## Styling

NativeWind `className` by default. Semantic tokens from `global.css`. `cn` from `@/src/lib/utils/cn` — no local alternatives.

No hardcoded colors, font sizes, radius, or theme-dependent values. No inline styles except for animated values, native-only props, or layout edge cases that NativeWind can't express.

```tsx
// ✅
<View className="border-border bg-card rounded-lg border p-4" />
// ❌
<View style={{ backgroundColor: '#111' }} />
```

---

## Third-Party Components

Use wrappers from `src/components/styled` instead of direct imports:

`StyledScrollView` · `StyledGestureScrollView` · `StyledFlatList` · `StyledFlashList` · `StyledBottomSheetFlatList` · `StyledBottomSheetBackdrop` · `StyledBottomSheetScrollView` · `StyledBottomSheetTextInput` · `StyledTextInput` · `StyledActivityIndicator`

To add a new wrapper, follow the existing pattern in `src/components/styled`.

---

## NativeWind Constraints

Version: `nativewind@5.0.0-preview.3` — do not use `remapProps` or `cssInterop` (not exported). Use `styled(...)` from `nativewind`.

---

## Raw Theme Values

Use `@/src/theme/tokens` only for native/third-party props that can't consume NativeWind classes: React Navigation tab options, `TextInput` placeholder/selection colors, backdrop styles, animated transforms. Never when a semantic class works.

---

## Typography

No global `lineHeight` tokens — RN treats `lineHeight` as layout height, causing spacing issues. Use the shared `Text` primitive and project typography classes instead of ad-hoc font styling.
