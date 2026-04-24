# Liftlog

Liftlog is a mobile workout tracker focused on fast strength logging, minimal friction, and clear progressive-overload feedback. The app is built with Expo, Expo Router, React Native, TypeScript, NativeWind, Expo SQLite, and Drizzle ORM.

The app includes:

- onboarding for name and weight-unit preference
- a workout tab for starting, resuming, and completing sessions
- exercise picking, set logging, and per-exercise workout detail
- an exercises tab with search, category filters, custom exercises, and archive/delete behavior
- a history tab with a calendar view for completed workouts
- settings for theme, weight unit, and default rest timer duration
- local rest-timer audio and persisted local data

## Tech Stack

- Expo 54
- React Native 0.81
- React 19
- Expo Router
- TypeScript
- NativeWind 5 with Tailwind CSS v4
- Expo SQLite
- Drizzle ORM
- Gorhom Bottom Sheet
- Lucide React Native
- `expo-audio`
- `react-native-calendars`

## Requirements

- Node `>=22.12.0 <23`
- pnpm `>=10.33.0 <11`

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the Expo dev server:

```bash
pnpm start
```

Run the native app:

```bash
pnpm ios
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
pnpm run knip
```

## App Structure

```text
src/
  app/
    (tabs)/
      workout/
      exercises/
      history/
      settings/
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

Important entry points:

- `src/app/_layout.tsx` loads `global.css` and wires the root stack.
- `src/app/index.tsx` redirects into onboarding or the main tabs.
- `src/components/common-providers.tsx` composes gesture, safe-area, database, and theme providers.
- `src/components/database-provider.tsx` initializes SQLite, runs Drizzle migrations, and seeds starter data.
- `src/components/ui/screen.tsx` is the default screen primitive.
- `global.css` defines the NativeWind theme tokens used across the app.
- `src/theme/tokens.ts` exposes raw token values for native props that cannot consume class names.

## Navigation

Top-level routes currently include:

- `src/app/onboarding.tsx`
- `src/app/(tabs)/workout`
- `src/app/(tabs)/exercises`
- `src/app/(tabs)/history`
- `src/app/(tabs)/settings`
- `src/app/workouts/[id].tsx` for workout history detail

The main tab bar contains `Workout`, `Exercises`, `History`, and `Settings`.

## Database

Liftlog stores app data locally with Expo SQLite and Drizzle ORM.

Core tables:

- `app_meta`
- `exercises`
- `workouts`
- `workout_exercises`
- `sets`
- `personal_records`

Relevant files:

- Schema: `src/db/schema.ts`
- Migrations: `src/db/migrations/`
- Drizzle config: `drizzle.config.ts`
- Seed data: `src/db/seed.ts`

Generate a migration after changing the schema:

```bash
pnpm exec drizzle-kit generate
```

Migrations run automatically through `DatabaseProvider` when the app initializes. Starter exercise data is seeded when needed.

## Architecture Notes

- Route screens stay thin and consume feature hooks from `src/features/*/hooks`.
- Drizzle queries and writes live in feature repositories under `src/features/*/repository.ts`.
- Reactive reads use `useLiveWithFallback` from `src/lib/db/use-live-with-fallback`.
- Standard screens should prefer the shared `Screen` primitive or the local safe-area wrapper in `src/components/ui/safe-area-view.tsx`.

## Styling

- Use NativeWind `className` for core React Native components.
- Prefer semantic tokens from `global.css` such as `bg-background`, `bg-card`, `text-foreground`, and `border-border`.
- Use the shared `cn` helper from `src/lib/utils/cn.ts` for conditional classes.
- Use wrappers in `src/components/styled` for third-party components with multiple style props.
- Use raw values from `src/theme/tokens.ts` only for native props that cannot consume NativeWind classes.

## Tooling

- ESLint is configured in `eslint.config.mjs`
- Prettier is configured with `prettier-plugin-tailwindcss`
- Husky and lint-staged run formatting/linting on staged files
- Commit messages are checked with Commitlint via `.commitlintrc.json`
