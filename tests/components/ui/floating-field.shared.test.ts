import {
  getFloatingFieldAnimation,
  getFloatingFieldValue,
  shouldFloatFloatingField
} from '@/src/components/ui/floating-field.shared';
import assert from 'node:assert/strict';
import test from 'node:test';

test('uses the controlled value when present', () => {
  assert.equal(
    getFloatingFieldValue({
      controlledValue: 'Template',
      defaultValue: 'Default',
      uncontrolledValue: 'Uncontrolled'
    }),
    'Template'
  );
});

test('uses the uncontrolled value before falling back to the default', () => {
  assert.equal(
    getFloatingFieldValue({
      defaultValue: 'Default',
      uncontrolledValue: 'Uncontrolled'
    }),
    'Uncontrolled'
  );
  assert.equal(getFloatingFieldValue({ defaultValue: 'Default' }), 'Default');
  assert.equal(getFloatingFieldValue({}), '');
});

test('floats when focused or populated', () => {
  assert.equal(shouldFloatFloatingField({ focused: true, value: '' }), true);
  assert.equal(
    shouldFloatFloatingField({ focused: false, value: 'Name' }),
    true
  );
  assert.equal(shouldFloatFloatingField({ focused: false, value: '' }), false);
});

test('disables animation when reduced motion is enabled', () => {
  assert.deepEqual(
    getFloatingFieldAnimation({ reduceMotion: true, shouldFloat: true }),
    { duration: 0, toValue: 1 }
  );
  assert.deepEqual(
    getFloatingFieldAnimation({ reduceMotion: false, shouldFloat: false }),
    { duration: 180, toValue: 0 }
  );
});
