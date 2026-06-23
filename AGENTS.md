# AGENTS.md

Honor `.codexignore` before broad file discovery.

## Stack

Expo · React Native · Expo Router · TypeScript · NativeWind · Drizzle ORM + Expo SQLite

## Rules

- Keep solutions simple. Follow existing patterns before adding abstractions.
- Optimize for mobile UX and low-friction interactions.
- No unnecessary comments. No unapproved prod dependencies. No unrelated refactors.
- No web-only assumptions.
- Use `scheduleIdleTask` from `src/lib/utils/schedule-idle-task` instead of deprecated `InteractionManager.runAfterInteractions`.

## Ignore (generated files)

```

src/db/migrations/**
drizzle/** \*_/_.generated.\*

```

## TypeScript

- `interface` for object shapes. `type` for unions, utilities, inferred schema types, mapped types.

## Styling

- NativeWind `className` with semantic tokens from `global.css`.
- Use `cn` from `@/src/lib/utils/cn`. No hardcoded colors/typography.
- No inline styles except animation, native-only props, or unavoidable layout edge cases.

## Components

- Prefer UI primitives from `src/components/ui`.
- Styled wrappers from `src/components/styled` for third-party components with multiple style props.
- One component per file. One named helper per file. Extract when reused or non-trivial.
- Don't colocate extras just because they're private. No deep abstraction layers.

## Layout

- Use shared `Screen` primitive. Local `SafeAreaView` wrapper (no direct safe-area-context imports).
- Scroll/list wrappers for overflowing content. Avoid unnecessary `flex-1` on non-scroll stacks.

## Data Access

Flow: `Screen → feature hook → repository → Drizzle`

- No `useDrizzle` in route screens.
- Repositories own query construction and DB invariants.
- `useLiveWithFallback` for reactive reads.

## Docs (read only what matches your task)

| Working on…                 | Read                                                        |
| --------------------------- | ----------------------------------------------------------- |
| UI / screens                | `styling` `theme-tokens` `layout` `components` `ux-display` |
| Bottom sheets               | `bottom-sheet`                                              |
| Data / DB                   | `data-access` `database`                                    |
| New feature / file creation | `project-structure`                                         |
| Unclear scope               | `project-overview` `engineering-principles`                 |

## Token Discipline

- `rg` before opening files. Read minimum files needed. Surgical edits only. No full file prints unless asked.
