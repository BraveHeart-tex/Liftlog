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
const toolingTests = ['run', 'test:tooling'];

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

// Tooling tests live in their own Jest project, so `pnpm run test` alone let a broken
// device stack or ticket script pass the done gate.
test.each([
  ['scripts/device-stack.mjs', true],
  ['tests/tooling/device-stack.test.ts', true],
  ['scripts/notes.md', true],
  ['src/a.ts', false]
])('a change to %s runs the tooling stage: %s', (file, tooling) => {
  const setup = repo();
  const dir = file.split('/').slice(0, -1).join('/');
  mkdirSync(join(setup.work, dir), { recursive: true });
  setup.write(file);

  const { status, calls, stdout } = validate(setup);

  assert.equal(status, 0, stdout);
  assert.equal(calls.at(-1)?.join(' ') === toolingTests.join(' '), tooling);
  assert.equal(/^START tooling$/m.test(stdout), tooling);
});

function rebasedIssue(upstreamFile: string) {
  const setup = repo();
  const base = setup.git('rev-parse', 'HEAD');
  const remote = join(setup.dir, 'remote.git');
  execFileSync('git', ['init', '--bare', '-q', remote]);
  setup.git('remote', 'add', 'origin', remote);
  setup.git('push', '-q', 'origin', 'HEAD:main');
  setup.git('switch', '-qc', 'upstream');
  setup.write(upstreamFile, 'upstream\n');
  setup.git('add', '.');
  setup.git('commit', '-qm', 'upstream');
  setup.git('push', '-q', 'origin', 'HEAD:main');
  setup.git('switch', '-qc', 'issue', base);
  setup.write('a.ts', 'issue\n');
  expect(validate(setup, ['--base', base]).status).toBe(0);
  setup.git('add', '.');
  setup.git('commit', '-qm', 'issue');
  setup.git('rebase', '-q', '-X', 'theirs', 'origin/main');

  const pushLog = join(setup.work, '.git', 'push.log');
  const hook = join(setup.work, '.git', 'hooks', 'pre-push');
  setup.git('config', 'core.hooksPath', join(setup.work, '.git', 'hooks'));
  writeFileSync(hook, '#!/bin/sh\ntouch .git/push.log\n', { mode: 0o755 });
  const ship = () =>
    spawnSync(process.execPath, [resolve('scripts/ship-issue.mjs')], {
      cwd: setup.work,
      encoding: 'utf8'
    });

  return { ...setup, ship, pushLog };
}

test('shipping an overlapping rebase lists the paths and never attempts a push', () => {
  const setup = rebasedIssue('a.ts');
  const result = setup.ship();

  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/overlap/i);
  expect(result.stderr).toContain('a.ts');
  expect(existsSync(setup.pushLog)).toBe(false);
});

test('shipping a disjoint rebase reuses the last successful validation', () => {
  const setup = rebasedIssue('b.md');
  const result = setup.ship();

  expect({ status: result.status, stderr: result.stderr }).toEqual({
    status: 0,
    stderr: expect.any(String)
  });
  expect(existsSync(setup.pushLog)).toBe(true);
  expect(setup.git('rev-parse', 'origin/main')).toBe(
    setup.git('rev-parse', 'HEAD')
  );
});

test('shipping an overlapping rebase succeeds after validation on the new base', () => {
  const setup = rebasedIssue('a.ts');
  expect(setup.ship().status).toBe(1);

  const base = setup.git('rev-parse', 'origin/main');
  expect(validate(setup, ['--base', base], 'eslint:3').status).toBe(3);
  expect(setup.ship().status).toBe(1);
  expect(existsSync(setup.pushLog)).toBe(false);

  expect(validate(setup, ['--base', base]).status).toBe(0);
  const result = setup.ship();
  expect({ status: result.status, stderr: result.stderr }).toEqual({
    status: 0,
    stderr: expect.any(String)
  });
  expect(existsSync(setup.pushLog)).toBe(true);
  expect(setup.git('rev-parse', 'origin/main')).toBe(
    setup.git('rev-parse', 'HEAD')
  );
});
