import { sizeLimits } from '@/scripts/ticket-lint.mjs';
import { clsx } from 'clsx';

// Catches a tooling project that cannot resolve @/ imports, transform ESM scripts
// or load pnpm-installed packages.
test('tooling project resolves @/ scripts and pnpm packages', () => {
  expect(sizeLimits).toEqual(expect.objectContaining({ Proofs: 6 }));
  expect(clsx('tooling', false && 'skipped')).toBe('tooling');
});
