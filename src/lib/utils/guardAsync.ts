export async function guardAsync<T, E = Error>(
  promise: Promise<T>
): Promise<[T, null] | [null, E]> {
  try {
    return [await promise, null];
  } catch (error) {
    return [null, error as E];
  }
}
