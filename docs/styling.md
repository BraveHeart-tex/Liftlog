## Styling Rules

Use NativeWind `className` by default.

Use semantic theme tokens from `global.css`.

Do not hardcode:

- colors
- font sizes
- radius values
- theme-dependent visual values

Use the shared `cn` helper:

```tsx
import { cn } from '@/src/lib/utils/cn';
```

Do not create local `joinClassNames`, `classNames`, or `cn` helpers.

## Core React Native Components

Use `className` for normal styling.

Good:

```tsx
<View className="border-border bg-card rounded-lg border p-4" />
```

Avoid inline styles on core React Native components unless required for:

- animated values
- raw native API values
- native-only props
- layout-critical edge cases that cannot be expressed safely with NativeWind

Bad:

```tsx
<View style={{ backgroundColor: '#111' }} />
```

## Third-Party Components

For third-party components with multiple style props, use wrappers from:

```txt
src/components/styled
```

Existing wrappers include:

- StyledScrollView
- StyledGestureScrollView
- StyledFlatList
- StyledFlashList
- StyledBottomSheetFlatList
- StyledBottomSheetBackdrop
- StyledBottomSheetScrollView
- StyledBottomSheetTextInput
- StyledTextInput
- StyledActivityIndicator

Use wrappers instead of direct third-party imports at call sites.

Good:

```tsx
<StyledScrollView
  className="flex-1"
  contentContainerClassName="flex-grow px-4 py-6"
/>
```

If a third-party component needs a new style-prop mapping, add or update a colocated wrapper in:

```txt
src/components/styled
```

## NativeWind Version Constraints

This project uses:

```txt
nativewind@5.0.0-preview.3
```

Do not use:

- `remapProps`
- `cssInterop`

They are not exported in this project version.

Use `styled(...)` mappings from `nativewind`, following the existing wrapper pattern.

## Theme Token Exceptions

Use raw values from `@/src/theme/tokens` only for native or third-party props that cannot consume NativeWind classes.

Allowed examples:

- React Navigation tab options
- `TextInput` placeholder colors
- `TextInput` selection colors
- bottom sheet backdrop styles
- animated transforms
- raw native API values

Do not use raw theme values when a semantic NativeWind class can be used.

## React Native Typography

Do not define or rely on global line-height tokens.

React Native treats `lineHeight` as actual layout height, which can cause spacing issues.

Use project typography classes and the shared `Text` primitive instead of ad-hoc font styling.
