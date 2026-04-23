## Overview

This project is a mobile application built with:

- Expo (React Native)
- Expo Router
- TypeScript
- NativeWind (Tailwind CSS v4, CSS-first via global.css)
- React Native Safe Area Context via a local hook-based SafeAreaView wrapper
- Expo SQLite + Drizzle ORM
- Gorhom Bottom Sheet
- Lucide React Native icons
- expo-audio for workout sounds
- react-native-calendars for history calendar views

The app is a progressive overload workout tracker focused on:

- fast workout logging
- minimal friction UX
- clean, dark-mode UI

---

## Core Principles

1. **Simplicity first**
   - Prefer simple implementations over abstraction-heavy solutions
   - Avoid premature optimization or over-engineering
2. **Mobile-first UX**
   - Large touch targets
   - Minimal typing
   - Fast interactions
   - Dense but readable layout
3. **Consistency via theme tokens**
   - NEVER hardcode colors or font sizes unless necessary
   - Always use semantic Tailwind classes (bg-card, text-muted-foreground, etc.)
4. **Speed over completeness**
   - Build working features first
   - Iterate later

---

## Tech Stack Rules

### Styling

- Use **NativeWind className** as the default
- Use the shared `cn` helper from `@/src/lib/utils/cn` for conditional or composed class names
- Do NOT create local `joinClassNames`/`cn` helpers inside components; keep class merging centralized through the shared utility
- Do NOT use inline styles for core RN components unless debugging or using a native API that requires raw values
- For third-party components with multiple style props, use the colocated styled wrappers in `@/src/components/styled` instead of direct imports. These wrappers map `className`, `contentContainerClassName`, etc. to the underlying style props.
- If a third-party component needs a new style-prop mapping, add or update a wrapper in `src/components/styled`. Keep the mapping colocated with the wrapper, not in a global entry point.
- This project currently uses `nativewind@5.0.0-preview.3`, where `remapProps`/`cssInterop` are not exported. Use `styled(...)` mappings from `nativewind` for wrapper components, matching the existing wrapper pattern.
- **EXCEPTION: Use inline `style` prop for layout-critical properties on external/third-party components only when no styled wrapper exists** (e.g. provider root views, animated transforms)
- **EXCEPTION: Use raw values from `@/src/theme/tokens` for native/third-party props that cannot consume NativeWind classes** (e.g. React Navigation tab options, `TextInput` placeholder/selection colors, bottom-sheet backdrop styles, animated transforms)

Why: NativeWind className support is safest when third-party components expose all style props through a wrapper. Some native props cannot consume class strings cleanly; use theme tokens for those cases instead of forcing a complex wrapper.

Allowed for core RN components:

```tsx
<View className="bg-card border-border rounded-lg border p-4" />
```

Required for wrapped scroll/list components:

```tsx
<StyledScrollView
  className="flex-1"
  contentContainerClassName="flex-grow px-4 py-6"
/>
```

Required for safe-area roots:

```tsx
import { SafeAreaView } from '@/src/components/ui/safe-area-view';

<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
  {children}
</SafeAreaView>;
```

Avoid:

```tsx
<View style={{ backgroundColor: '#111' }} />
```

---

### Theme Tokens

Use semantic tokens only. For className styling, prefer tokens defined in `global.css`.

- Colors:
  - bg-background
  - bg-card
  - bg-primary
  - bg-secondary
  - bg-muted
  - bg-input
  - bg-success
  - bg-warning
  - bg-danger
  - bg-info
  - text-foreground
  - text-primary-foreground
  - text-secondary-foreground
  - text-muted-foreground
  - text-accent-foreground
  - text-success
  - text-warning
  - text-danger
  - text-progress-up
  - text-progress-same
  - text-progress-down
  - border-border
  - border-ring
- Typography:
  - text-h1
  - text-h2
  - text-h3
  - text-body
  - text-body-medium
  - text-small
  - text-caption
- Radius:
  - rounded-sm
  - rounded-md
  - rounded-lg
  - rounded-xl

---

### 🚨 IMPORTANT: React Native Typography Rule

- DO NOT define or rely on global line-height tokens
- DO NOT assume web-like text behavior
  Reason:
  React Native treats `lineHeight` as actual layout height, which causes spacing issues.

---

## Data Access Rules

### 1. Keep Drizzle usage inside feature hooks and repositories

- Client components and route screens should not call `useDrizzle` directly.
- Screens should consume feature-level hooks from `src/features/*/hooks`.
- Feature hooks may call `useDrizzle`, compose live queries, and call repository functions.
- Repository files own Drizzle table imports, query construction, transactions, and synchronous reads/writes.
- Put reusable query builders in repositories as `*Query` functions so hooks can pass them to `useLiveWithFallback`.

Preferred flow:

```text
Screen -> feature screen hook -> feature data/action hook -> repository -> Drizzle
```

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

### 2. Use live queries with an explicit fallback

For reactive data, use `useLiveWithFallback` from `@/src/lib/db/use-live-with-fallback`.
Pair every live query with a synchronous repository fallback so first render is populated before Drizzle's live listener emits.

```tsx
const db = useDrizzle();
const { data } = useLiveWithFallback(
  () => getExercisesQuery(db),
  () => getExercises(db),
  [db]
);
```

### 3. Database lifecycle belongs to the provider

- `DatabaseProvider` owns `SQLiteProvider`, migrations, seeding, and the Drizzle context.
- `src/db/client.ts` owns database configuration (`WAL`, foreign keys), database name/options, and `createDrizzleDb`.
- App code should not call `useSQLiteContext`, `createDrizzleDb`, `migrate`, or `runSeedIfNeeded` outside the database provider setup.

### 4. Schema and migrations

- Schema lives in `src/db/schema.ts`.
- Migrations live in `src/db/migrations`.
- When changing schema, update Drizzle migrations instead of manually patching the local SQLite database.
- Prefer repository helpers for app-level invariants such as archiving vs deleting custom exercises, rebuilding personal records, and settings defaults.

---

## Layout Rules

### 1. Always use the local SafeAreaView at screen root

Prefer the shared `Screen` primitive from `@/src/components/ui/screen` for standard screens. It already handles the app's local `SafeAreaView`, optional vertical scrolling, padding, keyboard taps, and sticky footer layout.

When a custom screen wrapper is needed, import the local hook-based `SafeAreaView` from `@/src/components/ui/safe-area-view`. It supports `className`, `edges`, normal `View` props, and additive numeric padding through `style`.

```tsx
import { SafeAreaView } from '@/src/components/ui/safe-area-view';

<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
```

Do not import `SafeAreaView` from `react-native-safe-area-context` in app UI. React Navigation warns that component can cause jumpy behavior during animations; use the local wrapper because it renders a regular `View` and applies insets with `useSafeAreaInsets`.

---

### 2. Use ScrollView for vertical content

If content can exceed screen height → ALWAYS use ScrollView.
Use the styled wrapper for scrollable layouts:

```tsx
<StyledScrollView
  className="flex-1"
  contentContainerClassName="flex-grow px-4 py-6"
/>
```

NEVER rely on View for scrollable layouts.

For long or dynamic data lists, use `StyledFlatList`, `StyledBottomSheetFlatList`, or another appropriate list wrapper instead of mapping inside a `ScrollView`.

---

### 3. Third-party style prop wrappers

Components with two or more style props must use a styled wrapper. Do not import those components directly at call sites.

Bad:

```tsx
import { ScrollView } from 'react-native';

<ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{ paddingHorizontal: 16 }}
/>;
```

Good:

```tsx
import { StyledScrollView } from '@/src/components/styled/scroll-view';

<StyledScrollView className="flex-1" contentContainerClassName="px-4" />;
```

Existing wrappers include `StyledScrollView`, `StyledFlatList`, `StyledBottomSheetFlatList`, `StyledBottomSheetBackdrop`, `StyledTextInput`, and `StyledActivityIndicator`.

---

### 4. Sticky footer layout pattern

When a screen has a footer (e.g. a CTA button), use a styled scroll wrapper with a growing content container:

```tsx
import { SafeAreaView } from '@/src/components/ui/safe-area-view';

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
</SafeAreaView>;
```

---

### 5. Do NOT combine flex-1 with non-scroll content stacks

Bad:

```tsx
<View className="flex-1">
```

Good:

```tsx
<ScrollView contentContainerClassName="flex-grow px-4 py-6">
```

---

### 6. Spacing system

Use margin utilities:

- mt-1 → tight spacing
- mt-2 → small spacing
- mt-3 → medium spacing
- mt-4 → section spacing
- mt-6 → large section break
  Avoid random spacing values.

---

## Component Structure

Prefer simple reusable primitives:

- Screen (wrapper)
- Card
- Button
- Input
- Badge
- Text
- Dialog
- BottomSheet
- EmptyState
- Icon

Current shared primitive locations:

- `src/components/ui`: app primitives (`Screen`, `Button`, `Input`, `Text`, `Card`, `Dialog`, `BottomSheet`, etc.)
- `src/components/styled`: NativeWind wrappers for React Native and third-party components with multiple style props
- `src/components/database-provider.tsx`: SQLite/Drizzle provider and `useDrizzle`
- `src/components/common-providers.tsx`: app-level provider composition

Do NOT create deep abstraction layers early.

Prefer one component per file when practical. If a component grows beyond a tiny private helper, move it into its own file near the feature or UI primitive it belongs to.

Do not keep generic utility functions inside component files. If a helper is reusable outside that component or not tightly coupled to its render logic, move it under `src/lib/utils`.

---

## Example Patterns

### Card

```tsx
<View className="rounded-lg border border-border bg-card p-4">
```

---

### Section Title

```tsx
<Text className="text-caption text-muted-foreground">
```

---

### Primary Text

```tsx
<Text className="text-h3 text-foreground">
```

---

### Secondary Text

```tsx
<Text className="text-small text-muted-foreground">
```

---

### Positive Feedback

```tsx
<Text className="text-caption text-progress-up">
```

---

### Button

```tsx
<Pressable className="bg-primary items-center rounded-lg px-4 py-4">
  <Text className="text-body-medium text-primary-foreground">Action</Text>
</Pressable>
```

---

## Data Display Rules

For workout, progress, and exercise-summary surfaces:

- Show **last workout**
- Show **progress indicator**
- Keep numbers readable:
  - "60 × 8, 8, 7"
  - "+2 reps"
  - "+2.5 kg"

---

## Interaction Rules

- Use Pressable for all touch interactions
- Ensure touch targets are large (padding ≥ 12px)
- Avoid nested touchables unless necessary

---

## Validation Commands

This project currently has no dedicated test script in `package.json`.

After code changes, run the relevant available checks:

- `pnpm run ts-check`
- `pnpm run lint`
- `pnpm run prettier:check`

For logic changes, add or update tests when a test harness exists. If no test harness exists for the touched area, explicitly say that and rely on `ts-check`/`lint` plus focused manual verification.

---

## Common Pitfalls (MUST AVOID)

### Missing ScrollView

Leads to content being hidden off-screen

### NativeWind className on external components for layout

Do not use direct imports of third-party components with multiple style props and then pass raw style objects. Use the wrappers in `src/components/styled` so `className`, `contentContainerClassName`, and related props are mapped consistently. For external components without wrappers, keep layout-critical inline style when needed.

### Importing SafeAreaView from react-native-safe-area-context

Do not import `SafeAreaView` directly from `react-native-safe-area-context` for app UI. Use `Screen` for normal screens, or `SafeAreaView` from `@/src/components/ui/safe-area-view` for custom roots. The local wrapper avoids the known jumpy-layout behavior by using `useSafeAreaInsets`.

### Using line-height globally

Breaks layout in React Native

### Hardcoding colors

Breaks theme consistency

### Overusing flex-1

Can push content out of view

### Complex abstractions early

Slows down development

### Calling useDrizzle in screens

Leaks persistence details into UI routes. Put data access in feature hooks and repositories instead.

### Building Drizzle queries in components

Makes live-query behavior and fallback reads inconsistent. Keep query builders in `repository.ts` files.

---

## File Organization

```
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

---

## When Generating Code

The agent MUST:

1. Use NativeWind classes for theming and spacing
2. Respect theme tokens
3. Use ScrollView for vertical layouts, or FlatList/SectionList for long dynamic lists
4. Use `Screen` at screen roots, or the local `SafeAreaView` from `@/src/components/ui/safe-area-view` when a custom safe-area root is needed
5. Keep components simple
6. Avoid unnecessary libraries
7. Use styled wrappers from `@/src/components/styled` for third-party components with multiple style props
8. Avoid inline styles for core RN components **except** for animated values, unwrapped external layout-critical flex, or native APIs that require raw values from `@/src/theme/tokens`
9. Avoid web-only assumptions
10. Keep database reads/writes in feature hooks and repositories; do not call `useDrizzle` from route screens or presentational components
11. Use `useLiveWithFallback` for reactive Drizzle reads, with repository `*Query` and synchronous fallback functions

---

## Output Expectations

When generating UI code:

- Provide complete, working components
- Use realistic data (Bench Press, Squat, etc.)
- Follow spacing + typography rules
- Ensure layout works on mobile screens

---

## Goal

Build a fast, minimal, high-quality workout tracking app with:

- excellent UX
- clean design system
- maintainable code
