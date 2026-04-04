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

- Use **NativeWind className ONLY**
- Do NOT use inline styles unless debugging or absolutely necessary
- Theme is defined in `global.css` using Tailwind v4 `@theme`

Allowed:

```tsx
<View className="bg-card border border-border p-4 rounded-lg" />
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

```tsx
<SafeAreaView className="flex-1 bg-background" edges={["top"]}>
```

---

### 2. Use ScrollView for vertical content

If content can exceed screen height → ALWAYS use ScrollView

```tsx
<ScrollView contentContainerClassName="px-4 py-6">
```

NEVER rely on View for scrollable layouts.

---

### 3. Do NOT combine flex-1 with non-scroll content stacks

Bad:

```tsx
<View className="flex-1">
```

Good:

```tsx
<ScrollView contentContainerClassName="flex-grow px-4 py-6">
```

---

### 4. Spacing system

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

1. Use NativeWind classes
2. Respect theme tokens
3. Use ScrollView for vertical layouts
4. Use SafeAreaView at root
5. Keep components simple
6. Avoid unnecessary libraries
7. Avoid inline styles
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
