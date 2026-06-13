## Layout

Prioritize: mobile usability · readability · predictable spacing · safe scrolling · keyboard safety

Avoid: overflowing content · hidden footer actions · unnecessary nesting · `flex-1` overuse · web-dependent layouts

---

## Screen Roots

Use `Screen` (`@/src/components/ui/screen`) for standard pages, forms, scrolling layouts, keyboard handling, and sticky footers.

For custom safe-area roots use `SafeAreaView` from `@/src/components/ui/safe-area-view` — never from `react-native-safe-area-context` directly.

```tsx
<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
  {children}
</SafeAreaView>
```

---

## Scrollable Content

Use a scroll view or list whenever content can exceed screen height. Never use plain `View` for vertically scrollable layouts.

Preferred: `StyledScrollView` · `StyledFlatList` · `StyledBottomSheetFlatList` · `StyledFlashList`

```tsx
<StyledScrollView
  className="flex-1"
  contentContainerClassName="flex-grow px-4 py-6"
/>
```

Avoid nested scroll containers. Avoid `flex-1` on non-scroll stacks — it can push content off-screen.

---

## Sticky Footers

Prefer `Screen`. For custom layouts:

```tsx
<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
  <StyledScrollView
    className="flex-1"
    contentContainerClassName="flex-grow px-4 pt-6 pb-4"
  >
    {children}
  </StyledScrollView>
  <View className="border-border bg-background border-t px-4 py-4">
    {footer}
  </View>
</SafeAreaView>
```

Footer must stay visible, respect safe areas, and remain reachable while scrolling.

---

## Keyboard

`Screen` owns default keyboard behavior. Do not add custom keyboard listeners, manual footer offset state, or custom keyboard animation systems unless `Screen` is proven insufficient.

Do not set Android keyboard behavior back to `height` — previously caused stale bottom gaps after dismissal.

---

## Spacing Scale

`mt-1` tight · `mt-2` small · `mt-3` medium · `mt-4` section · `mt-6` large break

No arbitrary values except for native edge cases, animation alignment, or visual centering corrections.
