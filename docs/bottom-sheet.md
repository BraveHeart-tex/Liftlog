## Gorhom Bottom Sheet

Use Gorhom Bottom Sheet patterns consistently across the app.

Prefer:

- predictable keyboard behavior
- stable sizing behavior
- bottom-sheet-aware inputs
- direct child list usage
- safe-area-aware footers

Avoid:

- conflicting sizing modes
- nested scrolling edge cases
- keyboard overlap bugs
- layout jitter during open/close transitions

## Dynamic Sizing Sheets

Use dynamic sizing sheets for:

- forms
- menus
- dialogs
- pickers
- variable-height content

Pattern:

```tsx
<BottomSheet
  enableDynamicSizing
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  androidKeyboardInputMode="adjustPan"
/>
```

Rules:

- do not pass `snapPoints`
- do not use `animateOnMount={false}`
- do not auto-focus inputs on open
- use `keyboardBehavior="interactive"`
- use `keyboardBlurBehavior="restore"`

Dynamic sizing should remain:

- content-driven
- stable
- keyboard-safe

## Snap Point Sheets

Use snap point sheets for:

- search + list layouts
- tall pickers
- fixed-height flows
- predictable content heights

Pattern:

```tsx
<BottomSheet
  snapPoints={['70%', '90%']}
  keyboardBehavior="extend"
  keyboardBlurBehavior="restore"
/>
```

Rules:

- do not use `interactive` keyboard behavior with snap points
- use `androidKeyboardInputMode="adjustPan"` when footer actions must rise with the keyboard

Avoid combining:

- snap points
- interactive keyboard behavior

This can cause keyboard height stacking issues.

## Inputs Inside Sheets

Keyboard-sensitive sheets must use bottom-sheet-aware input components.

Preferred options:

- `BottomSheetInput`
- `StyledBottomSheetTextInput`
- wrappers built on `BottomSheetTextInput`

Avoid plain React Native `TextInput` inside keyboard-sensitive sheets unless behavior has been verified on Android.

Input behavior should remain:

- keyboard-safe
- focus-safe
- layout-stable

## Lists Inside Sheets

`BottomSheetFlatList` must be a direct child of the sheet.

Good:

```tsx
<GorhomBottomSheet snapPoints={['70%', '90%']}>
  <View>{/* header */}</View>
  <StyledBottomSheetFlatList data={items} />
</GorhomBottomSheet>
```

Bad:

```tsx
<GorhomBottomSheet snapPoints={['70%', '90%']}>
  <BottomSheetView style={{ flex: 1 }}>
    <StyledBottomSheetFlatList data={items} />
  </BottomSheetView>
</GorhomBottomSheet>
```

Avoid unnecessary wrapping containers around bottom-sheet-aware lists.

The shared `BottomSheet` primitive should handle the correct structure automatically.

## Bottom Safe Area

Bottom sheet footer actions should respect safe areas.

Pattern:

```tsx
const insets = useSafeAreaInsets();

<View style={{ paddingBottom: insets.bottom + 16 }}>{children}</View>;
```

Footer actions should:

- remain reachable
- avoid home-indicator overlap
- stay visible during keyboard interaction
