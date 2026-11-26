import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PACKAGE,
  FOREIGN,
  SERIAL,
  harness,
  allCalls
} from '@/tests/tooling/device-stack-harness';

// `device` runs agent-device with the lease's flags before the command, so cdp's helper never
// receives them, and the slot Metro after it where the command picks a Metro.
const leaseFlags = (root: string, session: string) => [
  '--platform',
  'android',
  '--serial',
  SERIAL,
  '--session',
  session,
  '--config',
  join(root, '.device-stack', 'agent-device.json')
];
const agentDeviceCalls = (logPath: string, from: number) =>
  allCalls(logPath)
    .slice(from)
    .filter(call => call.name === 'agent-device');

test('device runs each allowed command on the lease, with the slot Metro for open, metro reload and cdp target discovery', async () => {
  const { root, port, stack, logPath } = await harness();
  const started = JSON.parse((await stack('start')).stdout);
  const metroPort = ['--metro-port', String(port)];
  const cdpUrl = ['--url', `http://127.0.0.1:${port}`];
  // Each allowed command with typical arguments, and what the wrapper appends.
  const cases: [string[], string[]][] = [
    [['alert', 'accept'], []],
    [['appstate'], []],
    [['back', '--settle'], []],
    [['cdp', 'target', 'list'], cdpUrl],
    [['cdp', 'target', 'select', 'target-1'], cdpUrl],
    [['cdp', 'runtime', 'eval', '--expr', '1+1'], []],
    [['click', '@e1'], []],
    [['clipboard', 'read'], []],
    [['close'], []],
    [['diff', 'snapshot'], []],
    [['fill', '@e2', '100'], []],
    [['find', 'Workout', 'click'], []],
    [['focus', '10', '20'], []],
    [['gesture', 'swipe', 'left'], []],
    [['get', 'text', '@e3'], []],
    [['home'], []],
    [['is', 'visible', 'id=workout-start-screen'], []],
    [['keyboard', 'dismiss'], []],
    [['longpress', '@e4'], []],
    [['metro', 'reload'], metroPort],
    [['open', PACKAGE, '--relaunch'], metroPort],
    [['open', 'liftlog:///workouts', '--timeout', '5000'], metroPort],
    [['open', PACKAGE, 'liftlog:///exercises', '--json'], metroPort],
    [['orientation', 'portrait'], []],
    [['press', 'label="Start"', '--settle'], []],
    [['react-devtools', 'status'], []],
    [['react-native', 'dismiss-overlay'], []],
    [['record', 'stop'], []],
    [['screenshot', '.device-stack/shot.png'], []],
    [['scroll', 'down'], []],
    [['settings', 'animations', 'off'], []],
    [['snapshot', '-i'], []],
    [['swipe', '1', '2', '3', '4'], []],
    [['type', 'Bench'], []],
    [['wait', 'text', 'Workout'], []]
  ];

  expect(started.session).toBe(`liftlog-${started.lease.id}`);

  for (const [args, metro] of cases) {
    const before = allCalls(logPath).length;

    const run = await stack('device', ...args);

    expect(run.status).toBe(0);
    expect(agentDeviceCalls(logPath, before).map(call => call.args)).toEqual([
      [...leaseFlags(root, started.session), ...args, ...metro]
    ]);
  }

  expect(
    readFileSync(join(root, '.device-stack', 'agent-device.json'), 'utf8')
  ).toBe('{}\n');
}, 60_000);

// Every spelling of the flags that select a device, app, session, Metro, config, daemon or
// remote endpoint.
const TARGETING_FLAGS = [
  '--platform',
  '--target',
  '--device',
  '--udid',
  '--serial',
  '--ios-simulator-device-set',
  '--android-device-allowlist',
  '--app',
  '--target-app',
  '--activity',
  '--launch-args',
  '--session',
  '--session-lock',
  '--session-isolation',
  '--metro-host',
  '--metro-port',
  '--bundle-url',
  '--launch-url',
  '--url',
  '--config',
  '--remote-config',
  '--state-dir',
  '--daemon-base-url',
  '--daemon-auth-token',
  '--daemon-transport',
  '--daemon-server-mode',
  '--remote',
  '--tenant',
  '--run-id',
  '--lease-id',
  '--lease-backend',
  '--provider',
  '--provider-session',
  '--header'
];

test('device refuses every targeting flag as --flag value and --flag=value before agent-device runs', async () => {
  const { stack, logPath } = await harness();
  await stack('start');
  const before = allCalls(logPath).length;
  const attempts = TARGETING_FLAGS.flatMap(flag => [
    { flag, args: ['snapshot', flag, 'other'] },
    { flag, args: ['press', '@e1', `${flag}=other`] }
  ]);

  const runs = await Promise.all(
    attempts.map(({ args }) => stack('device', ...args))
  );

  runs.forEach((run, index) => {
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(
      `REFUSED: ${attempts[index].flag} selects a target`
    );
  });
  expect(agentDeviceCalls(logPath, before)).toEqual([]);
});

test('device refuses commands outside the allowlist, close --shutdown and -- before agent-device runs', async () => {
  const { stack, logPath } = await harness();
  await stack('start');
  const before = allCalls(logPath).length;
  const attempts = [
    ['boot'],
    ['install', '/tmp/other.apk'],
    ['connect', 'cloud'],
    ['proxy'],
    ['batch', '--steps', '[]'],
    ['replay', 'flow.ad'],
    ['devices'],
    ['shutdown'],
    ['reinstall', PACKAGE, '/tmp/other.apk'],
    ['daemon', 'stop'],
    ['session', 'list'],
    ['metro', 'prepare', '--public-base-url', 'http://example.com'],
    ['close', '--shutdown'],
    ['snapshot', '--', '--serial', FOREIGN],
    []
  ];

  const runs = await Promise.all(
    attempts.map(args => stack('device', ...args))
  );

  for (const run of runs) {
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('REFUSED: ');
  }

  expect(agentDeviceCalls(logPath, before)).toEqual([]);
});

test('device keeps AGENT_DEVICE_* variables of the caller from agent-device', async () => {
  const { root, stackIn, logPath, stack } = await harness();
  const { session } = JSON.parse((await stack('start')).stdout);
  const before = allCalls(logPath).length;

  const run = await stackIn(root, ['device', 'snapshot'], undefined, {
    AGENT_DEVICE_SESSION: 'other-session',
    AGENT_DEVICE_PLATFORM: 'ios',
    AGENT_DEVICE_CONFIG: '/tmp/other-config.json',
    AGENT_DEVICE_DAEMON_BASE_URL: 'http://example.com',
    AGENT_DEVICE_DAEMON_AUTH_TOKEN: 'token'
  });

  expect(run.status).toBe(0);
  expect(agentDeviceCalls(logPath, before)).toEqual([
    expect.objectContaining({
      args: [...leaseFlags(root, session), 'snapshot'],
      env: []
    })
  ]);
});

test('device open refuses other packages, URL schemes and dev-client links', async () => {
  const { stack, logPath } = await harness();
  await stack('start');
  const before = allCalls(logPath).length;
  const attempts = [
    ['open'],
    ['open', 'com.android.settings'],
    ['open', 'Settings'],
    ['open', 'https://example.com'],
    ['open', 'intent://workouts#Intent;scheme=liftlog;end'],
    ['open', PACKAGE, 'https://example.com'],
    ['open', PACKAGE, 'liftlog:///workouts', 'liftlog:///exercises'],
    [
      'open',
      PACKAGE,
      'liftlog://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8091'
    ],
    ['open', PACKAGE, '--launch-console', 'console.log']
  ];

  const runs = await Promise.all(
    attempts.map(args => stack('device', ...args))
  );

  for (const run of runs) {
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('REFUSED: open ');
  }

  expect(agentDeviceCalls(logPath, before)).toEqual([]);
});

test('device exits with NO_LEASE before start and after stop without running agent-device', async () => {
  const { stack, logPath } = await harness();

  const before = await stack('device', 'snapshot');

  await stack('start');
  await stack('stop');
  const from = allCalls(logPath).length;
  const after = await stack('device', 'snapshot');

  for (const run of [before, after]) {
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('NO_LEASE: ');
  }

  expect(before.calls.filter(call => call.name === 'agent-device')).toEqual([]);
  expect(agentDeviceCalls(logPath, from)).toEqual([]);
});
