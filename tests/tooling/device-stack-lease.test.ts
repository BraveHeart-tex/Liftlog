import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PACKAGE,
  PHONE,
  FOREIGN,
  SERIAL,
  alive,
  harness,
  commands,
  allCalls,
  waitUntil,
  barrier,
  testHooks,
  deviceCallsAfterReassign
} from '@/tests/tooling/device-stack-harness';

test('with a limit of two, worktrees starting at the same moment lease different slots, and a repeated start or stop changes nothing', async () => {
  const { root, stack, stackIn, worktree, registry, logPath } = await harness(
    {},
    { limit: 2, hooks: barrier('beforeAcquire', 2) }
  );
  const other = worktree();

  // Two starts in one worktree and one in another, all at once.
  const runs = await Promise.all([
    stack('start'),
    stack('start'),
    stackIn(other, ['start'])
  ]);

  runs.forEach(run => expect(run.status).toBe(0));
  const [first, repeated, second] = runs.map(run => JSON.parse(run.stdout));
  expect(repeated.lease).toEqual(first.lease);
  expect(second.lease.id).not.toBe(first.lease.id);
  expect(new Set([first.lease.slot, second.lease.slot])).toEqual(
    new Set([0, 1])
  );
  expect(new Set([first.emulator.serial, second.emulator.serial])).toEqual(
    new Set(['emulator-5556', 'emulator-5558'])
  );
  expect(first.lease.consolePort).not.toBe(second.lease.consolePort);
  expect(
    registry()
      .leases.map(lease => [lease.id, lease.root])
      .sort()
  ).toEqual(
    [
      [first.lease.id, root],
      [second.lease.id, other]
    ].sort()
  );
  const calls = allCalls(logPath);
  // One boot per lease: the repeated start booted nothing.
  expect(
    commands(calls).filter(call => call.startsWith('emulator -avd'))
  ).toHaveLength(2);

  for (const { name, args } of calls) {
    expect(args.join(' ')).not.toMatch(new RegExp(`${PHONE}|${FOREIGN}`));

    if (name === 'adb') {
      expect([first.emulator.serial, second.emulator.serial]).toContain(
        args[1]
      );
    }
  }

  const stopped = await stack('stop');
  expect(stopped.status).toBe(0);
  expect(JSON.parse(stopped.stdout).stopped).toContain('emulator');
  const before = allCalls(logPath).length;
  const again = await stack('stop');
  expect(again.status).toBe(0);
  expect(JSON.parse(again.stdout)).toEqual({
    running: false,
    message: 'Nothing is running.'
  });
  expect(allCalls(logPath).slice(before)).toEqual([]);
  expect(registry().leases.map(lease => lease.id)).toEqual([second.lease.id]);
  await stackIn(other, ['stop']);
});

test('at the default limit a second worktree exits with CAPACITY naming the holder, and an environment limit above the host config has no effect', async () => {
  const { root, writeConfig, stack, stackIn, worktree, registry, logPath } =
    await harness();
  const holder = JSON.parse((await stack('start')).stdout);
  const other = worktree();

  for (const [config, env] of [
    [null, {}],
    [null, { DEVICE_STACK_LIMIT: '2' }],
    [2, { DEVICE_STACK_LIMIT: '1' }]
  ] as const) {
    if (config) {
      writeConfig({ limit: config });
    }

    const before = allCalls(logPath).length;
    const { status, stderr } = await stackIn(other, ['start'], undefined, env);

    expect(status).toBe(1);
    expect(stderr).toContain(
      `CAPACITY: the emulator limit is 1 and every slot is leased: slot 0 by lease ${holder.lease.id} from ${root}.`
    );
    expect(allCalls(logPath).slice(before)).toEqual([]);
    expect(existsSync(join(other, '.device-stack', 'state.json'))).toBe(false);
  }

  expect(registry().leases.map(lease => lease.id)).toEqual([holder.lease.id]);
  await stack('stop');
});

test('a start whose lease was replaced in the registry mid-start exits with LEASE_LOST without signaling or calling a device', async () => {
  const { root, stackIn, fakeState, registry } = await harness(
    {},
    { hooks: testHooks }
  );

  const { status, stderr, calls } = await stackIn(root, ['start'], undefined, {
    HOOK_ACTION: 'reassign at spawn'
  });

  expect(status).toBe(1);
  expect(stderr).toMatch(
    /LEASE_LOST: lease \S+ no longer holds its slot, so nothing was signaled or called/
  );
  expect(deviceCallsAfterReassign(calls)).toEqual([]);
  expect(commands(calls)).not.toContain(`adb -s ${SERIAL} emu kill`);
  await waitUntil(() => Boolean(fakeState().emulators['5556']));
  expect(alive(fakeState().emulators['5556'].pid)).toBe(true);
  expect(registry().leases.map(lease => lease.id)).toEqual(['other-lease']);
});

test.each([
  ['signal', 'stop', 'signal jsLogs'],
  ['kill', 'stop', 'kill emulator'],
  ['install', 'start', 'install'],
  ['data clear', 'start --fresh', 'clear data']
])(
  'a %s does not run when the slot is reassigned after its ownership check',
  async (_, command, action) => {
    const { root, stack, stackIn, fakeState, editFake } = await harness(
      {},
      { hooks: testHooks }
    );
    editFake(state => (state.installed = null));
    // Data clear runs only on a running lease.
    const started =
      command === 'stop' || action === 'clear data'
        ? JSON.parse((await stack('start')).stdout)
        : null;

    const { status, stderr, calls } = await stackIn(
      root,
      command.split(' '),
      undefined,
      { HOOK_ACTION: `reassign before ${action}` }
    );

    expect(status).toBe(1);
    expect(stderr).toContain('LEASE_LOST: lease');
    expect(deviceCallsAfterReassign(calls)).toEqual([]);
    expect(alive(fakeState().emulators['5556'].pid)).toBe(true);

    if (action === 'install') {
      expect(fakeState().installed).toBeNull();
    }

    if (action === 'signal jsLogs') {
      await new Promise(done => setTimeout(done, 200));
      expect(alive(started.jsLogs.pid)).toBe(true);
    }
  }
);

test.each([
  ['install', 'start'],
  ['data clear', 'start --fresh'],
  ['kill', 'stop']
])(
  'a %s does not run when the device lease token does not match the lease',
  async (action, command) => {
    const { root, stack, stackIn, editFake, fakeState, logPath } =
      await harness();

    if (action === 'install') {
      editFake(state => {
        state.installed = null;
        state.tokenOverride = 'other-lease';
      });
    } else {
      await stack('start');
      editFake(state => (state.tokenOverride = 'other-lease'));
    }

    const before = allCalls(logPath).length;

    const run = await stackIn(root, command.split(' '));

    const order = commands(allCalls(logPath).slice(before));
    expect(order.some(call => call.includes(' install '))).toBe(false);
    expect(order).not.toContain(`adb -s ${SERIAL} shell pm clear ${PACKAGE}`);
    expect(order).not.toContain(`adb -s ${SERIAL} emu kill`);
    await new Promise(done => setTimeout(done, 200));
    expect(alive(fakeState().emulators['5556'].pid)).toBe(true);

    if (action === 'kill') {
      expect(JSON.parse(run.stdout)).toMatchObject({ untrusted: ['emulator'] });
    } else {
      expect(run.status).toBe(1);
      expect(run.stderr).toContain(
        `${SERIAL} no longer passes its identity check, so ${action === 'data clear' ? 'clear data' : action} did not run.`
      );
      editFake(state => delete state.tokenOverride);
      await stack('stop');
    }
  }
);
