// Active-session persistence API. The implementation remains in the shared
// repository until the remaining mixed operations are extracted.
export {
  addExerciseToWorkout,
  completeWorkout,
  createCustomExerciseAndAddToWorkout,
  createWorkout,
  deleteWorkout,
  getActiveWorkoutExerciseDetailQuery,
  getActiveWorkoutExerciseForRestTimerNotification,
  getActiveWorkoutForRestTimerNotification,
  getActiveWorkoutQuery,
  getActiveWorkoutSummaryQuery,
  getRecentWorkoutsQuery,
  getSetsByWorkoutExerciseIdQuery,
  getSetsForWorkoutQuery,
  getWorkoutExercisesQuery,
  getWorkoutExercisesWithExercisesQuery,
  saveActiveWorkoutExerciseDraft,
  updateWorkoutExerciseOrderAndSupersets,
  updateWorkoutExerciseSupersets,
  updateWorkoutName,
  type ActiveWorkoutExerciseDraftBaselineRow,
  type ActiveWorkoutExerciseDraftRow,
  type StagedCustomExercise
} from '@/src/features/workouts/shared/workout.repository';

export { ActiveWorkoutExerciseDraftConflictError } from '@/src/features/workouts/shared/workout.repository';
