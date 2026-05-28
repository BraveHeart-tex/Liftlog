## Layout Rules

Layouts should prioritize:

- mobile usability
- readability
- predictable spacing
- safe scrolling behavior
- keyboard safety

Avoid:

- overflowing content
- hidden footer actions
- unnecessary nesting
- excessive `flex-1` usage
- layouts that depend on web behavior

## Screen Roots

Prefer the shared `Screen` primitive for standard screens:

```tsx
import { Screen } from '@/src/components/ui/screen';
```

Use `Screen` for:

- standard pages
- forms
- scrolling layouts
- keyboard handling
- sticky footers

When a custom safe-area root is required, use:

```tsx
import { SafeAreaView } from '@/src/components/ui/safe-area-view';
```

Example:

```tsx
<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
  {children}
</SafeAreaView>
```

Do not import `SafeAreaView` directly from:

```txt
react-native-safe-area-context
```

inside app UI code.

## Scrollable Content

If content can exceed screen height, use:

- a scroll view
- a list
- a bottom-sheet-aware list

Preferred components:

- StyledScrollView
- StyledFlatList
- StyledBottomSheetFlatList
- StyledFlashList

Do not rely on a plain `View` for vertically scrollable layouts.

Good:

```tsx
<StyledScrollView
  className="flex-1"
  contentContainerClassName="flex-grow px-4 py-6"
/>
```

Avoid unnecessary nested scroll containers.

Avoid overusing `flex-1` on non-scroll content stacks because it can push content off-screen.

## Sticky Footers

Prefer `Screen` first.

If building a custom sticky-footer layout:

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

Footer actions should:

- remain visible
- respect safe areas
- remain reachable while scrolling

## Keyboard Behavior

The shared `Screen` primitive owns the default keyboard behavior.

Do not add:

- custom keyboard listeners
- manual footer offset state
- custom keyboard animation systems

unless `Screen` is proven insufficient.

Do not switch Android `Screen` keyboard behavior back to `height`.

It previously caused stale bottom gaps after keyboard dismissal.

## Spacing

Use the standard spacing scale:

```txt
mt-1 tight spacing
mt-2 small spacing
mt-3 medium spacing
mt-4 section spacing
mt-6 large section break
```

Prefer consistent spacing patterns across screens.

Avoid arbitrary spacing values unless required for:

- native edge cases
- animation alignment
- visual centering corrections
