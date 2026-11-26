import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import {
  PACKAGE,
  FOREIGN,
  SERIAL,
  harness,
  allCalls
} from '@/tests/tooling/device-stack-harness';

// The script's OPEN_INTERVAL_MS.
const OPEN_INTERVAL_MS = 3000;
const adbCalls = (logPath: string, from: number) =>
  allCalls(logPath)
    .slice(from)
    .filter(call => call.name === 'adb');
const viewIntent = (path: string) => [
  '-s',
  SERIAL,
  'shell',
  'am',
  'start',
  '-W',
  '-a',
  'android.intent.action.VIEW',
  '-d',
  `'liftlog:///${path}'`,
  PACKAGE
];

// Rapid deep links dropped the app to the dev launcher while pacing was only a prose rule.
test('open sends each deep link to the lease serial and spaces consecutive links by the minimum interval', async () => {
  const { stack, logPath } = await harness();
  await stack('start');
  const before = allCalls(logPath).length;

  const first = await stack('open', 'workout/active');
  const second = await stack('open', '/log');

  expect([first.status, second.status]).toEqual([0, 0]);
  const opened = adbCalls(logPath, before);
  expect(opened.map(call => call.args)).toEqual([
    viewIntent('workout/active'),
    viewIntent('log')
  ]);
  expect(opened[1].at - opened[0].at).toBeGreaterThanOrEqual(OPEN_INTERVAL_MS);
}, 30_000);

test('open refuses URLs, dev-client links, quotes, spaces and extra arguments before adb runs', async () => {
  const { stack, logPath } = await harness();
  await stack('start');
  const before = allCalls(logPath).length;
  const attempts = [
    [],
    ['https://example.com'],
    ['liftlog:///workout'],
    ['expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8091'],
    ['workout active'],
    ["workout'; reboot; '"],
    ['workout', 'log']
  ];

  const runs = await Promise.all(attempts.map(args => stack('open', ...args)));

  for (const run of runs) {
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('REFUSED: open ');
  }

  expect(adbCalls(logPath, before)).toEqual([]);
});

// The Recipe called adb without -s, so a second device or emulator received the command.
test('adb forwards only shell, exec-out and pull to the lease serial and refuses everything else before adb runs', async () => {
  const { stack, logPath } = await harness();
  const noLease = await stack('adb', 'shell', 'ls');
  expect(noLease.status).toBe(1);
  expect(noLease.stderr).toContain('NO_LEASE: ');
  await stack('start');
  const allowed = [
    ['shell', 'getprop', 'ro.product.model'],
    ['shell', 'pm', 'clear', PACKAGE],
    ['exec-out', 'run-as', PACKAGE, 'cat', 'files/SQLite/workout.db'],
    ['pull', '/sdcard/shot.png', '/tmp/shot.png']
  ];

  for (const args of allowed) {
    const before = allCalls(logPath).length;

    const run = await stack('adb', ...args);

    expect(run.status).toBe(0);
    expect(adbCalls(logPath, before).map(call => call.args)).toEqual([
      ['-s', SERIAL, ...args]
    ]);
  }

  const before = allCalls(logPath).length;
  const refused = [
    [],
    ['-s', FOREIGN, 'shell', 'ls'],
    ['-d', 'shell', 'ls'],
    ['-e', 'shell', 'ls'],
    ['-t', '1', 'shell', 'ls'],
    ['-H', 'example.com', 'shell', 'ls'],
    ['install', '/tmp/other.apk'],
    ['install-multiple', '/tmp/a.apk'],
    ['uninstall', PACKAGE],
    ['root'],
    ['unroot'],
    ['reboot'],
    ['forward', 'tcp:8081', 'tcp:8081'],
    ['reverse', 'tcp:8081', 'tcp:8081'],
    ['emu', 'kill'],
    ['start-server'],
    ['kill-server'],
    ['devices'],
    ['connect', 'example.com:5555'],
    ['shell', 'reboot'],
    ['shell', 'su', '0', 'ls'],
    ['shell', 'ls; reboot'],
    ['shell', 'setprop', 'debug.liftlog.lease', 'other'],
    ['shell', 'svc', 'power', 'shutdown'],
    ['exec-out', 'pm', 'install', '/data/local/tmp/other.apk'],
    ['shell', 'cmd', 'package', 'uninstall', PACKAGE]
  ];

  const runs = await Promise.all(refused.map(args => stack('adb', ...args)));

  runs.forEach(run => {
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('REFUSED: adb ');
  });
  expect(adbCalls(logPath, before)).toEqual([]);
}, 30_000);

test('logs prints at most the requested number of matching lines of the JS or Metro log', async () => {
  const { stack, recorded } = await harness();
  await stack('start');
  const { jsLogs, metro } = recorded();
  writeFileSync(
    jsLogs.log,
    Array.from({ length: 80 }, (_, line) => `js ${line}\n`).join('')
  );
  appendFileSync(metro.log, 'bundled\nwarning one\nwarning two\n');

  const tail = await stack('logs', '--lines', '3');
  const fallback = await stack('logs');
  const grep = await stack('logs', 'js', '--grep', '^js 1', '--lines', '2');
  const metroTail = await stack('logs', 'metro', '--lines', '1');
  const bad = await Promise.all([
    stack('logs', '--lines', '0'),
    stack('logs', '--lines', '501'),
    stack('logs', 'other')
  ]);

  expect(tail.stdout).toBe('js 77\njs 78\njs 79\n');
  expect(fallback.stdout.split('\n').filter(Boolean)).toHaveLength(50);
  expect(grep.stdout).toBe('js 18\njs 19\n');
  expect(metroTail.stdout).toBe('warning two\n');
  bad.forEach(run => expect(run.status).toBe(1));
});

// The JS log appended across runs, so a new lease showed the previous lease's errors.
test('a new lease starts with empty JS and Metro logs', async () => {
  const { stack, recorded } = await harness();
  await stack('start');
  const { jsLogs, metro } = recorded();
  appendFileSync(jsLogs.log, 'stale js\n');
  appendFileSync(metro.log, 'stale metro\n');
  await stack('stop');

  await stack('start');

  expect(readFileSync(jsLogs.log, 'utf8')).not.toContain('stale');
  expect(readFileSync(metro.log, 'utf8')).not.toContain('stale');
  expect((await stack('logs')).stdout).not.toContain('stale');
  expect((await stack('logs', 'metro')).stdout).not.toContain('stale');
});
