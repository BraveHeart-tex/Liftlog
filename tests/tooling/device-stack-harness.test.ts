import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
  AVD,
  SERIAL,
  alive,
  endFakeProcesses,
  harness,
  waitUntil
} from '@/tests/tooling/device-stack-harness';

// Catches cleanup that ends only recorded PIDs and leaves detached fakes running after the
// suite, as the 2026-11-26 leak of emulator, Metro and logcat fakes did.
test('cleanup ends a detached fake the harness did not record and names only it', async () => {
  const { env, fakes, fakeState, runningMetro } = await harness(
    {},
    { seedBuild: false }
  );
  const metro = await runningMetro();
  const emulator = join(fakes, 'bin', 'emulator');
  const detached = spawn(emulator, ['-avd', AVD, '-port', '5560'], {
    env,
    detached: true,
    stdio: 'ignore'
  });
  detached.unref();
  await waitUntil(() => fakeState().emulators['5560'] !== undefined);

  expect(endFakeProcesses()).toEqual([
    { pid: detached.pid, command: expect.stringContaining(emulator) }
  ]);
  await waitUntil(() => !alive(detached.pid!) && !alive(metro));
});

// Catches a fake that dispatches on args[0]: device() and swipe put the lease flags before the
// command, so such a fake answered none of their snapshot or attrs calls.
test('the fake agent-device answers commands behind leading lease flags', async () => {
  const node = { ref: 'e1', rect: { x: 0, y: 0, width: 10, height: 10 } };
  const { env, fakes } = await harness(
    { snapshotNodes: [node] },
    { seedBuild: false }
  );
  const lease = [
    '--platform',
    'android',
    '--serial',
    SERIAL,
    '--session',
    'liftlog-x',
    '--config',
    '/tmp/agent-device.json'
  ];
  const agentDevice = (...command: string[]) =>
    spawnSync(join(fakes, 'bin', 'agent-device'), [...lease, ...command], {
      env,
      encoding: 'utf8'
    });

  const snapshot = agentDevice('snapshot', '-i', '--json');
  const unknown = agentDevice('get', 'attrs', '@e9', '--json');

  expect(JSON.parse(snapshot.stdout).data.nodes).toEqual([node]);
  expect(unknown.status).not.toBe(0);
  expect(JSON.parse(unknown.stdout)).toEqual({ success: false });
});
