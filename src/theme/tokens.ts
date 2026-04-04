export const colors = {
  background: "#09090B",
  card: "#111113",
  primary: "#3B82F6",
  primaryForeground: "#F8FAFC",
  border: "#27272A",
  mutedForeground: "#A1A1AA",
} as const;

export const tabBarTheme = {
  activeTintColor: colors.primary,
  backgroundColor: colors.card,
  borderColor: colors.border,
  inactiveTintColor: colors.mutedForeground,
  sceneBackgroundColor: colors.background,
} as const;
