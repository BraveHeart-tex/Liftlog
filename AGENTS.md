# AGENTS.md

Before broad file discovery, honor ignore patterns in .codexignore.

## Stack

- Expo / React Native
- Expo Router
- TypeScript
- NativeWind
- Drizzle ORM + Expo SQLite

## Core Rules

- Keep solutions simple.
- Follow existing patterns before introducing abstractions.
- Optimize for mobile UX and low-friction interactions.
- Avoid unnecessary comments.
- Do not add production dependencies without approval.
- Avoid unrelated refactors.
- Avoid web-only assumptions.

## Generated Files

Do not inspect or modify generated files unless explicitly required.

Ignore by default:

```txt
src/db/migrations/**
src/db/migrations/meta/**
src/db/migrations/*.sql
src/db/migrations/_journal.json
src/db/migrations/migrations.js
drizzle/**
**/*.generated.*
```

## TypeScript

- Use TypeScript.
- Prefer `interface` for object-shaped structures.
- Prefer `type` for unions, utility types, inferred schema types, and mapped types.

## Styling

- Use NativeWind `className`.
- Use semantic theme tokens from `global.css`.
- Do not hardcode colors or typography values unless unavoidable.
- Use shared `cn` helper from `@/src/lib/utils/cn`.
- Avoid inline styles except for animation, native-only props, or unavoidable layout edge cases.

## Components

- Prefer shared UI primitives from `src/components/ui`.
- Use styled wrappers from `src/components/styled` for third-party components with multiple style props.
- Keep components small and simple.
- Avoid deep abstraction layers.

## Layout

- Prefer shared `Screen` primitive for screens.
- Use local SafeAreaView wrapper instead of direct safe-area-context imports.
- Use scroll/list wrappers for vertically overflowing content.
- Avoid unnecessary `flex-1` usage on non-scroll stacks.

## Data Access

Required flow:

```txt
Screen -> feature hook -> repository -> Drizzle
```

Rules:

- Do not call `useDrizzle` in route screens.
- Repositories own query construction and database invariants.
- Use `useLiveWithFallback` for reactive reads.

## Validation

After changes run:

```sh
pnpm run ts-check
pnpm run lint
pnpm run prettier:check
```

Run additionally for broad cleanup or export deletion:

```sh
pnpm run knip
```

Never claim completion while checks fail.

## Task-Specific Docs

Read relevant docs before implementation:

- docs/project-overview.md
- docs/engineering-principles.md
- docs/styling.md
- docs/theme-tokens.md
- docs/layout.md
- docs/data-access.md
- docs/database.md
- docs/components.md
- docs/bottom-sheet.md
- docs/ux-display.md
- docs/project-structure.md

## Token Discipline

- Read the minimum number of files necessary.
- Use `rg` before opening files.
- Avoid inspecting unrelated files.
- Prefer surgical edits over broad rewrites.
- Do not print full file contents unless requested.
