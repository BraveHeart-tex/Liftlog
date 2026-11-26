import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8' }).trimEnd();

export const validationRecord = () =>
  git('rev-parse', '--git-path', 'liftlog-validation.json');

export function workingTree() {
  // Capture the files under validation without changing the user's index.
  const directory = mkdtempSync(join(tmpdir(), 'liftlog-index-'));
  const env = { ...process.env, GIT_INDEX_FILE: join(directory, 'index') };
  const run = (...args) => execFileSync('git', args, { env, encoding: 'utf8' });

  try {
    copyFileSync(git('rev-parse', '--git-path', 'index'), env.GIT_INDEX_FILE);
    run('add', '-A', '--', ':/');

    return run('write-tree').trim();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function changedPaths(base, tree, ...options) {
  return git(
    'diff',
    '--no-renames',
    '--name-only',
    '-z',
    ...options,
    base,
    tree
  )
    .split('\0')
    .filter(Boolean);
}

export function changes(base, tree) {
  return git('diff', '--no-renames', '--raw', '--no-abbrev', '-z', base, tree);
}
