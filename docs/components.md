## Component Structure

Prefer:

- small focused components
- explicit composition
- predictable file structure
- reusable primitives

Avoid:

- deeply nested abstractions
- oversized component files
- component-local utility accumulation
- mixing data access with presentation

Default to one React component per file.

Extract additional components into separate files, even when they are private or used only by the parent component. Keep multiple components in one file only when separating them would make the implementation harder to understand or the framework requires colocation.

Default to one named helper function per file. Extract non-trivial helpers into focused feature-level files. A helper may remain colocated only when it is trivial, used once, and tightly coupled to the file's primary export.

Inline callbacks and short expressions used directly by the primary component do not count as additional helper functions.

## Shared Primitives

Prefer shared UI primitives:

- Screen
- Card
- Button
- Input
- Badge
- Text
- Dialog
- BottomSheet
- EmptyState
- Icon

Prefer extending existing primitives before introducing new UI systems.

## Shared Locations

Shared UI primitives:

```txt id="cvvkjs"
src/components/ui
```

Styled wrappers:

```txt id="5t3d5g"
src/components/styled
```

Shared providers:

```txt id="6r39xw"
src/components/database-provider.tsx
src/components/common-providers.tsx
```

Feature-specific UI should remain close to the owning feature.

## Helper Placement

Avoid accumulating multiple named helper functions in one file.

Do not keep repeated:

- formatting helpers
- labels
- status mappings
- display transforms
- presentation logic

inside:

- route screens
- large component files

Prefer feature-level helper files such as:

```txt id="r46m79"
src/features/steps/display.ts
```

Keep feature-specific logic inside the owning feature directory whenever possible.

## Utility Placement

Use:

```txt id="fdt6si"
src/lib/utils
```

only for:

- cross-feature
- domain-neutral
- reusable utilities

Do not place generic reusable utilities inside component files.

Avoid utility duplication across features.

## Abstraction Rules

Avoid deep abstraction layers early.

Prefer:

- explicit code
- composition
- reusable primitives
- lightweight helpers

Introduce abstractions only when:

- duplication becomes meaningful
- readability improves
- reuse is proven
- complexity is reduced

Do not abstract prematurely for theoretical reuse.

## Component Ownership Boundaries

UI components should:

- focus on rendering
- receive prepared data
- avoid direct database access
- avoid owning business logic

Feature hooks and repositories should own:

- orchestration
- derived data
- database logic
- business rules
