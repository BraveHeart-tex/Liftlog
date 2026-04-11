export function formatInputNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function getCategoryLabel(category: string) {
  return category
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
