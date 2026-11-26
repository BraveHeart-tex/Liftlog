import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';

// `--prune-closed` runs end to end in a temporary repository with a bare origin, a fake
// `gh` answering each issue's state, and a test HOME holding the device stack registry.
const fakeGh = `#!/usr/bin/env node
const states = JSON.parse(process.env.FAKE_GH_STATES)
const issue = process.argv[4]
if (!(issue in states)) process.exit(1)
process.stdout.write(states[issue] + '\\n')
`;

const dir = realpathSync(mkdtempSync(join(tmpdir(), 'new-worktree-')));
const home = join(dir, 'home');
const bin = join(dir, 'bin');
const main = join(dir, 'repos', 'main');
const env = {
  ...process.env,
  HOME: home,
  PATH: `${bin}${delimiter}${process.env.PATH}`,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  FAKE_GH_STATES: JSON.stringify({
    1: 'CLOSED',
    2: 'CLOSED',
    3: 'CLOSED',
    4: 'CLOSED',
    5: 'OPEN',
    6: 'CLOSED'
  })
};
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();

// Worktrees by issue: 2 lives outside the main checkout's parent directory.
const paths: Record<number, string> = {
  1: join(dir, 'repos', 'main-1'),
  2: join(dir, 'elsewhere', 'issue-2'),
  3: join(dir, 'repos', 'main-3'),
  4: join(dir, 'repos', 'main-4'),
  5: join(dir, 'repos', 'main-5'),
  6: join(dir, 'repos', 'main-6')
};
let stdout = '';
let status: number | null = null;

beforeAll(() => {
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), fakeGh);
  chmodSync(join(bin, 'gh'), 0o755);
  mkdirSync(join(home, '.liftlog-device-stack'), { recursive: true });
  mkdirSync(main, { recursive: true });
  git(dir, 'init', '--bare', '-b', 'main', 'origin.git');
  git(main, 'init', '-b', 'main');
  git(main, 'commit', '--allow-empty', '-m', 'init');
  git(main, 'remote', 'add', 'origin', join(dir, 'origin.git'));
  git(main, 'push', 'origin', 'main');
  mkdirSync(join(main, 'scripts'));
  copyFileSync(
    resolve('scripts/new-worktree.mjs'),
    join(main, 'scripts', 'new-worktree.mjs')
  );

  for (const [issue, path] of Object.entries(paths)) {
    git(main, 'worktree', 'add', '-b', `issue-${issue}`, path, 'origin/main');
  }

  git(paths[3], 'commit', '--allow-empty', '-m', 'unpushed');
  writeFileSync(join(paths[4], 'draft.txt'), 'draft');
  writeFileSync(
    join(home, '.liftlog-device-stack', 'registry.json'),
    JSON.stringify({ leases: [{ id: 'l1', slot: 0, root: paths[6] }] })
  );

  const result = spawnSync(
    process.execPath,
    [join(main, 'scripts', 'new-worktree.mjs'), '--prune-closed'],
    { cwd: main, env, encoding: 'utf8' }
  );
  ({ stdout, status } = result);
  assert.equal(status, 0, result.stderr);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const branches = () =>
  git(main, 'branch', '--format=%(refname:short)').split('\n');
const listed = () => git(main, 'worktree', 'list', '--porcelain');

test.each([1, 2])(
  'removes the clean worktree of closed issue #%i and deletes its branch',
  issue => {
    assert.equal(existsSync(paths[issue]), false);
    assert.equal(listed().includes(paths[issue]), false);
    assert.equal(branches().includes(`issue-${issue}`), false);
    assert.match(
      stdout,
      new RegExp(`remove ${paths[issue]}: #${issue} is closed`)
    );
  }
);

test.each([
  [3, 'its branch has commits missing from origin/main'],
  [4, 'it has uncommitted changes'],
  [5, '#5 is open'],
  [6, 'it holds a live device stack lease']
])('keeps worktree #%i and names the reason: %s', (issue, reason) => {
  assert.equal(existsSync(paths[issue]), true);
  assert.equal(branches().includes(`issue-${issue}`), true);
  assert.ok(stdout.includes(`keep ${paths[issue]}: ${reason}\n`), stdout);
});

test('never treats the main checkout as a candidate', () => {
  assert.equal(stdout.includes(`${main}:`), false);
  assert.equal(existsSync(main), true);
});
