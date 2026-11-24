import { execFileSync, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdtempSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The done gate: runs every validation stage on the files changed since a base (default
// HEAD), committed or not, plus untracked files. Each stage's output goes to its own log,
// so the agent reads one line per stage instead of raw tool output.
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);

const baseFlag = process.argv.indexOf('--base');
const base = baseFlag === -1 ? 'HEAD' : process.argv[baseFlag + 1];
const files = [
  ...new Set([
    ...git('diff', '--name-only', '--diff-filter=d', base),
    ...git('ls-files', '--others', '--exclude-standard')
  ])
]
  .filter(file => existsSync(file))
  .sort();

if (files.length === 0) {
  process.stdout.write(`No changed files since ${base}.\n`);
  process.exit(0);
}

const code = files.filter(file => /\.(ts|tsx|js|mjs|cjs)$/.test(file));
const stages = [
  code.length && ['ts-check', ['run', 'ts-check']],
  code.length && ['eslint', ['exec', 'eslint', '--no-warn-ignored', ...code]],
  ['prettier', ['exec', 'prettier', '--check', '--ignore-unknown', ...files]],
  code.length && ['test', ['run', 'test']]
].filter(Boolean);

const logs = mkdtempSync(join(tmpdir(), 'validate-changed-'));
const results = [];
let failure = 0;

for (const [name, args] of stages) {
  if (failure) {
    process.stdout.write(`SKIP ${name}\n`);
    results.push(`${name} SKIP`);
    continue;
  }

  const log = join(logs, `${name}.log`);
  const fd = openSync(log, 'w');
  const started = Date.now();
  process.stdout.write(`START ${name}\n`);
  const status =
    spawnSync('pnpm', args, { stdio: ['ignore', fd, fd] }).status ?? 1;
  closeSync(fd);
  const elapsed = `${((Date.now() - started) / 1000).toFixed(1)}s`;

  if (status === 0) {
    process.stdout.write(`PASS ${name} ${elapsed} ${log}\n`);
    results.push(`${name} PASS`);
  } else {
    process.stdout.write(`FAIL ${name} ${elapsed} exit ${status} ${log}\n`);
    results.push(`${name} FAIL (exit ${status})`);
    failure = status;
  }
}

process.stdout.write(
  `Summary: ${failure ? 'FAIL' : 'PASS'} - ${results.join(', ')}\n`
);
process.exit(failure);
