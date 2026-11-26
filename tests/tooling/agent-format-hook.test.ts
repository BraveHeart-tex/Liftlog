import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const hook = resolve('scripts/agent-format-hook.mjs');
let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(resolve('tests/tooling'), '.format-hook-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

// Catches a hook that leaves `@stylistic/padding-line-between-statements` for validate:changed
// to fail, or one that applies `problem` fixes and drops an import the agent has not used yet.
test('the hook adds a blank line before a return and keeps an unused import', () => {
  const file = join(dir, 'edited.mjs');

  writeFileSync(
    file,
    [
      "import { join } from 'node:path';",
      '',
      'export function next(value) {',
      '  const result = value + 1;',
      '  return result;',
      '}',
      ''
    ].join('\n')
  );
  execFileSync('node', [hook], {
    input: JSON.stringify({ tool_input: { file_path: file } })
  });

  expect(readFileSync(file, 'utf8')).toBe(
    [
      "import { join } from 'node:path';",
      '',
      'export function next(value) {',
      '  const result = value + 1;',
      '',
      '  return result;',
      '}',
      ''
    ].join('\n')
  );
}, 30_000);
