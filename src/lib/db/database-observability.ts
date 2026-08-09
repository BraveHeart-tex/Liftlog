import { withObservabilitySpan } from '@/src/lib/observability/observability-span';

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
  return withObservabilitySpan(
    {
      name: options.operation,
      op: 'db',
      onlyIfParent: true,
      attributes: getSpanAttributes(options)
    },
    operation as () => T
  );
}
