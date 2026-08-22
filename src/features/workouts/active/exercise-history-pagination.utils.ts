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

export function didExerciseHistoryPageFinish({
  previousUpdatedAt,
  updatedAt
}: {
  previousUpdatedAt: Date | undefined;
  updatedAt: Date | undefined;
}) {
  return Boolean(updatedAt && updatedAt !== previousUpdatedAt);
}
