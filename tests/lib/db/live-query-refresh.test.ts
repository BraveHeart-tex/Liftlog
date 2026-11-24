import {
  getLiveQueryRefreshVersion,
  refreshLiveQueries,
  subscribeToLiveQueryRefresh
} from '@/src/lib/db/live-query-refresh';
import assert from 'node:assert/strict';

test('notifies mounted readers and advances the refresh version', () => {
  let notifications = 0;
  const unsubscribe = subscribeToLiveQueryRefresh(() => {
    notifications += 1;
  });
  const before = getLiveQueryRefreshVersion();

  refreshLiveQueries();

  assert.equal(getLiveQueryRefreshVersion(), before + 1);
  assert.equal(notifications, 1);

  unsubscribe();
  refreshLiveQueries();
  assert.equal(notifications, 1);
});
