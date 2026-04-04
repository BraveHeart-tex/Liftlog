export function joinClassNames(
  ...values: (string | false | null | undefined)[]
) {
  return values.filter(Boolean).join(" ");
}
