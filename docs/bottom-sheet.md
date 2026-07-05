## Gorhom Bottom Sheet

- Dynamic sizing: variable-height sheets; use interactive keyboard behavior; do not set `snapPoints`.
- Snap points: fixed/list sheets; use `keyboardBehavior="extend"`. Never combine snap points with `interactive`; keyboard height stacks.
- Use bottom-sheet-aware inputs. Plain RN `TextInput` needs Android verification.
- Keep sheet-local draft/search/filter/pending state inside sheet content. Parents control visibility and receive committed values.
- `BottomSheetFlatList` must be a direct sheet child; wrappers break scrolling. The shared primitive handles safe structure.
- Footers must use NativeWind safe-area utilities or shared safe footer/content helpers and remain reachable with the keyboard open.
