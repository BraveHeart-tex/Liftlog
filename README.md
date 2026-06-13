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

## Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/d6f9219d-0f2b-41d8-bf5f-d68e330a1286" width="180" />
  <img src="https://github.com/user-attachments/assets/b2d9b2e1-8fab-4904-8096-7f5a97dbecb4" width="180" />
  <img src="https://github.com/user-attachments/assets/aae0f623-3ddb-465c-91ef-1d95bf8c8c54" width="180" />
  <img src="https://github.com/user-attachments/assets/ccdc8350-13ff-44a6-a980-268c0fabc71e" width="180" />
  <img src="https://github.com/user-attachments/assets/7870f951-e156-4952-8e40-15941cce4899" width="180" />
</p>

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
pnpm ios                # Run on iOS simulator
pnpm android            # Run on Android device/emulator
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
