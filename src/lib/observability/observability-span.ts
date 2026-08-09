import { startSpan, type Span } from '@sentry/react-native';

const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;

export interface ObservabilitySpanOptions {
  name: string;
  op: string;
  onlyIfParent?: boolean;
  attributes?: Record<string, string | number | boolean>;
}

type SpanOperation<T> = () => T;

function setSpanStatus(span: Span, code: number) {
  try {
    span.setStatus({ code: code as 1 | 2 });
  } catch {
    // Observability must never change application behavior.
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

export function withObservabilitySpan<T>(
  options: ObservabilitySpanOptions,
  operation: SpanOperation<T>
): T;

export function withObservabilitySpan<T>(
  options: ObservabilitySpanOptions,
  operation: SpanOperation<Promise<T>>
): Promise<T>;

export function withObservabilitySpan<T>(
  options: ObservabilitySpanOptions,
  operation: SpanOperation<T> | SpanOperation<Promise<T>>
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
        ...options,
        onlyIfParent: options.onlyIfParent ?? true
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

export interface DomainFlowSpanOptions {
  operation: string;
  feature: string;
}

export function withDomainFlowSpan<T>(
  { operation, feature }: DomainFlowSpanOptions,
  callback: SpanOperation<T>
): T;

export function withDomainFlowSpan<T>(
  { operation, feature }: DomainFlowSpanOptions,
  callback: SpanOperation<Promise<T>>
): Promise<T>;

export function withDomainFlowSpan<T>(
  { operation, feature }: DomainFlowSpanOptions,
  callback: SpanOperation<T> | SpanOperation<Promise<T>>
): T | Promise<T> {
  return withObservabilitySpan(
    {
      name: operation,
      op: 'ui.action',
      attributes: {
        'flow.feature': feature,
        'flow.operation': operation
      }
    },
    callback as () => T
  );
}
