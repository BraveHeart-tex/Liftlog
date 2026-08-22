# Styling

Read this when changing NativeWind classes, theme tokens, typography, inputs, or third-party component styling.

## Tokens and components

- Use NativeWind `className` with semantic tokens from `global.css` and the shared `cn` helper. Keep merge behavior centralized; do not add local merge helpers.
- Use the shared text primitive and typography classes.
- Keep colors, font sizes, radii, and theme values in tokens. Inline styles are for animation, native-only props, or layout edge cases.
- Wrap third-party components with multiple style props in styled project wrappers. Do not bypass project styling with direct imports.
- NativeWind is preview-versioned: use `styled(...)`; do not use `remapProps` or `cssInterop`.
- Use NativeWind safe-area utilities for static padding. Use numeric insets only for calculations or native/third-party props that require numbers. Screen and bottom-sheet offsets are defined in [`layout.md`](layout.md) and [`bottom-sheet.md`](bottom-sheet.md).
- Use raw theme tokens only for native or third-party props that cannot consume classes.
- Keep line-height local to typography classes; React Native treats line height as layout height, so do not add global `lineHeight` tokens.

## Inputs

`Input` is a primitive. Its `className` styles the native text input directly, so give its size explicitly. Defaults are 12px horizontal and 4px vertical padding:

```tsx
<Input className="h-14" accessibilityLabel="Name" />
```

Compose conventional fields with `Field`, `FieldLabel`, `FieldDescription`, and `FieldError`. Use `invalid` for the input state:

```tsx
<Field>
  <FieldLabel>Name</FieldLabel>
  <Input accessibilityLabel="Name" invalid={Boolean(error)} />
  {error ? <FieldError>{error}</FieldError> : null}
</Field>
```

Use the existing layout for search, set-entry, multiline, and selector controls. For a conventional text field:

```tsx
<Field>
  <FieldLabel>Template name</FieldLabel>
  <Input
    value={name}
    onChangeText={setName}
    placeholder="e.g. Push day"
    accessibilityLabel="Template name"
  />
</Field>
```

Use `BottomSheetInput` for the same composition inside a bottom sheet. Keep placeholders when they provide an example or extra guidance; visible labels already provide the field name. Use `InputGroup` and `InputSlot` for icons or controls around an input; the group owns the shell, so remove the input's shell with direct classes.
