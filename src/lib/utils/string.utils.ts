export function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function pluralize(value: number, unit: string) {
  return `${value} ${pluralizeUnit(value, unit)}`;
}

export function pluralizeUnit(value: number, unit: string) {
  return value === 1 ? unit : `${unit}s`;
}
