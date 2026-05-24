export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
  empty: 48
} as const;

export type IconSize = keyof typeof iconSizes;

export const nativeFontSizes = {
  tabLabel: 10,
  chartAxis: 10,
  restTimerInput: 20,
  restTimerDisplay: 72
} as const;
