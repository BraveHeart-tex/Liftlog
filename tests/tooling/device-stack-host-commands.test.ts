import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import {
  PACKAGE,
  FOREIGN,
  SERIAL,
  harness,
  allCalls,
  commands,
  expectTargeted,
  link,
  target
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

// The route map pulled the app database by hand, so a query could read another device's copy.
test('sql without a ready lease exits with NO_LEASE and writes nothing', async () => {
  const { stack, root, logPath } = await harness();
  const before = allCalls(logPath).length;

  const noLease = await stack('sql', 'SELECT id FROM workout_templates');

  expect(noLease.status).toBe(1);
  expect(noLease.stderr).toContain('NO_LEASE: ');
  expect(existsSync(join(root, '.device-stack', 'db'))).toBe(false);
  expect(allCalls(logPath).slice(before)).toEqual([]);
});

// The template boots with every animation scale at 0, which Reanimated reads as reduced
// motion, so a check of press or transition motion never saw it.
test('motion sets the three animation scales on the lease serial only and reopens the app on its Metro', async () => {
  const { stack, logPath } = await harness();
  const noLease = await stack('motion', 'on');
  expect(noLease.status).toBe(1);
  expect(noLease.stderr).toContain('NO_LEASE: ');
  const { session, port } = JSON.parse((await stack('start')).stdout);
  const scales = (value: string) =>
    [
      'window_animation_scale',
      'transition_animation_scale',
      'animator_duration_scale'
    ].map(
      scale => `adb -s ${SERIAL} shell settings put global ${scale} ${value}`
    );

  for (const [mode, value] of [
    ['on', '1'],
    ['off', '0']
  ]) {
    const before = allCalls(logPath).length;

    const run = await stack('motion', mode);

    expect(run.status).toBe(0);
    const calls = allCalls(logPath).slice(before);
    expect(
      commands(calls).filter(call => call.includes(' settings put '))
    ).toEqual(scales(value));
    expect(commands(calls)).toContain(
      `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} ${target(session)}`
    );
    expectTargeted(calls, session);
  }

  const before = allCalls(logPath).length;
  const refused = [[], ['sideways'], ['--on'], ['on', 'off']];

  const runs = await Promise.all(refused.map(args => stack('motion', ...args)));

  runs.forEach(run => expect(run.status).toBe(1));
  expect(allCalls(logPath).slice(before)).toEqual([]);
}, 30_000);

// A screenshot after a held press landed after the long press had navigated, so no check
// could see or measure a pressed state.
test('capture-press holds the one control with the label and captures it on the lease serial only', async () => {
  const rect = { x: 25, y: 743, width: 671, height: 115 };
  const { stack, stackIn, root, env, logPath } = await harness({
    snapshotNodes: [
      { label: 'Bench Press, Chest', hittable: true, rect },
      { label: 'Bench Press, Chest', hittable: null, rect },
      { label: 'Go back', hittable: true, rect },
      { label: 'Go back', hittable: true, rect }
    ],
    widths: { rest: 671, pressed: 651 }
  });
  const { session } = JSON.parse((await stack('start')).stdout);
  const before = allCalls(logPath).length;

  const run = await stack('capture-press', 'Bench Press, Chest');

  expect(run.status).toBe(0);
  const output = JSON.parse(run.stdout);
  expect(output).toMatchObject({
    restWidth: 671,
    pressedWidth: 651,
    ratio: 0.97
  });
  const screenshots = join(root, '.device-stack', 'screenshots');
  expect(readFileSync(output.rest, 'utf8')).toBe('png');
  expect(readFileSync(output.pressed, 'utf8')).toBe('png');
  expect([output.rest, output.pressed].map(path => dirname(path))).toEqual([
    screenshots,
    screenshots
  ]);
  const calls = allCalls(logPath).slice(before);
  const remote = '/data/local/tmp/liftlog-capture-press.png';
  expect(commands(calls.filter(call => call.name === 'adb'))).toEqual([
    `adb -s ${SERIAL} shell screencap -p ${remote}`,
    `adb -s ${SERIAL} pull ${remote} ${output.rest}`,
    `adb -s ${SERIAL} shell input swipe 361 801 361 801 300 & sleep 0.22; screencap -p ${remote}; wait`,
    `adb -s ${SERIAL} pull ${remote} ${output.pressed}`
  ]);
  expect(
    calls
      .filter(call => call.name === 'magick')
      .map(call => call.args.slice(1, 3))
  ).toEqual([
    ['-crop', '671x115+25+743'],
    ['-crop', '671x115+25+743']
  ]);
  expectTargeted(calls, session);

  const refusedBefore = allCalls(logPath).length;

  for (const [label, count] of [
    ['Squat', 0],
    ['Go back', 2]
  ] as const) {
    const refused = await stack('capture-press', label);

    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain(
      `REFUSED: capture-press needs exactly one control labeled "${label}", and the snapshot has ${count}`
    );
  }

  // Without ImageMagick it fails before touching the device.
  const noMagick = await stackIn(
    root,
    ['capture-press', 'Go back'],
    undefined,
    {
      PATH: (env.PATH ?? '')
        .split(delimiter)
        .filter((entry: string) => !existsSync(join(entry, 'magick')))
        .join(delimiter)
    }
  );

  expect(noMagick.status).toBe(1);
  expect(noMagick.stderr).toContain('ImageMagick');
  expect(
    allCalls(logPath)
      .slice(refusedBefore)
      .filter(call => call.name !== 'agent-device')
  ).toEqual([]);
}, 30_000);
