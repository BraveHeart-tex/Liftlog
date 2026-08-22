# Bottom sheets

Read this when changing a Gorhom bottom sheet, its keyboard behavior, local state, list structure, or safe-area spacing.

## Choose the sheet shape

- Dynamic sizing is for variable-height content. Use interactive keyboard behavior and omit `snapPoints`.
- Fixed or list sheets use `snapPoints` with `keyboardBehavior="extend"`. This keeps keyboard height from stacking; do not combine snap points with `interactive`.
- Use bottom-sheet-aware inputs. A plain React Native `TextInput` needs Android verification.

## State and structure

- Keep draft, search, filter, and pending state inside the sheet content. The parent controls visibility and receives committed values.
- Keep `BottomSheetFlatList` as a direct sheet child; wrappers break scrolling. The shared primitive owns the required structure.
- Keep footers reachable while the keyboard is open. Use `BottomSheetSafeContent` for compact static content and `BottomSheetSafeFooter` for action rows.

## Safe-area spacing

- `BottomSheetSafeContent` and `BottomSheetSafeFooter` provide the compact `pb-safe-offset-2` baseline.
- Use `BottomSheetContent` for scrollable content; it provides `pb-safe-offset-4`.
- Preserve feature-specific top spacing with `pt-*` and gaps. Change the bottom offset only when bottom clearance itself needs to differ.
