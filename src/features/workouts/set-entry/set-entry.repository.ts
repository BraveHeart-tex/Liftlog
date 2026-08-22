// Set-entry persistence API. Set mutations stay behind this capability
// boundary even though they share workout tables with active sessions.
export {
  createCompletedSet,
  deleteCompletedSet,
  getSetsByWorkoutExerciseIdQuery,
  getSetsForWorkoutQuery,
  updateCompletedSet
} from '@/src/features/workouts/shared/workout.repository';
