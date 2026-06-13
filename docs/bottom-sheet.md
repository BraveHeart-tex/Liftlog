## Gorhom Bottom Sheet

Prefer: predictable keyboard behavior · stable sizing · bottom-sheet-aware inputs · direct child lists · safe-area footers

Avoid: conflicting sizing modes · nested scroll edge cases · keyboard overlap · layout jitter

---

## Dynamic Sizing

Use for: forms · menus · dialogs · pickers · variable-height content

```tsx
<BottomSheet
  enableDynamicSizing
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  androidKeyboardInputMode="adjustPan"
/>
```

- No `snapPoints`. No `animateOnMount={false}`. No auto-focus on open.

---

## Snap Points

Use for: search + list layouts · tall pickers · fixed-height flows

```tsx
<BottomSheet
  snapPoints={['70%', '90%']}
  keyboardBehavior="extend"
  keyboardBlurBehavior="restore"
/>
```

- No `interactive` keyboard behavior with snap points — causes keyboard height stacking.
- Use `androidKeyboardInputMode="adjustPan"` when footer must rise with keyboard.

---

## Inputs

Use bottom-sheet-aware inputs inside keyboard-sensitive sheets:
`BottomSheetInput` · `StyledBottomSheetTextInput` · wrappers on `BottomSheetTextInput`

Avoid plain RN `TextInput` inside keyboard-sensitive sheets unless Android behavior is verified.

---

## Lists

`BottomSheetFlatList` must be a **direct child** of the sheet — no wrapping containers.

```tsx
// ✅
<GorhomBottomSheet snapPoints={['70%', '90%']}>
  <View>{/* header */}</View>
  <StyledBottomSheetFlatList data={items} />
</GorhomBottomSheet>

// ❌
<GorhomBottomSheet snapPoints={['70%', '90%']}>
  <BottomSheetView style={{ flex: 1 }}>
    <StyledBottomSheetFlatList data={items} />
  </BottomSheetView>
</GorhomBottomSheet>
```

The shared `BottomSheet` primitive handles correct structure automatically.

---

## Safe Area Footer

```tsx
const insets = useSafeAreaInsets();
<View style={{ paddingBottom: insets.bottom + 16 }}>{children}</View>;
```

Footer actions must stay reachable, avoid home-indicator overlap, and remain visible during keyboard interaction.
