import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// eslint-disable-next-line no-restricted-imports
import {
  changedPaths,
  changes,
  git,
  validationRecord,
  workingTree
} from './validation-state.mjs';

// The done gate: runs every validation stage on the files changed since a base (default
// HEAD), committed or not, plus untracked files. Changes under scripts/ or tests/tooling/
// add the tooling Jest project. Each stage's output goes to its own log,
// so the agent reads one line per stage instead of raw tool output.
const baseFlag = process.argv.indexOf('--base');
const base = baseFlag === -1 ? 'HEAD' : process.argv[baseFlag + 1];
const baseCommit = git('rev-parse', '--verify', `${base}^{commit}`);
const tree = workingTree();
const files = changedPaths(baseCommit, tree, '--diff-filter=d').sort();

function recordSuccess() {
  if (workingTree() !== tree) {
    process.stderr.write(
      'Files changed during validation. Run validate:changed again.\n'
    );

    return 1;
  }

  writeFileSync(
    validationRecord(),
    JSON.stringify({
      base: baseCommit,
      paths: changedPaths(baseCommit, tree),
      changes: changes(baseCommit, tree)
    })
  );

  return 0;
}

if (files.length === 0) {
  process.stdout.write(`No changed files since ${base}.\n`);
  process.exit(recordSuccess());
}

const code = files.filter(file => /\.(ts|tsx|js|mjs|cjs)$/.test(file));
// Repo tooling has its own Jest project, which `pnpm run test` does not run.
const tooling = files.filter(file => /^(scripts|tests\/tooling)\//.test(file));
const stages = [
  code.length && ['ts-check', ['run', 'ts-check']],
  code.length && ['eslint', ['exec', 'eslint', '--no-warn-ignored', ...code]],
  ['prettier', ['exec', 'prettier', '--check', '--ignore-unknown', ...files]],
  code.length && ['test', ['run', 'test']],
  tooling.length && ['tooling', ['run', 'test:tooling']]
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

if (!failure) {
  failure = recordSuccess();
}

process.stdout.write(
  `Summary: ${failure ? 'FAIL' : 'PASS'} - ${results.join(', ')}\n`
);
process.exit(failure);
