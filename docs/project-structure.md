## File Organization

```txt
src/
  app/
    (tabs)/
      exercises/
      log/
      settings/
      steps/
      workout/
    exercises/
    workouts/

  assets/
    sounds/

  components/
    styled/
    ui/

  db/
    migrations/

  features/
    exercises/
    progress/
    settings/
    steps/
    workouts/

  lib/
    db/
    utils/

  theme/
```

## Directory Responsibilities

### app/

Route definitions and screen entry points.

Route screens should remain:

- lightweight
- orchestration-focused
- feature-driven

Avoid:

- database logic
- large business rules
- complex query construction

### assets/

Static application assets.

Examples:

- sounds
- images
- icons

### components/

Shared reusable UI and infrastructure components.

Structure:

```txt id="jlwm2l"
components/
  styled/
  ui/
```

#### components/ui

Shared application primitives.

Examples:

- Screen
- Card
- Button
- Input
- Badge
- Text
- Dialog
- BottomSheet

#### components/styled

NativeWind-compatible wrappers for third-party components.

Examples:

- StyledScrollView
- StyledFlatList
- StyledBottomSheetFlatList
- StyledTextInput

### db/

Database infrastructure and migrations.

Contains:

- schema
- migrations
- database setup

Generated migration files should remain tool-managed.

### features/

Feature-owned code.

Each feature should own:

- hooks
- repositories
- feature components
- formatting/display helpers
- feature-specific logic

Prefer colocating feature logic inside the owning feature directory.

### lib/

Shared infrastructure and cross-feature utilities.

Structure:

```txt id="kdrpjf"
lib/
  db/
  utils/
```

#### lib/db

Shared database utilities and infrastructure helpers.

#### lib/utils

Cross-feature, domain-neutral reusable utilities.

Avoid placing feature-specific logic here.

### theme/

Theme configuration and semantic design tokens.

Contains:

- semantic tokens
- theme configuration
- shared visual system values

## Organizational Principles

Prefer:

- feature ownership
- colocated feature logic
- reusable primitives
- predictable structure
- shallow hierarchies

Avoid:

- cross-feature leakage
- generic dumping-ground folders
- deeply nested abstractions
- duplicated utilities
- oversized route screens
