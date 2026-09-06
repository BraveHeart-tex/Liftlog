import type { DrizzleDb } from '@/src/db/client';
import { appMeta } from '@/src/db/schema';
import { withDatabaseSpan } from '@/src/lib/db/database-observability';
import { eq } from 'drizzle-orm';
import type { UpdatePersistence } from './update-coordinator';
import type { UpdateCache } from './update.types';

export const UPDATE_CACHE_KEY = 'app_updates.discovery_cache_v1';

function parseCache(value: string | undefined): UpdateCache | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<UpdateCache>;

    if (!Number.isFinite(parsed.lastSuccessfulCheckAt)) {
      return undefined;
    }

    return parsed as UpdateCache;
  } catch {
    return undefined;
  }
}

export function createUpdateRepository(db: DrizzleDb): UpdatePersistence {
  return {
    read() {
      return withDatabaseSpan(
        {
          operation: 'appUpdates.readDiscoveryCache',
          feature: 'app_updates',
          access: 'read'
        },
        () =>
          parseCache(
            db
              .select()
              .from(appMeta)
              .where(eq(appMeta.key, UPDATE_CACHE_KEY))
              .get()?.value
          )
      );
    },
    write(cache) {
      withDatabaseSpan(
        {
          operation: 'appUpdates.writeDiscoveryCache',
          feature: 'app_updates',
          access: 'write'
        },
        () =>
          db
            .insert(appMeta)
            .values({ key: UPDATE_CACHE_KEY, value: JSON.stringify(cache) })
            .onConflictDoUpdate({
              target: appMeta.key,
              set: { value: JSON.stringify(cache) }
            })
            .run()
      );
    }
  };
}
