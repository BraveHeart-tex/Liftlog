export const MUSCLE_GROUP = {
  abs: 'abs',
  adductors: 'adductors',
  biceps: 'biceps',
  brachialis: 'brachialis',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  frontDelts: 'front delts',
  glutes: 'glutes',
  grip: 'grip',
  hamstrings: 'hamstrings',
  hipFlexors: 'hip flexors',
  lats: 'lats',
  lowerBack: 'lower back',
  obliques: 'obliques',
  quads: 'quads',
  rearDelts: 'rear delts',
  rotatorCuff: 'rotator cuff',
  shoulders: 'shoulders',
  sideDelts: 'side delts',
  triceps: 'triceps',
  upperBack: 'upper back',
  upperChest: 'upper chest',
  upperTraps: 'upper traps'
} as const;

export const CATEGORY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Machine', value: 'machine' },
  { label: 'Cable', value: 'cable' },
  { label: 'Bodyweight', value: 'bodyweight' }
] as const;

type BaseCategoryFilter = (typeof CATEGORY_FILTERS)[number]['value'];

export type CategoryFilter = BaseCategoryFilter | 'custom';

export type ExerciseCategory = Exclude<BaseCategoryFilter, 'all'>;
