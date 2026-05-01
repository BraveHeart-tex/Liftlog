## Project Overview

This is a mobile workout tracking app focused on progressive overload, fast workout logging, minimal friction, and a clean dark-mode UI.

Tech stack:

- Expo / React Native
- Expo Router
- TypeScript
- NativeWind / Tailwind CSS v4 via `global.css`
- Expo SQLite + Drizzle ORM
- Gorhom Bottom Sheet
- Lucide React Native
- expo-audio
- react-native-calendars

## Core Principles

- Keep solutions simple. Avoid abstractions unless they clearly improve readability or reuse.
- Optimise for mobile UX: large touch targets, fast interactions, minimal typing, readable density.
- Prefer working features over perfect architecture. Iterate later.
- Use the existing project patterns before introducing new ones.
- Do not add production dependencies without confirmation.

## TypeScript

- Use TypeScript.
- Prefer `interface` for object-shaped props, params, state, and context values.
- Use `type` for unions, literals, mapped/conditional types, inferred ORM/schema aliases, and utility compositions.

## Styling Rules

Use NativeWind `className` by default.

Use semantic theme tokens from `global.css`. Do not hardcode colors or font sizes unless there is no practical alternative.

Use the shared `cn` helper:

```tsx
import { cn } from '@/src/lib/utils/cn';
```

````

Do not create local `joinClassNames` or `cn` helpers.

### Core React Native components

Use `className` for normal styling:

```tsx
<View className="border-border bg-card rounded-lg border p-4" />
```

Avoid inline styles on core RN components unless required for:

- animated values
- raw native API values
- layout-critical edge cases that cannot be expressed safely with NativeWind

Bad:

```tsx
<View style={{ backgroundColor: '#111' }} />
```

### Third-party components

For third-party components with multiple style props, use wrappers from:

```txt
src/components/styled
```

Existing wrappers include:

- `StyledScrollView`
- `StyledFlatList`
- `StyledBottomSheetFlatList`
- `StyledBottomSheetBackdrop`
- `StyledTextInput`
- `StyledActivityIndicator`

Use wrappers instead of direct third-party imports at call sites.

Good:

```tsx
<StyledScrollView
  className="flex-1"
  contentContainerClassName="flex-grow px-4 py-6"
/>
```

If a third-party component needs a new style-prop mapping, add or update a colocated wrapper in `src/components/styled`.

This project uses `nativewind@5.0.0-preview.3`. `remapProps` / `cssInterop` are not exported. Use `styled(...)` mappings from `nativewind`, following the existing wrapper pattern.

### Theme token exceptions

Use raw values from `@/src/theme/tokens` only for native or third-party props that cannot consume NativeWind classes, such as:

- React Navigation tab options
- `TextInput` placeholder / selection colors
- bottom sheet backdrop styles
- animated transforms

## Theme Tokens

Prefer these semantic tokens.

### Colors

```txt
bg-background
bg-card
bg-primary
bg-secondary
bg-muted
bg-input
bg-success
bg-warning
bg-danger
bg-info

text-foreground
text-primary-foreground
text-secondary-foreground
text-muted-foreground
text-accent-foreground
text-success
text-warning
text-danger
text-progress-up
text-progress-same
text-progress-down

border-border
border-ring
```

### Typography

```txt
text-h1
text-h2
text-h3
text-body
text-body-medium
text-small
text-caption
```

### Radius

```txt
rounded-sm
rounded-md
rounded-lg
rounded-xl
```

## React Native Typography

Do not define or rely on global line-height tokens.

React Native treats `lineHeight` as actual layout height, which can cause spacing issues.

## Layout Rules

### Screen roots

Prefer the shared `Screen` primitive for standard screens:

```tsx
import { Screen } from '@/src/components/ui/screen';
```

Use it for normal screens, forms, sticky footers, padding, keyboard handling, and scrolling.

When a custom root is needed, use the local SafeAreaView:

```tsx
import { SafeAreaView } from '@/src/components/ui/safe-area-view';

<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
  {children}
</SafeAreaView>;
```

Do not import `SafeAreaView` directly from `react-native-safe-area-context` in app UI.

### Scrollable content

If vertical content can exceed screen height, use a scroll or list component.

Use:

- `StyledScrollView` for regular vertical content
- `StyledFlatList` / `StyledBottomSheetFlatList` for long or dynamic lists

Do not rely on a plain `View` for scrollable layouts.

Good:

```tsx
<StyledScrollView
  className="flex-1"
  contentContainerClassName="flex-grow px-4 py-6"
/>
```

Avoid overusing `flex-1` on non-scroll content stacks because it can push content off-screen.

### Sticky footers

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

### Keyboard behavior

The `Screen` primitive owns the safest default keyboard behavior.

Do not add custom keyboard listeners or footer offset state unless `Screen` is proven insufficient for that specific layout.

Do not switch Android `Screen` keyboard behavior back to `height`; it previously caused stale bottom gaps after keyboard dismissal.

### Spacing

Use standard spacing utilities:

```txt
mt-1 tight spacing
mt-2 small spacing
mt-3 medium spacing
mt-4 section spacing
mt-6 large section break
```

Avoid random spacing values.

## Data Access Rules

Keep Drizzle access out of route screens and presentational components.

Preferred flow:

```txt
Screen -> feature screen hook -> feature data/action hook -> repository -> Drizzle
```

Screens should consume feature-level hooks from:

```txt
src/features/*/hooks
```

Feature hooks may call `useDrizzle`, compose live queries, and call repository functions.

Repositories own:

- Drizzle table imports
- query construction
- transactions
- synchronous reads/writes
- app-level invariants

Use reusable query builders named `*Query` so hooks can pass them to `useLiveWithFallback`.

Good:

```tsx
export default function ExercisesScreen() {
  const { exercises, filteredExercises } = useExercisesScreen();
}
```

Avoid:

```tsx
export default function ExercisesScreen() {
  const db = useDrizzle();
}
```

### Live queries

For reactive data, use:

```tsx
import { useLiveWithFallback } from '@/src/lib/db/use-live-with-fallback';

const db = useDrizzle();

const { data } = useLiveWithFallback(
  () => getExercisesQuery(db),
  () => getExercises(db),
  [db]
);
```

Every live query needs a synchronous repository fallback so the first render has data before Drizzle’s live listener emits.

### Database lifecycle

`DatabaseProvider` owns:

- `SQLiteProvider`
- migrations
- seeding
- Drizzle context

`src/db/client.ts` owns:

- database configuration
- WAL
- foreign keys
- database name/options
- `createDrizzleDb`

App code should not call these outside provider setup:

- `useSQLiteContext`
- `createDrizzleDb`
- `migrate`
- `runSeedIfNeeded`

### Schema and migrations

- Schema lives in `src/db/schema.ts`.
- Migrations live in `src/db/migrations`.
- When changing schema, update Drizzle migrations.
- Do not manually patch the local SQLite database.

## Component Structure

Prefer simple primitives:

- `Screen`
- `Card`
- `Button`
- `Input`
- `Badge`
- `Text`
- `Dialog`
- `BottomSheet`
- `EmptyState`
- `Icon`

Shared locations:

```txt
src/components/ui                 app primitives
src/components/styled             NativeWind wrappers
src/components/database-provider.tsx
src/components/common-providers.tsx
```

Prefer one component per file when practical.

Small private render helpers may stay in the same file. Move larger or reusable components near the feature or UI primitive they belong to.

Do not keep generic utilities inside component files. Move reusable utilities to:

```txt
src/lib/utils
```

Do not create deep abstraction layers early.

## Gorhom Bottom Sheet

### Dynamic sizing sheets

Use for variable-height content such as forms, menus, pickers, and dialogs.

```tsx
<BottomSheet
  enableDynamicSizing
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  androidKeyboardInputMode="adjustPan"
>
```

Rules:

- Do not pass `snapPoints` with `enableDynamicSizing`.
- Do not use `animateOnMount={false}` with dynamic sizing.
- Do not auto-focus inputs on sheet open.
- Use `keyboardBehavior="interactive"`.
- Use `keyboardBlurBehavior="restore"`.

### Snap point sheets

Use for fixed, predictable layouts such as search + list or tall pickers.

```tsx
<BottomSheet
  snapPoints={['70%', '90%']}
  keyboardBehavior="extend"
  keyboardBlurBehavior="restore"
>
```

Rules:

- Do not use `interactive` with snap points; it can add keyboard height on top of the snap point.
- Use `androidKeyboardInputMode="adjustPan"` when footer buttons need to rise with the keyboard.

### Inputs inside sheets

Inputs inside keyboard-sensitive Gorhom sheets must use the bottom-sheet-aware input path:

- `BottomSheetInput`
- `StyledBottomSheetTextInput`
- another wrapper built on `BottomSheetTextInput`

Do not use plain RN `TextInput` inside keyboard-sensitive sheets unless Android behavior has been verified.

### Lists inside sheets

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

The base `BottomSheet` component handles this automatically.

### Bottom safe area

For bottom sheet footers/buttons, add safe-area padding manually:

```tsx
const insets = useSafeAreaInsets();

<View style={{ paddingBottom: insets.bottom + 16 }}>{children}</View>;
```

## Data Display Rules

For workout, progress, and exercise-summary UI:

- Show last workout.
- Show progress indicator.
- Keep numbers compact and readable.

Examples:

```txt
60 × 8, 8, 7
+2 reps
+2.5 kg
```

## Interaction Rules

- Use `Pressable` for touch interactions.
- Keep touch targets large, usually `p-3` or greater.
- Avoid nested touchables unless necessary.

## Validation Commands

This project currently has no dedicated test script in `package.json`.

After code changes, run:

```sh
pnpm run ts-check
pnpm run lint
pnpm run prettier:check
```

For logic changes, add or update tests when a test harness exists.

If no test harness exists for the touched area, say so explicitly and rely on:

- type check
- lint
- prettier check
- focused manual verification

Never claim completion if checks are failing.

## Common Pitfalls

Avoid:

- Missing `ScrollView` / list wrappers for content that can exceed screen height.
- Importing `SafeAreaView` from `react-native-safe-area-context` in app UI.
- Hardcoded colors or font sizes.
- Global line-height tokens.
- Overusing `flex-1` on non-scroll stacks.
- Calling `useDrizzle` in route screens.
- Building Drizzle queries in components.
- Directly importing third-party components with multiple style props instead of using styled wrappers.
- Adding abstractions before they are needed.
- Adding dependencies for small problems.

## File Organization

```txt
src/
  app/
    (tabs)/
    workouts/
  assets/
    sounds/
  components/
    styled/
    ui/
  db/
    migrations/
  features/
    exercises/
    progress/
    settings/
    workouts/
  lib/
    db/
    utils/
  theme/
```

## When Generating Code

The agent must:

1. Use NativeWind classes for theming and spacing.
2. Respect semantic theme tokens.
3. Use `Screen` for standard screen roots.
4. Use the local SafeAreaView only for custom safe-area roots.
5. Use scroll/list wrappers for vertical content.
6. Use styled wrappers for third-party components with multiple style props.
7. Keep data access in feature hooks and repositories.
8. Use `useLiveWithFallback` for reactive Drizzle reads.
9. Keep components simple.
10. Avoid web-only assumptions.
11. Avoid unnecessary libraries.
12. Follow existing file and naming patterns.

## Output Expectations

When generating UI code:

- Provide complete, working components.
- Use realistic workout data where examples are needed.
- Follow spacing, typography, and theme rules.
- Ensure layouts work on mobile screens.

## Goal

Build a fast, minimal, high-quality workout tracker with excellent UX, a clean design system, and maintainable code.
````
