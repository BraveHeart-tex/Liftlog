export function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function pluralize(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}
