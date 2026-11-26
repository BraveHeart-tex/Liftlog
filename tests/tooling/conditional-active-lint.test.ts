import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const eslint = join(root, 'node_modules/eslint/bin/eslint.js');

type LintMessage = { ruleId: string | null; message: string };

// The ESLint Node API cannot load the flat config inside Jest, so lint through the CLI.
function lint(source: string, filename: string): LintMessage[] {
  const result = spawnSync(
    process.execPath,
    [eslint, '--stdin', '--stdin-filename', filename, '--format', 'json'],
    { cwd: root, encoding: 'utf8', input: source }
  );
  const [file] = JSON.parse(result.stdout) as [{ messages: LintMessage[] }];

  return file.messages.filter(m => m.ruleId === 'no-restricted-syntax');
}

const snippet = (expression: string) =>
  `export const className = (cond: boolean) => ${expression};\n`;

// react-native-css remounts a component whose active: rules appear or disappear, so a
// conditional active: class reset Pressable state and children.
test.each(['src/components/sample.tsx', 'src/app/sample.tsx'])(
  'rejects a conditional active: class in %s',
  filename => {
    const messages = lint(snippet("cond && 'active:opacity-70'"), filename);

    assert.equal(messages.length, 1);
    assert.match(
      messages[0].message,
      /cond \? 'active:opacity-70' : 'active:opacity-100'/
    );
  }
);

test('accepts an active: class on every branch', () => {
  assert.deepEqual(
    lint(
      snippet("cond ? 'active:opacity-70' : 'active:opacity-100'"),
      'src/components/sample.tsx'
    ),
    []
  );
});
