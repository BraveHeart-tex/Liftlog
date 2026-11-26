import { spawn } from 'node:child_process';
import {
  PHONE,
  FOREIGN,
  SERIAL,
  alive,
  allCalls,
  commands,
  git,
  harness,
  pids,
  waitUntil
} from '@/tests/tooling/device-stack-harness';

type Decision = {
  lease: string;
  decision: 'keep' | 'reclaim' | 'conflict';
  reason: string;
  evidence: Record<string, any>;
  stopped?: string[];
};

const decisionsOf = (stdout: string) =>
  (JSON.parse(stdout) as { decisions: Decision[] }).decisions;

// The processes a worktree's `start` recorded, by component.
const componentPids = (started: Record<string, any>) => [
  started.emulator.process.pid,
  started.metro.pid,
  started.jsLogs.pid
];

// No call reaches the phone or the maintainer's emulator, and every adb call names the
// harness serial.
function expectHarnessOnly(calls: { name: string; args: string[] }[]) {
  for (const { name, args } of calls) {
    expect(args.join(' ')).not.toMatch(new RegExp(`${PHONE}|${FOREIGN}`));

    if (name === 'adb') {
      expect(args.slice(0, 2)).toEqual(['-s', SERIAL]);
    }
  }
}

// A lease started in a second worktree, which is then removed with `git worktree remove`.
async function removedWorktreeLease(
  stack: Awaited<ReturnType<typeof harness>>
) {
  const other = stack.worktree();
  const run = await stack.stackIn(other, ['start']);
  expect(run.status).toBe(0);
  const started = JSON.parse(run.stdout);
  pids.push(...componentPids(started));
  git(stack.root, 'worktree', 'remove', '--force', other);

  return { other, started };
}

test('a lease whose worktree was removed is reclaimed with its verified processes stopped, and --dry-run only reports it', async () => {
  const stack = await harness();
  const { other, started } = await removedWorktreeLease(stack);
  const before = stack.registry();
  const beforeCalls = allCalls(stack.logPath).length;

  const dry = await stack.stack('gc', '--dry-run');

  expect(dry.status).toBe(0);
  expect(decisionsOf(dry.stdout)).toEqual([
    expect.objectContaining({
      lease: started.lease.id,
      decision: 'reclaim',
      reason: `its worktree ${other} is missing from disk`,
      evidence: expect.objectContaining({
        operation: null,
        worktree: { path: other, exists: false, listed: false },
        processes: { emulator: 'running', metro: 'running', jsLogs: 'running' },
        device: {
          serial: SERIAL,
          avd: 'liftlog_harness_34',
          token: started.lease.id
        }
      })
    })
  ]);
  expect(stack.registry()).toEqual(before);
  const dryCalls = commands(allCalls(stack.logPath).slice(beforeCalls));
  expect(dryCalls.some(call => call.includes('emu kill'))).toBe(false);
  componentPids(started).forEach(pid => expect(alive(pid)).toBe(true));

  const reclaimed = await stack.stack('gc');

  expect(reclaimed.status).toBe(0);
  expect(decisionsOf(reclaimed.stdout)).toEqual([
    expect.objectContaining({
      lease: started.lease.id,
      decision: 'reclaim',
      stopped: ['jsLogs', 'metro', 'emulator']
    })
  ]);
  expect(stack.registry().leases).toEqual([]);
  componentPids(started).forEach(pid => expect(alive(pid)).toBe(false));
  const calls = allCalls(stack.logPath).slice(beforeCalls);
  expect(commands(calls)).toContain(`adb -s ${SERIAL} emu kill`);
  expectHarnessOnly(calls);
});

test('a lease whose acquisition is still running is never reclaimed, even before it spawned a process', async () => {
  const { root, stack, stackIn, worktree, registry } = await harness(
    {},
    {
      hooks: `
import { existsSync } from 'node:fs'
import { join } from 'node:path'
export async function leaseAcquired() {
  while (!existsSync(join(process.env.HOOK_DIR, 'continue'))) await new Promise(done => setTimeout(done, 20))
}
`
    }
  );
  let paused: ReturnType<typeof spawn> | undefined;
  const starting = stackIn(root, ['start'], child => (paused = child));
  await waitUntil(() => registry().leases.length === 1);
  const [lease] = registry().leases;
  expect(lease).toMatchObject({ operation: { kind: 'acquire' } });
  expect((lease as any).processes).toBeUndefined();

  const kept = await stack('gc');

  expect(decisionsOf(kept.stdout)).toEqual([
    expect.objectContaining({
      lease: lease.id,
      decision: 'keep',
      reason: `its acquire is still running in pid ${paused!.pid}`
    })
  ]);
  // start in another worktree reaps nothing and reports CAPACITY.
  const other = await stackIn(worktree(), ['start']);
  expect(other.status).toBe(1);
  expect(other.stderr).toContain('CAPACITY');
  expect(registry().leases.map(entry => entry.id)).toEqual([lease.id]);

  // Once the acquiring process is gone, the lease has no live process and is reclaimed.
  paused!.kill('SIGKILL');
  await starting;
  const reclaimed = await stack('gc');

  expect(decisionsOf(reclaimed.stdout)).toEqual([
    expect.objectContaining({
      lease: lease.id,
      decision: 'reclaim',
      reason: 'none of its processes is alive',
      stopped: []
    })
  ]);
  expect(registry().leases).toEqual([]);
});

test.each([
  ['an unverifiable process on a slot port', 'listener'],
  ['another lease token on its device', 'token']
])(
  'a lease with %s is reported as a conflict, and none of its processes or devices is touched',
  async (_, cause) => {
    const stack = await harness();
    const { started } = await removedWorktreeLease(stack);

    if (cause === 'listener') {
      const stranger = spawn(
        process.execPath,
        ['-e', 'setInterval(() => {}, 1000)'],
        {
          stdio: 'ignore'
        }
      );
      pids.push(stranger.pid!);
      stack.editFake(state =>
        state.listeners.push({
          pid: stranger.pid!,
          cwd: '/',
          port: started.lease.adbPort
        })
      );
    } else {
      stack.editFake(state => (state.tokenOverride = 'other-lease'));
    }

    const before = stack.registry();
    const beforeCalls = allCalls(stack.logPath).length;

    const run = await stack.stack('gc');

    expect(run.status).toBe(0);
    const [decision] = decisionsOf(run.stdout);
    expect(decision).toMatchObject({
      lease: started.lease.id,
      decision: 'conflict'
    });
    expect(decision.reason).toContain(
      cause === 'listener'
        ? `on port ${started.lease.adbPort} is not a verified process of this lease`
        : 'lease token "other-lease"'
    );
    expect(stack.registry()).toEqual(before);
    const calls = commands(allCalls(stack.logPath).slice(beforeCalls));
    expect(calls.some(call => call.includes('emu kill'))).toBe(false);
    expect(calls.some(call => call.startsWith('agent-device'))).toBe(false);
    await new Promise(done => setTimeout(done, 200));
    componentPids(started).forEach(pid => expect(alive(pid)).toBe(true));
    // start does not reap it either.
    const blocked = await stack.stack('start');
    expect(blocked.status).toBe(1);
    expect(blocked.stderr).toContain('CAPACITY');
    expect(stack.registry()).toEqual(before);
  }
);

test('a live lease with an existing worktree is kept, list shows it read-only, and only --idle reclaims it', async () => {
  const { stack, registry, logPath, ports } = await harness();
  const started = JSON.parse((await stack('start')).stdout);
  const before = registry();

  const listed = await stack('list');

  expect(JSON.parse(listed.stdout)).toEqual({
    limit: 1,
    slots: [
      expect.objectContaining({
        slot: 0,
        lease: started.lease.id,
        operation: null,
        processes: { emulator: 'running', metro: 'running', jsLogs: 'running' }
      }),
      {
        slot: 1,
        consolePort: 5558,
        adbPort: 5559,
        metroPort: ports[1],
        free: true
      }
    ]
  });

  const kept = await stack('gc');

  expect(decisionsOf(kept.stdout)).toEqual([
    expect.objectContaining({
      lease: started.lease.id,
      decision: 'keep',
      reason: 'its worktree exists and a verified process is alive'
    })
  ]);
  expect(registry()).toEqual(before);
  componentPids(started).forEach(pid => expect(alive(pid)).toBe(true));

  // An hour-long idle limit keeps it; a zero one reclaims it.
  const notIdle = await stack('gc', '--idle', '60');
  expect(decisionsOf(notIdle.stdout)[0].decision).toBe('keep');
  const beforeCalls = allCalls(logPath).length;
  const idle = await stack('gc', '--idle', '0');

  expect(decisionsOf(idle.stdout)).toEqual([
    expect.objectContaining({
      decision: 'reclaim',
      reason: 'it has been idle for 0 minutes',
      stopped: ['jsLogs', 'metro', 'emulator']
    })
  ]);
  expect(registry().leases).toEqual([]);
  componentPids(started).forEach(pid => expect(alive(pid)).toBe(false));
  expectHarnessOnly(allCalls(logPath).slice(beforeCalls));
});

test('concurrent gc runs and a start reclaim a dead lease once and never the lease acquired in between', async () => {
  const stack = await harness(
    {},
    {
      hooks: ['beforeGc', 'beforeAcquire']
        .map(
          point => `
export async function ${point}() {
  if (!process.env.BARRIER) return
  const { mkdirSync, readdirSync, writeFileSync } = await import('node:fs')
  const dir = process.env.HOOK_DIR + '/barrier'
  mkdirSync(dir, { recursive: true })
  writeFileSync(dir + '/' + process.pid, '')
  while (readdirSync(dir).length < 3) await new Promise(done => setTimeout(done, 20))
}`
        )
        .join('\n')
    }
  );
  const { started } = await removedWorktreeLease(stack);
  const beforeCalls = allCalls(stack.logPath).length;

  const [first, second, start] = await Promise.all(
    ['gc', 'gc', 'start'].map(command =>
      stack.stackIn(stack.root, [command], undefined, { BARRIER: '1' })
    )
  );

  expect(start.status).toBe(0);
  const current = JSON.parse(start.stdout);
  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  const decisions = [
    ...decisionsOf(first.stdout),
    ...decisionsOf(second.stdout)
  ];
  expect(
    decisions
      .filter(({ decision }) => decision === 'reclaim')
      .map(({ lease }) => lease)
  ).not.toContain(current.lease.id);
  expect(
    decisions.filter(
      ({ lease, decision }) =>
        lease === started.lease.id && decision === 'reclaim'
    ).length
  ).toBeLessThanOrEqual(1);
  const calls = commands(allCalls(stack.logPath).slice(beforeCalls));
  expect(
    calls.filter(call => call === `adb -s ${SERIAL} emu kill`)
  ).toHaveLength(1);
  componentPids(started).forEach(pid => expect(alive(pid)).toBe(false));
  expect(stack.registry().leases).toMatchObject([
    { id: current.lease.id, operation: null }
  ]);
  componentPids(current).forEach(pid => expect(alive(pid)).toBe(true));
  await stack.stack('stop');
});
