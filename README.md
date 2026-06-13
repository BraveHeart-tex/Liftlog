# Liftlog

A fast, minimal strength tracking app for Android and iOS. Log workouts, track progressive overload, and review your history — all stored locally on device.

Built with Expo, React Native, TypeScript, NativeWind, Expo SQLite, and Drizzle ORM.

---

## Features

- Start, resume, and complete workout sessions
- Log sets with weight and reps per exercise
- Exercise library with search, category filters, custom exercises, and archive/delete
- Calendar view of completed workouts
- Progressive overload feedback per exercise
- Android: live step counting and Health Connect sync
- Settings: theme, weight unit, rest timer duration, steps preferences
- Fully local — no account or internet required

---

## Requirements

- Node `>=22.12.0 <23`
- pnpm `>=10.33.0 <11`

---

## Getting Started

```bash
pnpm install
pnpm ios        # or pnpm android
```

---

## Scripts

```bash
pnpm start              # Expo dev server
pnpm ios / android      # Run on simulator or device
pnpm run ts-check       # Type check
pnpm run lint           # Lint
pnpm run format         # Prettier + lint fix
pnpm run knip           # Unused exports check
```

---

## Stack

| Layer      | Technology                                                         |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Expo 54 · React Native 0.81 · React 19                             |
| Navigation | Expo Router                                                        |
| Language   | TypeScript                                                         |
| Styling    | NativeWind 5 · Tailwind CSS v4                                     |
| Database   | Expo SQLite · Drizzle ORM                                          |
| UI         | Gorhom Bottom Sheet · Lucide React Native                          |
| Platform   | `expo-audio` · `expo-step-counter` · `react-native-health-connect` |

---

## Project Structure

```
src/
  app/                  # Routes and screens (Expo Router)
  components/
    ui/                 # Shared primitives (Screen, Button, Card, …)
    styled/             # NativeWind wrappers for third-party components
  db/                   # Schema, migrations, seed data
  features/             # Feature modules (exercises, workouts, steps, …)
  lib/                  # Shared DB utilities and cross-feature helpers
  theme/                # Token values for native props
```

---

## Database

All data is stored locally via Expo SQLite. Drizzle ORM manages the schema and migrations.

After changing `src/db/schema.ts`, generate a migration:

```bash
pnpm exec drizzle-kit generate
```

Migrations run automatically on app start via `DatabaseProvider`.
