## Overview

This project is a mobile application built with:

- Expo (React Native)
- TypeScript
- NativeWind (Tailwind CSS v4, CSS-first via global.css)
- React Native Safe Area Context
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
- Do NOT use inline styles for core RN components unless debugging
- **EXCEPTION: Always use inline `style` prop for layout-critical properties on external/third-party components** (e.g. `SafeAreaView` from `react-native-safe-area-context`, `ScrollView` when flex behaviour is load-bearing)

Why: NativeWind processes classNames asynchronously. On external components this means styles may not be applied on the first layout pass, causing broken layouts. Inline `style` is synchronous and guaranteed.

Allowed for core RN components:

```tsx
<View className="bg-card border border-border p-4 rounded-lg" />
```

Required for external components with layout-critical flex:

```tsx
<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
<ScrollView style={{ flex: 1 }} contentContainerClassName="px-4 py-6">
```

Avoid:

```tsx
<View style={{ backgroundColor: "#111" }} />
```

---

### Theme Tokens

Use semantic tokens only:

- Colors:
  - bg-background
  - bg-card
  - text-foreground
  - text-muted-foreground
  - text-progress-up
  - border-border
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

## Layout Rules

### 1. Always use SafeAreaView at screen root

Use inline style for flex, className for theming:

```tsx
<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
```

---

### 2. Use ScrollView for vertical content

If content can exceed screen height → ALWAYS use ScrollView.
Always set `style={{ flex: 1 }}` via inline style, not className:

```tsx
<ScrollView style={{ flex: 1 }} contentContainerClassName="px-4 py-6">
```

NEVER rely on View for scrollable layouts.

---

### 3. ScrollView flex must use inline style

NativeWind's `flex-1` className on `ScrollView` is unreliable — the style is applied after the first layout pass, so the ScrollView collapses to zero height and hides content.

Bad:

```tsx
<ScrollView className="flex-1">
```

Good:

```tsx
<ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
```

This applies any time a `ScrollView` needs to fill available space, especially when used alongside a sticky footer.

---

### 4. Sticky footer layout pattern

When a screen has a footer (e.g. a CTA button), the ScrollView must use inline flex styles or content will be hidden:

```tsx
<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
  <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ flexGrow: 1 }}
    contentContainerClassName="px-4 py-6 pb-4"
  >
    {children}
  </ScrollView>
  <View className="border-t border-border bg-background px-4 py-4">
    {footer}
  </View>
</SafeAreaView>
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
- ExerciseCard
  Do NOT create deep abstraction layers early.

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
<Pressable className="rounded-lg bg-primary px-4 py-4 items-center">
  <Text className="text-body-medium text-white">Action</Text>
</Pressable>
```

---

## Data Display Rules

- Always show **last workout**
- Always show **progress indicator**
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

## Common Pitfalls (MUST AVOID)

### Missing ScrollView

Leads to content being hidden off-screen

### NativeWind className on external components for layout

`flex-1` via className on `ScrollView` or `SafeAreaView` (from `react-native-safe-area-context`) is applied asynchronously and may be missing on the first layout pass. This causes the component to collapse to zero height, hiding all content. Always use `style={{ flex: 1 }}` inline for these components.

### Using line-height globally

Breaks layout in React Native

### Hardcoding colors

Breaks theme consistency

### Overusing flex-1

Can push content out of view

### Complex abstractions early

Slows down development

---

## File Organization

```
src/
  screens/
  components/
    ui/
  features/
    exercises/
    workouts/
  theme/
```

---

## When Generating Code

The agent MUST:

1. Use NativeWind classes for theming and spacing
2. Respect theme tokens
3. Use ScrollView for vertical layouts
4. Use SafeAreaView at root
5. Keep components simple
6. Avoid unnecessary libraries
7. Avoid inline styles for core RN components **except** for layout-critical flex on external components
8. Avoid web-only assumptions

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
