import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';

// The launcher runs end to end in a temporary repository: fake `sbx` and `pnpm` binaries log
// their calls, `sbx exec` runs the command on the host, and the repository's own
// new-worktree, device-stack and lease-broker-client scripts are fakes. A fake broker
// writes the checkout's credential and runs until signalled; FAKE_BROKER=fail exits 1 first.
const fakeSbx = `#!/usr/bin/env node
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs')
const { spawnSync } = require('node:child_process')
const args = process.argv.slice(2)
appendFileSync(process.env.SBX_LOG, JSON.stringify(args) + '\\n')
const state = JSON.parse(readFileSync(process.env.SBX_STATE, 'utf8'))
if (args[0] === 'ls') process.stdout.write(JSON.stringify(state))
if (args[0] === 'create') {
  state.push({ name: args[2], workspaces: [args[4]] })
  writeFileSync(process.env.SBX_STATE, JSON.stringify(state))
}
if (args[0] === 'exec') {
  const [dir, command, ...rest] = args[1] === '-w' ? [args[2], ...args.slice(4)] : [process.cwd(), ...args.slice(2)]
  if (process.env.FAKE_NO_NODE && command === 'node') process.exit(127)
  const result = spawnSync(command, rest, { cwd: dir, stdio: 'inherit' })
  process.exit(result.status ?? 1)
}
`;
const fakePnpm = `#!/usr/bin/env node
require('node:fs').appendFileSync(process.env.PNPM_LOG, JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }) + '\\n')
`;
const fakeNewWorktree = `import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
const issue = process.argv[2]
const root = join(import.meta.dirname, '..')
appendFileSync(process.env.PNPM_LOG, JSON.stringify({ worktree: issue }) + '\\n')
execFileSync('git', ['worktree', 'add', '-b', 'issue-' + issue, join(dirname(root), 'main-' + issue), 'origin/main'], { cwd: root, stdio: 'ignore' })
`;
const fakeDeviceStack = `import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const dir = join(import.meta.dirname, '..', '.device-stack')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'broker-argv.json'), JSON.stringify(process.argv.slice(2)))
if (process.env.FAKE_BROKER === 'fail') process.exit(1)
writeFileSync(join(dir, 'broker.json'), JSON.stringify({ lease: 'lease-a', process: { pid: process.pid } }))
const stop = signal => {
  rmSync(join(dir, 'broker.json'), { force: true })
  writeFileSync(join(dir, 'stopped'), signal)
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1000)
`;
const fakeClient = `process.stdout.write(JSON.stringify({ lease: { id: process.env.FAKE_STATUS_LEASE }, running: true }))
`;

const dir = realpathSync(mkdtempSync(join(tmpdir(), 'sandbox-issue-')));
const bin = join(dir, 'bin');
const main = join(dir, 'repos', 'main');
const sbxLog = join(dir, 'sbx.log');
const sbxState = join(dir, 'sbx.json');
const pnpmLog = join(dir, 'pnpm.log');
const env = {
  ...process.env,
  PATH: `${bin}${delimiter}${process.env.PATH}`,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  SBX_LOG: sbxLog,
  SBX_STATE: sbxState,
  PNPM_LOG: pnpmLog
};
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, env, stdio: 'ignore' });
const checkout = (issue: number) => join(dir, 'repos', `main-${issue}`);
const lines = (path: string) =>
  existsSync(path)
    ? readFileSync(path, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
    : [];

type Run = { status: number | null; stdout: string; stderr: string };

// Resolves at exit, or at the handoff line when `interrupt` is set: then it sends SIGINT
// and resolves at exit.
function launch(
  issue: number,
  extra: Record<string, string>,
  interrupt = false
) {
  const child = spawn(
    process.execPath,
    [join(main, 'scripts', 'sandbox-issue.mjs'), String(issue)],
    { cwd: main, env: { ...env, ...extra } }
  );
  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    stdout += chunk;

    if (interrupt && stdout.includes('HANDOFF')) {
      child.kill('SIGINT');
    }
  });
  child.stderr.on('data', chunk => (stderr += chunk));

  return new Promise<Run>(done =>
    child.on('exit', status => done({ status, stdout, stderr }))
  );
}

beforeAll(() => {
  mkdirSync(bin);

  for (const [name, source] of [
    ['sbx', fakeSbx],
    ['pnpm', fakePnpm]
  ]) {
    writeFileSync(join(bin, name), source);
    chmodSync(join(bin, name), 0o755);
  }

  writeFileSync(sbxState, '[]');
  mkdirSync(join(main, 'scripts'), { recursive: true });
  git(dir, 'init', '--bare', '-b', 'main', 'origin.git');
  git(main, 'init', '-b', 'main');
  writeFileSync(join(main, '.gitignore'), '.device-stack/\n');
  copyFileSync(
    resolve('scripts/sandbox-issue.mjs'),
    join(main, 'scripts', 'sandbox-issue.mjs')
  );
  writeFileSync(join(main, 'scripts', 'new-worktree.mjs'), fakeNewWorktree);
  writeFileSync(join(main, 'scripts', 'device-stack.mjs'), fakeDeviceStack);
  writeFileSync(join(main, 'scripts', 'lease-broker-client.mjs'), fakeClient);
  git(main, 'add', '.');
  git(main, 'commit', '-m', 'init');
  git(main, 'remote', 'add', 'origin', join(dir, 'origin.git'));
  git(main, 'push', 'origin', 'main');
  git(main, 'fetch', 'origin');
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

test('creates the worktree and sandbox, starts the broker and hands off once the sandbox reaches its lease', async () => {
  const run = await launch(1, { FAKE_STATUS_LEASE: 'lease-a' }, true);
  const path = checkout(1);

  assert.equal(run.status, 0, run.stderr);
  assert.match(
    run.stdout,
    new RegExp(
      `HANDOFF: sandbox liftlog-1 reaches running lease lease-a of ${path}`
    )
  );
  assert.deepEqual(lines(pnpmLog), [{ worktree: '1' }]);
  assert.deepEqual(
    lines(sbxLog).filter(([verb]) => verb === 'create'),
    [['create', '--name', 'liftlog-1', 'codex', path]]
  );
  assert.deepEqual(
    JSON.parse(
      readFileSync(join(path, '.device-stack', 'broker-argv.json'), 'utf8')
    ),
    ['broker', '--sandbox', 'liftlog-1']
  );
  assert.deepEqual(
    lines(sbxLog).filter(([verb, flag]) => verb === 'exec' && flag === '-w'),
    [
      [
        'exec',
        '-w',
        path,
        'liftlog-1',
        'node',
        'scripts/lease-broker-client.mjs',
        'status'
      ]
    ]
  );
  // Ctrl-C reaches the foreground broker, which releases its lease.
  assert.equal(
    readFileSync(join(path, '.device-stack', 'stopped'), 'utf8'),
    'SIGINT'
  );
});

test('reuses an existing worktree and installs its macOS dependencies on the Mac', async () => {
  const path = checkout(1);

  writeFileSync(pnpmLog, '');
  const run = await launch(1, { FAKE_STATUS_LEASE: 'lease-a' }, true);

  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(lines(pnpmLog), [
    { cwd: path, args: ['install', '--frozen-lockfile', '--prefer-offline'] }
  ]);
  assert.equal(lines(sbxLog).filter(([verb]) => verb === 'create').length, 1);
});

test('withholds handoff when the broker fails to start', async () => {
  const run = await launch(2, { FAKE_BROKER: 'fail' });

  assert.equal(run.status, 1);
  assert.equal(run.stdout.includes('HANDOFF'), false);
  assert.match(
    run.stderr,
    /broker exited 1 before serving a lease; no handoff/
  );
});

test('withholds handoff and stops the broker when the sandbox reaches a mismatched lease', async () => {
  const run = await launch(3, { FAKE_STATUS_LEASE: 'lease-b' });

  assert.equal(run.status, 1);
  assert.equal(run.stdout.includes('HANDOFF'), false);
  assert.match(
    run.stderr,
    /reached lease lease-b, not the running lease lease-a of .*main-3; no handoff/
  );
  assert.equal(
    readFileSync(join(checkout(3), '.device-stack', 'stopped'), 'utf8'),
    'SIGTERM'
  );
});

test('refuses an existing sandbox that mounts another checkout before starting the broker', async () => {
  const state = JSON.parse(readFileSync(sbxState, 'utf8'));

  writeFileSync(
    sbxState,
    JSON.stringify([
      ...state,
      { name: 'liftlog-4', workspaces: ['/elsewhere'] }
    ])
  );
  const run = await launch(4, { FAKE_STATUS_LEASE: 'lease-a' });

  assert.equal(run.status, 1);
  assert.equal(run.stdout.includes('HANDOFF'), false);
  assert.match(run.stderr, /sandbox liftlog-4 mounts \/elsewhere, not/);
  assert.equal(
    existsSync(join(checkout(4), '.device-stack', 'broker-argv.json')),
    false
  );
});

test('refuses a sandbox without node before starting the broker', async () => {
  const run = await launch(5, { FAKE_NO_NODE: '1' });

  assert.equal(run.status, 1);
  assert.equal(run.stdout.includes('HANDOFF'), false);
  assert.match(run.stderr, /sandbox liftlog-5 has no node/);
  assert.equal(
    existsSync(join(checkout(5), '.device-stack', 'broker-argv.json')),
    false
  );
});
