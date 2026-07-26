interface CanLoadExerciseHistoryPageOptions {
  hasMoreHistory: boolean;
  isLoadingMore: boolean;
  hasActiveRequest: boolean;
  hasLoadMoreError: boolean;
}

export function canLoadExerciseHistoryPage({
  hasMoreHistory,
  isLoadingMore,
  hasActiveRequest,
  hasLoadMoreError
}: CanLoadExerciseHistoryPageOptions) {
  return (
    hasMoreHistory && !isLoadingMore && !hasActiveRequest && !hasLoadMoreError
  );
}

export function getNextExerciseHistoryLimit(
  currentLimit: number,
  pageSize: number
) {
  return currentLimit + pageSize;
}

export function didExerciseHistoryPageFinish(
  previousWorkoutUpdatedAt: Date | undefined,
  previousSetUpdatedAt: Date | undefined,
  workoutUpdatedAt: Date | undefined,
  setUpdatedAt: Date | undefined
) {
  return Boolean(
    workoutUpdatedAt &&
    workoutUpdatedAt !== previousWorkoutUpdatedAt &&
    setUpdatedAt &&
    setUpdatedAt !== previousSetUpdatedAt
  );
}
