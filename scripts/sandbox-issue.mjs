import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

// The Mac launcher for a sandboxed issue (docs/verification.md "Sandboxed agents";
// docs/adr/0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md#access-path):
// `pnpm run sandbox <issue> [--agent <agent>]` prepares the issue's linked worktree with its
// macOS dependencies, mounts it writable in the dedicated sandbox liftlog-<issue>, runs the
// checkout's lease broker in the foreground and hands off only once the sandbox's broker
// client reaches that broker's running lease. Ctrl-C stops the broker and releases the lease.
const READY_POLL_MS = 500;
const REACH_ATTEMPTS = 5;
const REACH_RETRY_MS = 1000;

const fail = message => {
  process.stderr.write(`sandbox-issue: ${message}\n`);
  process.exit(1);
};

function run(command, args, cwd) {
  const { status } = spawnSync(command, args, { cwd, stdio: 'inherit' });

  if (status !== 0) {
    fail(`${command} ${args.join(' ')} exited ${status ?? 1}.`);
  }
}

const capture = (command, args, cwd) =>
  spawnSync(command, args, { cwd, encoding: 'utf8' });

const readJson = path => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
};

const args = process.argv.slice(2);
const issue = args[0]?.replace(/^#/, '');
const agent = args[1] === '--agent' ? args[2] : 'codex';

if (
  !/^\d+$/.test(issue ?? '') ||
  !(args.length === 1 || (args.length === 3 && /^[\w.-]+$/.test(agent ?? '')))
) {
  process.stderr.write(
    'Usage: pnpm run sandbox <issue number> [--agent <agent>]\n'
  );
  process.exit(2);
}

// Worktrees sit beside the main checkout, as `pnpm run worktree` creates them.
const root = dirname(
  resolve(
    execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd: import.meta.dirname, encoding: 'utf8' }
    ).trim()
  )
);
const checkout = join(dirname(root), `${basename(root)}-${issue}`);
const sandbox = `liftlog-${issue}`;

// 1. The linked worktree and its macOS dependencies, installed on the Mac for host Metro.
if (existsSync(checkout)) {
  const branch = capture(
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    checkout
  ).stdout?.trim();

  if (branch !== `issue-${issue}`) {
    fail(
      `${checkout} is on ${branch || 'no branch'}, not issue-${issue}; no handoff.`
    );
  }

  run('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], checkout);
} else {
  run(
    process.execPath,
    [join(root, 'scripts', 'new-worktree.mjs'), issue],
    root
  );
}

// 2. The dedicated sandbox, mounting the checkout as its writable workspace.
const listed = capture('sbx', ['ls', '--json']);

if (listed.status !== 0) {
  fail(`sbx ls failed: ${listed.stderr.trim()}`);
}

const existing = JSON.parse(listed.stdout).find(({ name }) => name === sandbox);

if (!existing) {
  run('sbx', ['create', '--name', sandbox, agent, checkout]);
} else if (!existing.workspaces?.includes(checkout)) {
  fail(
    `sandbox ${sandbox} mounts ${existing.workspaces?.join(', ') || 'no workspace'}, not ${checkout}; remove it with \`sbx rm ${sandbox}\` or mount the checkout; no handoff.`
  );
}

// The broker client needs a Linux Node.js runtime in the sandbox; checked before the lease
// starts so a bare image fails fast.
if (capture('sbx', ['exec', sandbox, 'node', '--version']).status !== 0) {
  fail(
    `sandbox ${sandbox} has no node; install Node.js in it outside the checkout, for example \`sbx exec -u root ${sandbox} sh -c 'apt-get update && apt-get install -y nodejs'\`, then rerun; no handoff.`
  );
}

// 3. The foreground broker. It writes the credential only after its lease runs and the
// sandbox's network rule exists.
const credential = join(checkout, '.device-stack', 'broker.json');
const broker = spawn(
  process.execPath,
  [
    join(checkout, 'scripts', 'device-stack.mjs'),
    'broker',
    '--sandbox',
    sandbox
  ],
  { cwd: checkout, stdio: 'inherit' }
);
let exited = null;
const exit = new Promise(done =>
  broker.on('exit', (code, signal) => {
    exited = code ?? (signal ? 1 : 0);
    done(exited);
  })
);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => broker.kill(signal));
}

const stopBroker = async message => {
  process.stderr.write(`sandbox-issue: ${message}; no handoff.\n`);

  if (exited === null) {
    broker.kill('SIGTERM');
    await exit;
  }

  process.exit(1);
};

let served = null;

while (exited === null) {
  const current = readJson(credential);

  if (current?.process?.pid === broker.pid) {
    served = current;
    break;
  }

  await sleep(READY_POLL_MS);
}

if (!served) {
  fail(`the lease broker exited ${exited} before serving a lease; no handoff.`);
}

// 4. The handoff gate: the sandbox's own client must reach this broker's running lease.
let reached = null;

for (let attempt = 1; attempt <= REACH_ATTEMPTS && exited === null; attempt++) {
  reached = capture('sbx', [
    'exec',
    '-w',
    checkout,
    sandbox,
    'node',
    'scripts/lease-broker-client.mjs',
    'status'
  ]);

  if (reached.status === 0) {
    break;
  }

  await sleep(REACH_RETRY_MS);
}

if (exited !== null) {
  fail(
    `the lease broker exited ${exited} before the sandbox reached it; no handoff.`
  );
}

if (reached?.status !== 0) {
  await stopBroker(
    `sandbox ${sandbox} cannot reach the lease broker: ${(reached?.stderr || reached?.stdout || '').trim()}`
  );
}

let state = null;

try {
  state = JSON.parse(reached.stdout);
} catch {
  // Reported as a mismatch below.
}

if (state?.lease?.id !== served.lease || state?.running !== true) {
  await stopBroker(
    `sandbox ${sandbox} reached ${state?.lease?.id ? `lease ${state.lease.id}` : 'no lease'}${state?.running ? '' : ' that is not running'}, not the running lease ${served.lease} of ${checkout}`
  );
}

process.stdout.write(
  `HANDOFF: sandbox ${sandbox} reaches running lease ${served.lease} of ${checkout}. Attach with \`sbx run ${sandbox}\`; the agent drives Android with \`node scripts/lease-broker-client.mjs <command> [args]\`. Ctrl-C here stops the broker and releases the lease.\n`
);
process.exitCode = await exit;
