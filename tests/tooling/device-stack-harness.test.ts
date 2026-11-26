import { spawn } from 'node:child_process';
import { join } from 'node:path';
import {
  AVD,
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
