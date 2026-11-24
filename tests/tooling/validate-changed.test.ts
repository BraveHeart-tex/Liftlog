import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';

const script = resolve('scripts/validate-changed.mjs');
const directories: string[] = [];

// A fake `pnpm` first on PATH: logs every call, writes output for the stage log and exits
// with the code FAKE_PNPM_FAIL names for that stage, so no real check runs.
const fakePnpm = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs')
const args = process.argv.slice(2)
appendFileSync(process.env.FAKE_PNPM_LOG, JSON.stringify(args) + '\\n')
process.stdout.write('child output ' + args.join(' ') + '\\n')
const stage = args[1]
const [failing, code] = (process.env.FAKE_PNPM_FAIL || '').split(':')
process.exit(failing === stage ? Number(code) : 0)
`;

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'validate-changed-'));
  directories.push(dir);
  const work = join(dir, 'repo');
  const bin = join(dir, 'bin');
  mkdirSync(work);
  mkdirSync(bin);
  writeFileSync(join(bin, 'pnpm'), fakePnpm);
  chmodSync(join(bin, 'pnpm'), 0o755);
  const git = (...args: string[]) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=test',
        '-c',
        'user.email=test@example.com',
        '-c',
        'commit.gpgsign=false',
        ...args
      ],
      { cwd: work, encoding: 'utf8' }
    ).trim();
  const write = (file: string, text = file) =>
    writeFileSync(join(work, file), text);
  git('init', '-q');

  for (const file of ['a.ts', 'b.md', 'c.ts']) {
    write(file);
  }

  git('add', '.');
  git('commit', '-qm', 'initial');

  return { dir, work, git, write };
}

function validate(
  { dir, work }: { dir: string; work: string },
  args: string[] = [],
  fail = ''
) {
  const log = join(dir, 'calls.log');
  writeFileSync(log, '');
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: work,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${join(dir, 'bin')}${delimiter}${process.env.PATH}`,
      FAKE_PNPM_LOG: log,
      FAKE_PNPM_FAIL: fail
    }
  });
  const calls = readFileSync(log, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as string[]);

  return { ...result, calls };
}

const tsCheck = ['run', 'ts-check'];
const eslint = (...files: string[]) => [
  'exec',
  'eslint',
  '--no-warn-ignored',
  ...files
];
const prettier = (...files: string[]) => [
  'exec',
  'prettier',
  '--check',
  '--ignore-unknown',
  ...files
];
const appTests = ['run', 'test'];

afterEach(() => {
  for (const dir of directories.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Passing changed files to eslint and prettier by hand broke on shell word splitting and
// on deleted paths; the runner must pick the files and stage order itself.
test('runs every stage in order on changed and untracked files, never deleted ones', () => {
  const setup = repo();
  setup.write('a.ts', 'changed');
  setup.write('b.md', 'changed');
  setup.write('d.tsx');
  rmSync(join(setup.work, 'c.ts'));

  const { status, calls, stdout } = validate(setup);

  assert.equal(status, 0, stdout);
  assert.deepEqual(calls, [
    tsCheck,
    eslint('a.ts', 'd.tsx'),
    prettier('a.ts', 'b.md', 'd.tsx'),
    appTests
  ]);
});

test('--base includes files committed since that commit', () => {
  const setup = repo();
  const base = setup.git('rev-parse', 'HEAD');
  setup.write('e.ts');
  setup.git('add', 'e.ts');
  setup.git('commit', '-qm', 'second');

  assert.deepEqual(validate(setup).calls, []);
  assert.deepEqual(validate(setup, ['--base', base]).calls, [
    tsCheck,
    eslint('e.ts'),
    prettier('e.ts'),
    appTests
  ]);
});

test('the first failing stage stops the run with its exit code', () => {
  const setup = repo();
  setup.write('a.ts', 'changed');

  const { status, calls, stdout } = validate(setup, [], 'eslint:3');

  assert.equal(status, 3);
  assert.deepEqual(calls, [tsCheck, eslint('a.ts')]);
  assert.match(stdout, /^SKIP prettier$/m);
  assert.match(stdout, /^SKIP test$/m);
});

test('a Markdown-only change runs prettier alone', () => {
  const setup = repo();
  setup.write('b.md', 'changed');

  const { status, calls } = validate(setup);

  assert.equal(status, 0);
  assert.deepEqual(calls, [prettier('b.md')]);
});

test('prints START and PASS or FAIL with a log per stage, then a summary', () => {
  const setup = repo();
  setup.write('a.ts', 'changed');

  const { stdout } = validate(setup, [], 'test:1');
  const lines = stdout.trim().split('\n');
  const result = (stage: string, outcome: string) => {
    const line = lines.find(text => text.startsWith(`${outcome} ${stage} `));
    assert.ok(line, `${outcome} ${stage} in:\n${stdout}`);
    const log = line.split(' ').at(-1) as string;
    assert.ok(existsSync(log), log);

    return readFileSync(log, 'utf8');
  };

  assert.deepEqual(
    lines.filter(line => line.startsWith('START ')),
    ['START ts-check', 'START eslint', 'START prettier', 'START test']
  );
  assert.match(result('ts-check', 'PASS'), /child output run ts-check/);
  assert.match(result('eslint', 'PASS'), /child output exec eslint/);
  assert.match(result('prettier', 'PASS'), /child output exec prettier/);
  assert.match(result('test', 'FAIL'), /child output run test/);
  assert.doesNotMatch(stdout, /child output/);
  assert.match(
    lines.at(-1) as string,
    /^Summary: FAIL - ts-check PASS, eslint PASS, prettier PASS, test FAIL \(exit 1\)$/
  );
});
