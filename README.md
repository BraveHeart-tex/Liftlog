# Liftlog

Liftlog is a mobile-first workout tracker built for fast strength logging and progressive overload. It uses Expo, React Native, Expo Router, NativeWind, SQLite, and Drizzle ORM.

The app is intentionally simple: start a workout, add exercises, log sets, and make progress easy to read at a glance.

## Tech Stack

- Expo 54
- React Native 0.81
- React 19
- Expo Router
- TypeScript
- NativeWind with Tailwind CSS v4
- Expo SQLite
- Drizzle ORM
- Gorhom Bottom Sheet
- Lucide React Native icons
- React Native Safe Area Context

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the Expo dev server:

```bash
pnpm start
```

Run on iOS:

```bash
pnpm ios
```

Run on Android:

```bash
pnpm android
```

## Scripts

```bash
pnpm start
pnpm ios
pnpm android
pnpm run ts-check
pnpm run lint
pnpm run lint:fix
pnpm run prettier:check
pnpm run prettier:fix
pnpm run format
```

`pnpm run ts-check` and `pnpm run lint` are the main local quality checks.

## Project Structure

```text
src/
  app/
    (tabs)/
  components/
    ui/
  db/
  features/
    exercises/
    programs/
    progress/
    workouts/
  lib/
    utils/
  theme/
```

Important entry points:

- `src/app/_layout.tsx` wires the root app layout.
- `src/components/common-providers.tsx` wires shared providers.
- `src/components/database-provider.tsx` opens SQLite, runs Drizzle migrations, and seeds starter data.
- `src/components/ui/screen.tsx` is the default screen wrapper.
- `global.css` defines NativeWind theme tokens.
- `src/theme/tokens.ts` exposes raw token values for native props that cannot use class names.

## Database

Liftlog uses Expo SQLite with Drizzle ORM.

Schema:

```text
src/db/schema.ts
```

Migrations:

```text
src/db/migrations/
```

Drizzle config:

```text
drizzle.config.ts
```

Generate a migration after changing the schema:

```bash
pnpm exec drizzle-kit generate
```

Migrations run automatically when the app initializes through `DatabaseProvider`. Starter exercises are inserted by `src/db/seed.ts` when needed.

## Styling

Use NativeWind `className` for regular React Native components:

```tsx
<View className="border-border bg-card rounded-lg border p-4" />
```

Use the shared `cn` helper for conditional classes:

```tsx
import { cn } from '@/src/lib/utils/cn';
```

Use semantic theme tokens from `global.css`, such as:

- `bg-background`
- `bg-card`
- `bg-primary`
- `text-foreground`
- `text-muted-foreground`
- `border-border`
- `text-h1`
- `text-body`
- `rounded-lg`

For external/native components where first-pass layout matters, use inline layout styles:

```tsx
<SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']} />
<ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} />
```

Use raw token values from `src/theme/tokens.ts` for native props that cannot consume NativeWind classes, such as navigation colors, placeholder colors, and bottom-sheet backdrop styles.

## UI Guidelines

- Prefer the shared `Screen` primitive for screens.
- Use `ScrollView`, `FlatList`, or `SectionList` when content can exceed the viewport.
- Keep touch targets large and interactions fast.
- Prefer simple components over deep abstractions.
- Avoid hardcoded colors and font sizes.
- Avoid global line-height tokens; React Native treats `lineHeight` as layout height.

## Git Hooks

Husky and lint-staged are configured.

Pre-commit runs:

```bash
pnpm run pre-commit
```

Commit messages are checked with commitlint using the conventional commit config in `.commitlintrc.json`.
