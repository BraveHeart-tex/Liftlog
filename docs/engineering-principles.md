# Engineering Principles

## Core Principles

- Keep solutions simple.
- Avoid abstractions unless they clearly improve readability or reuse.
- Prefer working features over perfect architecture.
- Follow existing project patterns before introducing new ones.
- Optimize for mobile UX and low-friction interactions.
- Prioritize readability and maintainability over cleverness.
- Prefer explicit code over deep abstraction layers.

## Dependency Policy

Do not add production dependencies without approval.

Before adding a dependency:

- prefer existing utilities
- prefer existing primitives
- prefer small explicit implementations

Avoid libraries for:

- small formatting helpers
- simple hooks
- lightweight UI behavior
- one-off utilities

## Comment Policy

Avoid comments unless they are necessary to explain:

- non-obvious edge cases
- platform-specific behavior
- complex invariants
- unusual implementation constraints

Prefer self-explanatory code and naming.

## TypeScript

Use TypeScript throughout the codebase.

Prefer `interface` for:

- props
- params
- state objects
- context values
- object-shaped contracts

Prefer `type` for:

- unions
- literals
- mapped types
- conditional types
- inferred ORM/schema aliases
- utility compositions

Prefer explicit types when they improve clarity.

Avoid unnecessary generic complexity.

## React Native / Expo Assumptions

Solutions must work correctly in:

- React Native
- Expo
- mobile environments

Avoid:

- browser-only APIs
- DOM assumptions
- CSS-only solutions
- web-only layout patterns

Prefer React Native-compatible patterns and APIs.

## Common Pitfalls

Avoid:

- unnecessary abstractions
- unrelated refactors
- hardcoded design values
- overusing `flex-1`
- deep component hierarchies
- tiny touch targets
- excessive prop drilling
- unnecessary rerenders
- logic-heavy route screens
- direct database access in UI components

Do not:

- build Drizzle queries inside components
- import third-party components directly when wrappers exist
- manually modify generated migration files
- manually patch the SQLite database

Prefer:

- feature-level organization
- reusable primitives
- compact readable UI
- predictable patterns
- focused components
