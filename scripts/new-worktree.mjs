import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

// Creates a worktree for an issue off origin/main, beside the main checkout, and installs
// its dependencies: a fresh worktree has no node_modules, so validation commands fail.
// pnpm hard-links from its store, so the install is fast and keeps the branch's own
// lockfile, which a symlinked node_modules would not.
// `--prune-closed` removes the issue worktrees whose issue is closed, whose branch is fully
// in origin/main and which are clean and hold no device stack lease, then their branches.
function run(command, args, cwd) {
  const { status } = spawnSync(command, args, { cwd, stdio: 'inherit' });

  if (status !== 0) {
    process.exit(status ?? 1);
  }
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

const realOrSame = path => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

const capture = (command, args, cwd) => {
  const { status, stdout } = spawnSync(command, args, {
    cwd,
    encoding: 'utf8'
  });

  return status === 0 ? stdout.trim() : null;
};

// A live lease is a host registry lease whose root is the worktree path:
// docs/adr/0008-device-stack-architecture.md "Reclaiming leases".
function leasedRoots() {
  const registry = join(homedir(), '.liftlog-device-stack', 'registry.json');

  if (!existsSync(registry)) {
    return new Set();
  }

  const { leases = [] } = JSON.parse(readFileSync(registry, 'utf8'));

  return new Set(leases.map(lease => realOrSame(lease.root)));
}

// The first entry is the main checkout, never a candidate.
function issueWorktrees() {
  const blocks = capture('git', ['worktree', 'list', '--porcelain'], root)
    .split('\n\n')
    .slice(1);

  return blocks.flatMap(block => {
    const lines = block.split('\n');
    const path = lines
      .find(line => line.startsWith('worktree '))
      ?.slice('worktree '.length);
    const branch = lines
      .find(line => line.startsWith('branch refs/heads/'))
      ?.slice('branch refs/heads/'.length);
    const issue = branch?.match(/^issue-(\d+)$/)?.[1];

    return path && issue ? [{ path, branch, issue }] : [];
  });
}

function keepReason({ path, branch, issue }, leases) {
  const exists = existsSync(path);

  if (exists && leases.has(realOrSame(path))) {
    return 'it holds a live device stack lease';
  }

  if (exists) {
    const status = capture('git', ['status', '--porcelain'], path);

    if (status === null) {
      return 'its status could not be read';
    }

    if (status) {
      return 'it has uncommitted changes';
    }
  }

  // `git cherry` marks commits missing from origin/main with "+", so a rebased push counts.
  const cherry = capture('git', ['cherry', 'origin/main', branch], root);

  if (cherry === null) {
    return 'its branch could not be compared with origin/main';
  }

  if (cherry.split('\n').some(line => line.startsWith('+'))) {
    return 'its branch has commits missing from origin/main';
  }

  const state = capture(
    'gh',
    ['issue', 'view', issue, '--json', 'state', '--jq', '.state'],
    root
  );

  if (state === null) {
    return `the state of #${issue} could not be read`;
  }

  if (state !== 'CLOSED') {
    return `#${issue} is ${state.toLowerCase()}`;
  }

  return null;
}

function pruneClosed() {
  run('git', ['fetch', 'origin'], root);
  const leases = leasedRoots();
  const removed = [];

  for (const worktree of issueWorktrees()) {
    const reason = keepReason(worktree, leases);

    if (reason) {
      process.stdout.write(`keep ${worktree.path}: ${reason}\n`);
      continue;
    }

    // A worktree missing from disk is cleared by `git worktree prune` below.
    if (existsSync(worktree.path)) {
      run('git', ['worktree', 'remove', worktree.path], root);
    }

    removed.push(worktree);
    process.stdout.write(
      `remove ${worktree.path}: #${worktree.issue} is closed, its branch is in origin/main and it is clean\n`
    );
  }

  run('git', ['worktree', 'prune'], root);

  // -D: a rebased push leaves the branch unmerged to git while `git cherry` finds it upstream.
  for (const { branch } of removed) {
    run('git', ['branch', '-D', branch], root);
  }
}

if (process.argv[2] === '--prune-closed') {
  pruneClosed();
  process.exit(0);
}

const issue = process.argv[2]?.replace(/^#/, '');

if (!/^\d+$/.test(issue ?? '')) {
  console.error('Usage: pnpm run worktree <issue number> | --prune-closed');
  process.exit(2);
}

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
