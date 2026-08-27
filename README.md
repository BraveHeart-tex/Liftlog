# LiftLog

LiftLog is a local-first workout tracker for lifters focused on strength and hypertrophy. Log workouts with minimal interruption, track progress over time, and keep your training data on your device without an account or internet connection.

Built with Expo, React Native, TypeScript, NativeWind, Expo SQLite, and Drizzle ORM.

---

## Features

- Start, resume, and complete workouts
- Log exercises using weight, reps, distance, and time tracking
- Organize exercises into supersets and reorder them during a workout
- Use rest timers with custom presets, haptics, sounds, and notifications
- Save workouts as reusable templates
- Review completed workouts in the calendar and exercise history
- Track progressive overload, personal records, and exercise progress
- Browse the exercise library with search and filters
- Create, edit, archive, and delete custom exercises
- Android: track steps and sync history with Health Connect
- Configure theme, weight unit, rest timer, and step preferences
- Store all workout data locally in SQLite

---

## Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/80c7d4f6-b3f5-4dc0-ae04-f090b59b3db6" width="180" />
  <img src="https://github.com/user-attachments/assets/e77d24d9-63ea-42a4-8e06-580c45fa0219" width="180" />
  <img src="https://github.com/user-attachments/assets/df5e5da0-6a4d-41f1-9a4b-289feab4f8fb" width="180" />
  <img src="https://github.com/user-attachments/assets/3b50cb9b-866f-4199-8bc1-25040d7fe4fe" width="180" />
  <img src="https://github.com/user-attachments/assets/c52f65fa-0213-45e2-9809-f0f73e088f80" width="180" />
</p>

---

## Requirements

- Node.js `>=22.13.0`
- pnpm `9.1.1`
- iOS or Android development tooling for the target platform

---

## Getting Started

Install dependencies and start the Expo development server:

```bash
pnpm install
pnpm start
```

Run the app on a simulator or connected device:

```bash
pnpm ios
pnpm android
```

Health Connect integration is available on Android. Workout logging remains available without step tracking.

---

## Scripts

```bash
pnpm start           # Start the Expo development server
pnpm ios             # Run on an iOS simulator or device
pnpm android         # Run on an Android emulator or device
pnpm test            # Run the test suite
pnpm run ts-check    # Type-check the project
pnpm run lint        # Lint the project
pnpm run format      # Format the project
pnpm run knip        # Check for unused exports
```

---

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Framework  | Expo 54 · React Native 0.81 · React 19    |
| Navigation | Expo Router                               |
| Language   | TypeScript                                |
| Styling    | NativeWind 5 · Tailwind CSS v4            |
| Database   | Expo SQLite · Drizzle ORM                 |
| UI         | Gorhom Bottom Sheet · Lucide React Native |
| Platform   | `expo-audio` · Health Connect             |

---

## Project Structure

```
src/
  app/                  # Routes and screens (Expo Router)
  components/
    ui/                 # Shared UI primitives
    styled/             # NativeWind wrappers for third-party controls
  db/                   # Schema, migrations, and seed data
  features/             # Exercises, workouts, progress, steps, and settings
  lib/                  # Shared utilities and cross-feature helpers
  theme/                # Design tokens for native props
tests/                  # Test suites and test-only runtime mocks
```

---

## Database

LiftLog stores workout data locally with Expo SQLite. Drizzle ORM manages the schema and migrations.

After changing `src/db/schema.ts`, generate a migration with:

```bash
pnpm exec drizzle-kit generate
```

Migrations run automatically when the app starts through `DatabaseProvider`.
