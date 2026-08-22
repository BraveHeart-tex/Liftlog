## Styling

Use NativeWind `className` with semantic tokens from `global.css`. Use shared `cn`; do not add local merge helpers.

No hardcoded colors, font sizes, radius, or theme values. Inline styles are only for animation, native-only props, or layout edge cases.

## Third-Party Components

Use styled wrappers for third-party components with multiple style props. Avoid direct imports that bypass project styling.

## NativeWind

- NativeWind is preview-versioned. Do not use `remapProps` or `cssInterop`; use `styled(...)`.
- Use NativeWind safe-area utilities for static safe-area spacing. Reserve numeric safe-area insets for calculations and native/third-party props that need numbers.
- Use raw theme tokens only for native/third-party props that cannot consume classes.
- Do not add global `lineHeight` tokens; React Native treats line height as layout height.

Use the shared text primitive and typography classes.

### Inputs

Inputs are primitives. Their `className` styles the native text input directly,
so sizing is explicit. They default to 12px horizontal and 4px vertical
padding:

```tsx
<Input className="h-14" accessibilityLabel="Name" />
```

Compose labels and supporting text with `Field`, `FieldLabel`,
`FieldDescription`, and `FieldError`. Use `invalid` for the input state:

```tsx
<Field>
  <FieldLabel>Name</FieldLabel>
  <Input accessibilityLabel="Name" invalid={Boolean(error)} />
  {error ? <FieldError>{error}</FieldError> : null}
</Field>
```

Use `FloatingField` for conventional single-line text fields when the label
should share the field’s vertical space. It supports both regular and
bottom-sheet inputs, preserves the visible label for accessibility, and keeps
search, set-entry, multiline, and selector controls on their existing layouts:

```tsx
<FloatingField
  label="Template name"
  inputProps={{
    value: name,
    onChangeText: setName,
    placeholder: 'e.g. Push day'
  }}
/>
```

Use `InputGroup` and `InputSlot` for icons or controls around an input. The
group owns the shell; the input removes its own shell with direct classes.
