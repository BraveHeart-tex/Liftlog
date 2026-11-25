import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SERIAL,
  pids,
  alive,
  harness,
  commands,
  allCalls,
  waitUntil,
  barrier,
  testHooks,
  deadHolder
} from '@/tests/tooling/device-stack-harness';

test('every guarded signal and kill runs while its own process holds the registry lock it took for the ownership check', async () => {
  const { dir, root, stack, stackIn } = await harness({}, { hooks: testHooks });
  await stack('start');
  let stopper: number | undefined;

  const { status } = await stackIn(
    root,
    ['stop'],
    child => (stopper = child.pid)
  );

  expect(status).toBe(0);
  const held = readFileSync(join(dir, 'held.log'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
  expect(held).toEqual(
    ['signal jsLogs', 'signal metro', 'kill emulator'].map(action => ({
      action,
      holder: stopper,
      pid: stopper
    }))
  );
});

test.each(['start', 'stop'])(
  'after a start killed with SIGKILL mid-boot, the next %s completes or rolls back the lease',
  async command => {
    const { root, stack, stackIn, fakeState, registry, recorded, logPath } =
      await harness({}, { hooks: testHooks });

    const killed = await stackIn(root, ['start'], undefined, {
      HOOK_ACTION: 'kill at spawn'
    });

    expect(killed.signal).toBe('SIGKILL');
    const { lease } = recorded();
    expect(registry().leases).toMatchObject([
      { id: lease.id, operation: { kind: 'acquire' } }
    ]);
    await waitUntil(() => Boolean(fakeState().emulators['5556']));
    const orphan = fakeState().emulators['5556'].pid;
    const before = allCalls(logPath).length;

    const next = await stack(command);

    expect(next.status).toBe(0);
    const calls = commands(allCalls(logPath).slice(before));
    // The orphan never set its lease token, so its verified process is signalled.
    expect(calls).not.toContain(`adb -s ${SERIAL} emu kill`);
    await waitUntil(() => !alive(orphan));

    if (command === 'start') {
      expect(JSON.parse(next.stdout)).toMatchObject({
        running: true,
        lease: { id: lease.id }
      });
      expect(registry().leases).toMatchObject([
        { id: lease.id, operation: null }
      ]);
      expect(
        calls.filter(call => call.startsWith('emulator -avd'))
      ).toHaveLength(1);
      await stack('stop');
    } else {
      expect(JSON.parse(next.stdout)).toEqual({
        running: false,
        stopped: ['metro', 'emulator']
      });
      expect(registry().leases).toEqual([]);
      expect(recorded()).toBeNull();
    }
  }
);

test('a registry lock whose holder is dead is broken by exactly one of two waiters', async () => {
  const { hostDir, stack, stackIn, worktree, registry } = await harness(
    {},
    {
      limit: 2,
      hooks: barrier(
        'lockChecked',
        2,
        "context.stale && context.lock.endsWith('registry.lock')"
      )
    }
  );
  const lock = join(hostDir, 'registry.lock');
  mkdirSync(lock);
  writeFileSync(join(lock, '1.json'), JSON.stringify(deadHolder));
  const other = worktree();

  // Both waiters pass the staleness check before either breaks the lock.
  const [first, second] = await Promise.all([
    stack('start'),
    stackIn(other, ['start'])
  ]);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  expect(
    `${first.stderr}${second.stderr}`.match(
      new RegExp(`broke the stale registry lock of pid ${deadHolder.pid}`, 'g')
    )
  ).toHaveLength(1);
  expect(registry().leases).toHaveLength(2);
  await stack('stop');
  await stackIn(other, ['stop']);
});

test('a registry lock another process replaced after the staleness check is left intact', async () => {
  const { dir, root, hostDir, stack, stackIn, registry } = await harness(
    {},
    {
      hooks: `
import { linkSync } from 'node:fs'
import { join } from 'node:path'
export function lockChecked({ lock, generation, stale }) {
  if (stale && lock.endsWith('registry.lock')) linkSync(join(process.env.HOOK_DIR, 'replacement.json'), join(lock, (generation + 1) + '.json'))
}
`
    }
  );
  // A live device stack process that broke the stale lock first and now holds it.
  const replacer = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1000)', 'device-stack.mjs'],
    { stdio: 'ignore' }
  );
  pids.push(replacer.pid!);
  const replacement = {
    pid: replacer.pid,
    startTime: execFileSync(
      'ps',
      ['-o', 'lstart=', '-p', String(replacer.pid)],
      {
        encoding: 'utf8'
      }
    ).trim(),
    markers: ['device-stack.mjs'],
    root: '/other'
  };
  writeFileSync(join(dir, 'replacement.json'), JSON.stringify(replacement));
  const lock = join(hostDir, 'registry.lock');
  mkdirSync(lock);
  writeFileSync(join(lock, '1.json'), JSON.stringify(deadHolder));
  let stderr = '';

  const started = stackIn(root, ['start'], child =>
    child.stderr!.on('data', chunk => (stderr += chunk))
  );
  await waitUntil(() =>
    stderr.includes(`waiting for the registry lock held by pid ${replacer.pid}`)
  );

  expect(JSON.parse(readFileSync(join(lock, '2.json'), 'utf8'))).toEqual(
    replacement
  );
  expect(stderr).not.toContain('broke the stale registry lock');
  // The replacing process releases the lock.
  writeFileSync(join(lock, '3.json'), JSON.stringify({ free: true }));
  const { status } = await started;
  expect(status).toBe(0);
  expect(registry().leases).toHaveLength(1);
  await stack('stop');
});
