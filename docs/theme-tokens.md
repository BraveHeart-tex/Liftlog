## Theme Tokens

Prefer semantic theme tokens from `global.css`.

Use tokens instead of raw visual values whenever possible.

Do not hardcode:

- colors
- font sizes
- radius values
- theme-dependent styling values

## Colors

Preferred color tokens:

```txt
bg-background
bg-card
bg-popover
bg-primary
bg-secondary
bg-muted
bg-accent
bg-input
bg-success
bg-warning
bg-danger
bg-info

text-foreground
text-card-foreground
text-popover-foreground
text-primary-foreground
text-secondary-foreground
text-muted-foreground
text-accent-foreground
text-danger-foreground
text-success
text-warning
text-danger
text-info
text-progress-up
text-progress-same
text-progress-down

border-border
border-ring
```

## Typography

Preferred typography tokens:

```txt
text-h1
text-h2
text-h3
text-body
text-body-medium
text-small
text-caption
```

Use the shared `Text` primitive when possible.

Avoid ad-hoc font sizes.

## Radius

Preferred radius tokens:

```txt
rounded-sm
rounded-md
rounded-lg
rounded-xl
```

Avoid arbitrary radius values unless a component has a specific native/platform requirement.
