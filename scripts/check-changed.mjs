import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Lints and format-checks every file changed since a base (default: the merge base with
// origin/main), committed or not, plus untracked files. Finding the files here keeps
// shell quoting out of the agent's validation command.
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);

const base = process.argv[2] ?? git('merge-base', 'HEAD', 'origin/main')[0];
const files = [
  ...new Set([
    ...git('diff', '--name-only', base),
    ...git('ls-files', '--others', '--exclude-standard')
  ])
].filter(file => existsSync(file));

if (files.length === 0) {
  process.stdout.write(`No changed files since ${base}.\n`);
  process.exit(0);
}

function run(command, args) {
  return spawnSync(command, args, { stdio: 'inherit' }).status ?? 1;
}

const lintable = files.filter(file => /\.(ts|tsx|js|mjs|cjs)$/.test(file));
const eslint = lintable.length
  ? run('eslint', ['--no-warn-ignored', ...lintable])
  : 0;
const prettier = run('prettier', ['--check', '--ignore-unknown', ...files]);

process.exit(eslint || prettier);
