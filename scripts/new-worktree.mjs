import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

// Creates a worktree for an issue off origin/main, beside the main checkout, and installs
// its dependencies: a fresh worktree has no node_modules, so validation commands fail.
// pnpm hard-links from its store, so the install is fast and keeps the branch's own
// lockfile, which a symlinked node_modules would not.
function run(command, args, cwd) {
  const { status } = spawnSync(command, args, { cwd, stdio: 'inherit' });

  if (status !== 0) {
    process.exit(status ?? 1);
  }
}

const issue = process.argv[2]?.replace(/^#/, '');

if (!/^\d+$/.test(issue ?? '')) {
  console.error('Usage: pnpm run worktree <issue number>');
  process.exit(2);
}

// The common git dir sits in the main checkout, so worktrees made from worktrees
// still land beside it.
const root = dirname(
  resolve(
    execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      {
        cwd: import.meta.dirname,
        encoding: 'utf8'
      }
    ).trim()
  )
);
const path = join(dirname(root), `${basename(root)}-${issue}`);

if (existsSync(path)) {
  console.error(`${path} already exists.`);
  process.exit(1);
}

run('git', ['fetch', 'origin'], root);
run(
  'git',
  ['worktree', 'add', '-b', `issue-${issue}`, path, 'origin/main'],
  root
);
run('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], path);
process.stdout.write(`Worktree ready: ${path}\n`);
