# Engineering Principles

Simple > clever. Working > perfect. Explicit > abstract. Readable > smart. Follow existing patterns before introducing new ones. Optimize for mobile UX and low-friction interactions.

---

## Dependencies

No new prod dependencies without approval. Prefer existing utilities, primitives, or small explicit implementations over libraries for formatting helpers, simple hooks, lightweight UI behavior, or one-off utilities.

---

## Comments

Only for non-obvious edge cases, platform-specific behavior, complex invariants, or unusual constraints. Prefer self-explanatory code and naming.

---

## TypeScript

- `interface` → props, params, state, context, object-shaped contracts
- `type` → unions, literals, mapped/conditional types, inferred ORM aliases, utility compositions

Explicit types when they aid clarity. No unnecessary generic complexity.

---

## React Native / Expo

No browser APIs, DOM assumptions, CSS-only solutions, or web-only layout patterns. All solutions must work in RN + Expo mobile environments.

---

## Avoid

- Unnecessary abstractions, unrelated refactors, hardcoded design values
- `flex-1` overuse, deep hierarchies, tiny touch targets, excessive prop drilling
- Logic-heavy route screens, direct DB access in UI, unnecessary rerenders
- Drizzle queries inside components, direct third-party imports when wrappers exist
- Manually editing generated migrations or patching the SQLite DB directly
