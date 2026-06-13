## Project Structure

```
src/
  app/          # Route screens — lightweight, orchestration-only, no DB/business logic
  assets/       # Static assets (sounds, images, icons)
  components/
    ui/         # Shared primitives: Screen, Card, Button, Input, Badge, Text, Dialog, BottomSheet
    styled/     # NativeWind wrappers: StyledScrollView, StyledFlatList, StyledTextInput, etc.
  db/           # Schema, migrations (tool-managed), DB setup
  features/     # Feature code: hooks, repositories, components, display helpers, feature logic
  lib/
    db/         # Shared DB utilities and infrastructure helpers
    utils/      # Cross-feature, domain-neutral utilities only
  theme/        # Semantic tokens and theme config
```

Feature logic stays colocated in `features/<name>/`. No feature-specific code in `lib/utils/`. No DB or business logic in `app/` screens. No cross-feature leakage or generic dumping-ground folders.
