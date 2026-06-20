## Component Structure

One component per file. One named helper per file.

Extract additional components into separate files even when private — colocate only when separation would harm understanding or the framework requires it. Inline callbacks and short expressions don't count as helpers.

Extract non-trivial helpers into feature-level files. A helper may stay colocated only when trivial, used once, and tightly coupled to the file's primary export.

Prefer: small focused components · explicit composition · reusable primitives · predictable file structure

Avoid: deep abstractions · oversized files · component-local utility accumulation · mixing data access with presentation

---

## Primitives & Locations

Prefer extending existing primitives before introducing new UI systems.

| Type                                                                                                       | Location                                                                      |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| UI primitives (`Screen` `Card` `Button` `Input` `Badge` `Text` `Dialog` `BottomSheet` `EmptyState` `Icon`) | `src/components/ui`                                                           |
| Styled wrappers (third-party)                                                                              | `src/components/styled`                                                       |
| Shared providers                                                                                           | `src/components/database-provider.tsx`, `src/components/common-providers.tsx` |

Feature-specific UI stays close to the owning feature.

---

## Helper & Utility Placement

- Feature-level helpers (formatting, labels, status mappings, display transforms) → `src/features/<name>/display.ts`
- Cross-feature domain-neutral utilities → `src/lib/utils`
- Do not accumulate helpers in route screens or large component files.
- Do not place generic utilities inside component files. Avoid duplication across features.

---

## Abstractions

Introduce only when duplication is meaningful, readability improves, reuse is proven, or complexity is reduced. Not for theoretical reuse.

---

## State Locality

Keep state as close as possible to where it is used. Do not lift state into a parent unless the parent renders from it, coordinates sibling components with it, or must commit the final value.

- Good parent state: visibility toggles, selected IDs used outside a child, saved values that affect the surrounding screen.
- Good child state: text input drafts, search queries, filters, pending selections, transient loading/error state used only inside that child.
- Prefer a focused child component, memo-wrapped when useful, over making a parent re-render for every keystroke or local interaction.
- Pass final committed changes up through callbacks.

---

## Ownership

| Layer                        | Owns                                                  |
| ---------------------------- | ----------------------------------------------------- |
| UI components                | rendering, prepared data display                      |
| Feature hooks & repositories | orchestration, derived data, DB logic, business rules |

UI components must not access the database or own business logic.
