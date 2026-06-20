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

## State & Performance

Keep sheet-only state inside the sheet subtree, not in the component that renders `<BottomSheet>`.

Use a memoized content component when a sheet has internal draft state:

```tsx
export function ExercisePickerSheet({ isOpen, onClose }: Props) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['90%']}>
      <ExercisePickerSheetContent isOpen={isOpen} onClose={onClose} />
    </BottomSheet>
  );
}

const ExercisePickerSheetContent = memo(function ExercisePickerSheetContent({
  isOpen,
  onClose
}: Props) {
  const [query, setQuery] = useState('');

  return <BottomSheetInput value={query} onChangeText={setQuery} />;
});
```

- Keep `isOpen` in the parent so it can control visibility.
- Move search queries, filters, pending selections, form values, and save/loading state into the sheet content when only the sheet uses them.
- Pass committed values out with callbacks such as `onSelectExercise`, `onSave`, or `onSubmit`.
- Wrap callbacks passed from the parent with `useCallback` so memoized sheet content stays stable.

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
