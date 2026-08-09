import { startSpan, type Span } from '@sentry/react-native';

const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;

export interface DatabaseSpanOptions {
  operation: string;
  feature?: string;
  access?: 'read' | 'write';
  phase?: string;
  liveRefresh?: boolean;
  rowCount?: number;
}

type DatabaseOperation<T> = () => T;

function getSpanAttributes({
  operation,
  feature,
  access,
  phase,
  liveRefresh,
  rowCount
}: DatabaseSpanOptions) {
  return {
    'db.system': 'sqlite',
    'db.operation': operation,
    ...(feature ? { 'db.feature': feature } : {}),
    ...(access ? { 'db.access': access } : {}),
    ...(phase ? { 'db.phase': phase } : {}),
    ...(liveRefresh === undefined ? {} : { 'db.live_refresh': liveRefresh }),
    ...(rowCount === undefined ? {} : { 'db.row_count': rowCount })
  };
}

function setSpanStatus(span: Span, code: number) {
  try {
    span.setStatus({ code: code as 1 | 2 });
  } catch {
    // Observability must never change database behavior.
  }
}

function isPromiseLike<T>(value: T): value is T & PromiseLike<Awaited<T>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

export function withDatabaseSpan<T>(
  options: DatabaseSpanOptions,
  operation: DatabaseOperation<T>
): T;

export function withDatabaseSpan<T>(
  options: DatabaseSpanOptions,
  operation: DatabaseOperation<Promise<T>>
): Promise<T>;

export function withDatabaseSpan<T>(
  options: DatabaseSpanOptions,
  operation: DatabaseOperation<T> | DatabaseOperation<Promise<T>>
): T | Promise<T> {
  let operationStarted = false;
  let operationFailed = false;
  let operationError: unknown;
  let operationCompleted = false;
  let completedResult: T | Promise<T> | undefined;

  const run = (span: Span) => {
    operationStarted = true;

    try {
      const result = operation();

      if (isPromiseLike(result)) {
        return result.then(
          value => {
            operationCompleted = true;
            setSpanStatus(span, SPAN_STATUS_OK);

            return value;
          },
          error => {
            operationFailed = true;
            operationError = error;
            setSpanStatus(span, SPAN_STATUS_ERROR);

            throw error;
          }
        );
      }

      operationCompleted = true;
      completedResult = result;
      setSpanStatus(span, SPAN_STATUS_OK);

      return result;
    } catch (error) {
      operationFailed = true;
      operationError = error;
      setSpanStatus(span, SPAN_STATUS_ERROR);

      throw error;
    }
  };

  try {
    return startSpan(
      {
        name: options.operation,
        op: 'db',
        onlyIfParent: true,
        attributes: getSpanAttributes(options)
      },
      run
    ) as T | Promise<T>;
  } catch (error) {
    if (operationFailed) {
      throw operationError;
    }

    if (operationCompleted) {
      return completedResult as T | Promise<T>;
    }

    if (!operationStarted) {
      return operation();
    }

    throw error;
  }
}
