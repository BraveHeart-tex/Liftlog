import {
  SETTINGS_DEFAULTS,
  SETTINGS_KEYS,
  mapSettingsRows
} from '@/src/features/settings/settings.repository';
import assert from 'node:assert/strict';
import test from 'node:test';

test('maps missing settings to defaults', () => {
  assert.deepEqual(mapSettingsRows([]), {
    ...SETTINGS_DEFAULTS,
    restTimerPresets: []
  });
});

test('maps invalid settings to defaults', () => {
  const settings = mapSettingsRows([
    { key: SETTINGS_KEYS.weightUnit, value: 'stone' },
    { key: SETTINGS_KEYS.restTimerDuration, value: '10 seconds' },
    { key: SETTINGS_KEYS.restTimerPresets, value: '{invalid' },
    { key: SETTINGS_KEYS.healthConnectStepsEnabled, value: 'TRUE' },
    { key: SETTINGS_KEYS.stepGoal, value: '999' }
  ]);

  assert.deepEqual(settings, {
    ...SETTINGS_DEFAULTS,
    restTimerPresets: []
  });
});

test('maps valid settings values', () => {
  const settings = mapSettingsRows([
    { key: SETTINGS_KEYS.weightUnit, value: 'lb' },
    { key: SETTINGS_KEYS.restTimerDuration, value: '120' },
    {
      key: SETTINGS_KEYS.restTimerPresets,
      value: JSON.stringify([
        { id: 'preset-1', name: ' Two minutes ', durationSeconds: 120 }
      ])
    },
    { key: SETTINGS_KEYS.healthConnectStepsEnabled, value: 'true' },
    { key: SETTINGS_KEYS.stepGoal, value: '15000' }
  ]);

  assert.deepEqual(settings, {
    weightUnit: 'lb',
    restTimerDuration: 120,
    restTimerPresets: [
      { id: 'preset-1', name: 'Two minutes', durationSeconds: 120 }
    ],
    healthConnectStepsEnabled: true,
    stepGoal: 15000
  });
});
