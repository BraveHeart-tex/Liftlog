import { runDevSeedIfNeeded } from '@/src/db/dev-seed';
import { runSeedIfNeeded } from '@/src/db/seed';
import {
  MAX_REST_TIMER_SECONDS,
  MIN_REST_TIMER_SECONDS
} from '@/src/features/rest-timer/rest-timer.constants';
import {
  getSettingsSnapshot,
  MAX_REST_TIMER_PRESETS
} from '@/src/features/settings/settings.repository';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';

afterEach(closeTestDatabases);

// Catches a fresh dev database starting without rest timer presets, which
// leaves device checks of the Rest timer sheet with no Presets to show.
test('dev seed leaves valid rest timer presets on a fresh database', async () => {
  const { db } = await createMigratedTestDatabase();

  runSeedIfNeeded(db);
  runDevSeedIfNeeded(db);

  const { restTimerPresets } = getSettingsSnapshot(db);

  expect(restTimerPresets.length).toBeGreaterThanOrEqual(3);
  expect(restTimerPresets.length).toBeLessThanOrEqual(MAX_REST_TIMER_PRESETS);
  expect(new Set(restTimerPresets.map(preset => preset.id)).size).toBe(
    restTimerPresets.length
  );

  for (const preset of restTimerPresets) {
    expect(preset.name).not.toBe('');
    expect(preset.durationSeconds).toBeGreaterThanOrEqual(
      MIN_REST_TIMER_SECONDS
    );
    expect(preset.durationSeconds).toBeLessThanOrEqual(MAX_REST_TIMER_SECONDS);
  }
});
