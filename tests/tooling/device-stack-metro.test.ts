import { join } from 'node:path';
import {
  PACKAGE,
  SERIAL,
  harness,
  commands,
  allCalls,
  link
} from '@/tests/tooling/device-stack-harness';

test('two leases each serve their own worktree on their own slot Metro port', async () => {
  const { root, ports, stack, stackIn, worktree, fakeState, logPath } =
    await harness({}, { limit: 2 });
  const other = worktree();

  const first = await stack('start');
  const second = await stackIn(other, ['start']);

  expect(first.status).toBe(0);
  expect(second.status).toBe(0);
  const leases = [
    { root, ...JSON.parse(first.stdout) },
    { root: other, ...JSON.parse(second.stdout) }
  ];
  const calls = allCalls(logPath);

  leases.forEach(({ root: cwd, port, emulator, session }, slot) => {
    expect(port).toBe(ports[slot]);
    expect(
      calls
        .filter(call => call.name === 'pnpm' && call.args.includes('start'))
        .find(call => call.cwd === cwd)?.args
    ).toEqual([
      'exec',
      'expo',
      'start',
      '--dev-client',
      '--port',
      String(port)
    ]);
    expect(
      commands(calls).filter(
        call =>
          call.startsWith('agent-device open') && call.includes(emulator.serial)
      )
    ).toEqual([
      `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} --serial ${emulator.serial} --session ${session}`
    ]);
    expect(
      fakeState().listeners.find(listener => listener.port === port)?.cwd
    ).toBe(cwd);
  });
  await stack('stop');
  await stackIn(other, ['stop']);
});

test('Metro starts before the emulator finishes booting', async () => {
  const { stack } = await harness();

  const { status, calls } = await stack('start');

  expect(status).toBe(0);
  const order = commands(calls);
  expect(
    order.findIndex(call => call.startsWith('pnpm exec expo start'))
  ).toBeLessThan(
    order.indexOf(`adb -s ${SERIAL} shell getprop sys.boot_completed`)
  );
  await stack('stop');
});

test.each([
  [
    'a bundling error',
    { bundlingError: true },
    'Metro failed to bundle the app'
  ],
  ['a redbox', { redbox: true }, 'The app shows a redbox (Render Error)']
])(
  '%s fails start within seconds and prints the last Metro log lines',
  async (_, seed, reason) => {
    const { root, stack } = await harness(seed);
    const startedAt = Date.now();

    const { status, stderr } = await stack('start');

    expect(status).toBe(1);
    expect(Date.now() - startedAt).toBeLessThan(15_000);
    expect(stderr).toContain(
      `${reason}; last lines of ${join(root, '.device-stack', 'metro.log')}:\nfake metro listening`
    );

    if ('bundlingError' in seed) {
      expect(stderr).toContain(
        'Android Bundling failed 12ms index.js (1 module)\nSyntaxError: src/app/index.tsx: Unexpected token (3:7)'
      );
    }

    await stack('stop');
  }
);
