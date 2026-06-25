import {
  MAX_STEP_GOAL,
  MIN_STEP_GOAL
} from '@/src/features/steps/steps.constants';

export function isValidStepGoal(goal: number): boolean {
  return (
    Number.isInteger(goal) && goal >= MIN_STEP_GOAL && goal <= MAX_STEP_GOAL
  );
}
