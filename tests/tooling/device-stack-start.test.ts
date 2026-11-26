import {
  AUDIT_AVD,
  AVD,
  PACKAGE,
  PIXEL_7_CONFIG,
  SERIAL,
  TEMPLATE,
  alive,
  allCalls,
  avdConfigPath,
  commands,
  directories,
  expectTargeted,
  harness,
  instanceBoot,
  link,
  target,
  waitUntil
} from '@/tests/tooling/device-stack-harness';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// docs/adr/0008-device-stack-architecture.md "Emulator instances": the harness AVD's hardware.
const HARNESS_HARDWARE =
  'hw.lcd.density=280\nhw.lcd.height=1600\nhw.lcd.width=720\nhw.ramSize=4096\n';

test('start boots the harness emulator beside a phone and a foreign emulator, opens the app on its Metro port and prints its state', async () => {
  const { root, port, stack, logPath } = await harness();

  const { status, stdout, stderr, calls } = await stack('start');

  expect(status).toBe(0);
  const state = JSON.parse(stdout);
  const session = state.session;
  expect(session).toMatch(/^liftlog-/);
  expect(commands(calls)).toEqual(
    expect.arrayContaining([
      'emulator -list-avds',
      instanceBoot(state.lease.id),
      `adb -s ${SERIAL} shell setprop debug.liftlog.lease ${state.lease.id}`,
      `adb -s ${SERIAL} shell ping -c 1 -W 1 10.0.2.2`,
      `adb -s ${SERIAL} emu avd name`,
      `adb -s ${SERIAL} shell pm path ${PACKAGE}`,
      `pnpm exec expo start --dev-client --port ${port}`,
      `adb -s ${SERIAL} logcat -T 1 -s ReactNativeJS:V AndroidRuntime:E`,
      `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} ${target(session)}`,
      `agent-device snapshot --raw --timeout 5000 ${target(session)}`
    ])
  );
  expect(commands(calls)).not.toContain('adb devices');
  // The dev client reaches Metro through 10.0.2.2, not adb reverse.
  expect(commands(calls).some(call => call.includes(' reverse '))).toBe(false);
  expectTargeted(allCalls(logPath), session);
  const order = commands(calls);
  expect(
    order.findIndex(call => call.startsWith('agent-device open'))
  ).toBeGreaterThan(
    order.indexOf(
      `adb -s ${SERIAL} logcat -T 1 -s ReactNativeJS:V AndroidRuntime:E`
    )
  );
  // Metro starts without CI, so reloads stay on.
  expect(calls.find(call => call.name === 'pnpm')?.ci).toBeNull();
  expect(order).not.toContain(`adb -s ${SERIAL} shell pm clear ${PACKAGE}`);
  // The installed build matches the cached one, so nothing is built or installed.
  expect(order.some(call => call.includes(' install '))).toBe(false);
  expect(calls.map(call => call.name)).not.toContain('gradlew');
  expect(stderr).toContain(`booting a read-only ${AVD} instance as ${SERIAL}`);

  const dir = join(root, '.device-stack');
  expect(state).toMatchObject({
    running: true,
    startScreen: true,
    root,
    port,
    package: PACKAGE,
    emulator: {
      serial: SERIAL,
      avd: AVD,
      started: true,
      process: {
        markers: [
          '-avd',
          AVD,
          '-port',
          '5556',
          `debug.liftlog.lease=${state.lease.id}`
        ]
      }
    },
    lease: { templateVersion: TEMPLATE.version },
    devBuild: { foundInstalled: true },
    metro: { started: true, log: join(dir, 'metro.log') },
    jsLogs: { started: true, log: join(dir, 'js.log') }
  });
  expect(state.metro.process).toMatchObject({ pid: state.metro.pid });
  expect(state.metro.process.startTime).toEqual(expect.any(String));
  expect(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'))).toEqual(
    state
  );
  expect(readFileSync(state.metro.log, 'utf8')).toContain(
    'fake metro listening'
  );
  // Native crashes reach the JS log only through the AndroidRuntime tag in the filter above.
  expect(readFileSync(state.jsLogs.log, 'utf8')).toContain('ReactNativeJS');
});

test('start refuses a missing harness AVD and names the template command without booting anything', async () => {
  const { stack } = await harness({ avds: [AUDIT_AVD] });

  const { status, stderr, calls } = await stack('start');

  expect(status).toBe(1);
  expect(stderr).toContain(
    `${AVD} or its template snapshot does not exist. Create them with \`pnpm run device:stack template\``
  );
  expect(commands(calls).filter(call => !call.startsWith('lsof'))).toEqual([
    'emulator -list-avds'
  ]);
});

test('template creates the harness AVD and a clean template snapshot once', async () => {
  const { stack, fakeState, editFake, hostDir } = await harness(
    { avds: [AUDIT_AVD] },
    { seedTemplate: false }
  );
  editFake(state => (state.installed = null));

  const created = await stack('template');

  expect(created.status).toBe(0);
  const output = JSON.parse(created.stdout);
  expect(output).toMatchObject({
    avd: AVD,
    created: true,
    template: { snapshot: 'liftlog_template', version: expect.any(String) }
  });
  const order = commands(created.calls).filter(
    call => !call.startsWith('lsof')
  );
  expect(order.find(call => call.startsWith('avdmanager'))).toMatch(
    new RegExp(
      `^avdmanager create avd --name ${AVD} --package system-images;android-34;google_apis;(arm64-v8a|x86_64) --device pixel_7$`
    )
  );
  expect(order).toEqual(
    expect.arrayContaining([
      `emulator -avd ${AVD} -port 5556 -wipe-data -no-snapshot-load -no-boot-anim -gpu host`,
      `adb -s ${SERIAL} shell settings put global window_animation_scale 0`,
      `adb -s ${SERIAL} shell settings put global transition_animation_scale 0`,
      `adb -s ${SERIAL} shell settings put global animator_duration_scale 0`,
      `adb -s ${SERIAL} shell pm path ${PACKAGE}`,
      `adb -s ${SERIAL} emu avd snapshot save liftlog_template`,
      `adb -s ${SERIAL} emu kill`
    ])
  );
  expect(
    order.indexOf(`adb -s ${SERIAL} emu avd snapshot save liftlog_template`)
  ).toBeGreaterThan(order.indexOf(`adb -s ${SERIAL} shell pm path ${PACKAGE}`));
  expectTargeted(created.calls);
  expect(fakeState().avds).toEqual([AUDIT_AVD, AVD]);
  expect(
    created.calls.find(
      call => call.name === 'emulator' && call.args.includes('-wipe-data')
    )?.avdConfig
  ).toBe(HARNESS_HARDWARE);
  expect(
    JSON.parse(readFileSync(join(hostDir, 'template.json'), 'utf8'))
  ).toEqual(output.template);

  const again = await stack('template');
  expect(JSON.parse(again.stdout)).toEqual({
    avd: AVD,
    created: false,
    template: output.template
  });
  expect(commands(again.calls.slice(created.calls.length))).toEqual([
    'emulator -list-avds'
  ]);
});

test('template --recreate applies the harness hardware to an existing AVD before saving the snapshot', async () => {
  const { home, hostDir, stack, editFake } = await harness();
  editFake(state => (state.installed = null));
  const config = avdConfigPath(home);
  mkdirSync(dirname(config), { recursive: true });
  writeFileSync(
    config,
    `avd.ini.encoding=UTF-8\n${PIXEL_7_CONFIG}showDeviceFrame=yes\n`
  );

  const { status, calls } = await stack('template', '--recreate');

  expect(status).toBe(0);
  expect(commands(calls).some(call => call.startsWith('avdmanager'))).toBe(
    false
  );
  const expected = `avd.ini.encoding=UTF-8\n${HARNESS_HARDWARE}showDeviceFrame=yes\n`;
  expect(
    calls.find(
      call => call.name === 'emulator' && call.args.includes('-wipe-data')
    )?.avdConfig
  ).toBe(expected);
  expect(readFileSync(config, 'utf8')).toBe(expected);
  expect(
    JSON.parse(readFileSync(join(hostDir, 'template.json'), 'utf8')).version
  ).not.toBe(TEMPLATE.version);
});

test('template --recreate refuses while any lease is live', async () => {
  const { root, hostDir, stack, logPath } = await harness();
  const { lease } = JSON.parse((await stack('start')).stdout);
  const before = allCalls(logPath).length;

  const { status, stderr } = await stack('template', '--recreate');

  expect(status).toBe(1);
  expect(stderr).toContain(
    `TEMPLATE_BUSY: the template cannot be rebuilt while leases are live: slot 0 by lease ${lease.id} from ${root}.`
  );
  expect(commands(allCalls(logPath).slice(before))).toEqual([
    'emulator -list-avds'
  ]);
  expect(
    JSON.parse(readFileSync(join(hostDir, 'template.json'), 'utf8'))
  ).toEqual(TEMPLATE);
  await stack('stop');
});

test('a new lease starts from the template without clearing data, and start --fresh on a running lease clears it and reopens the app', async () => {
  const { stack, logPath } = await harness();

  const first = await stack('start', '--fresh');

  expect(first.status).toBe(0);
  expect(commands(first.calls)).not.toContain(
    `adb -s ${SERIAL} shell pm clear ${PACKAGE}`
  );
  const { lease, session, port } = JSON.parse(first.stdout);
  const before = allCalls(logPath).length;

  const again = await stack('start', '--fresh');

  expect(again.status).toBe(0);
  expect(JSON.parse(again.stdout).lease).toEqual(lease);
  const order = commands(allCalls(logPath).slice(before)).filter(
    call => !call.startsWith('lsof') && !call.includes(' snapshot ')
  );
  expect(order).toEqual([
    `adb -s ${SERIAL} emu avd name`,
    `adb -s ${SERIAL} shell getprop debug.liftlog.lease`,
    `adb -s ${SERIAL} shell pm clear ${PACKAGE}`,
    `agent-device open ${PACKAGE} ${link(port)} --relaunch --metro-port ${port} ${target(session)}`
  ]);
  expectTargeted(allCalls(logPath), session);
  await stack('stop');
});

test('start --fresh dismisses dev-client onboarding before waiting for Workout', async () => {
  const { stack, logPath } = await harness({ onboarding: true });

  const { status, stdout, calls } = await stack('start', '--fresh');

  expect(status).toBe(0);
  const { session } = JSON.parse(stdout);
  expect(
    commands(calls.filter(call => call.name === 'agent-device')).slice(-3)
  ).toEqual([
    `agent-device press label="Continue" --settle ${target(session)}`,
    `agent-device press label="Close" ${target(session)}`,
    `agent-device snapshot --raw --timeout 5000 ${target(session)}`
  ]);
  expectTargeted(allCalls(logPath), session);
});

test('start fails before opening the app when a foreign server answers Metro status on the port', async () => {
  const { stack, logPath } = await harness({ foreignMetro: true });

  const { status, stderr, calls } = await stack('start');

  expect(status).toBe(1);
  expect(stderr).toMatch(/not the Metro this lease started/);
  expect(calls.map(call => call.name)).not.toContain('agent-device');
  expectTargeted(allCalls(logPath));
  await stack('stop');
});

test('a server this lease did not start on a slot Metro port blocks that slot and is never signaled', async () => {
  const { root, ports, stack, runningMetro, registry, logPath } =
    await harness();
  const other = realpathSync(mkdtempSync(join(tmpdir(), 'liftlog-worktree-')));
  directories.push(other);
  const metro = await runningMetro({ cwd: other });

  const started = await stack('start');

  expect(started.status).toBe(0);
  const state = JSON.parse(started.stdout);
  expect(state).toMatchObject({
    port: ports[1],
    lease: { slot: 1, serial: 'emulator-5558', metroPort: ports[1] }
  });
  expect(commands(started.calls)).toContain(
    `pnpm exec expo start --dev-client --port ${ports[1]}`
  );
  await stack('stop');
  await waitUntil(() => !alive(state.metro.pid));
  const blocker = await runningMetro({ slug: 'other-app', on: ports[1] });
  const before = allCalls(logPath).length;

  const refused = await stack('start');

  expect(refused.status).toBe(1);
  expect(refused.stderr).toContain(
    `CAPACITY: no emulator slot is free: slot 0 ports 5556/5557/${ports[0]} are held by pid ${metro}; slot 1 ports 5558/5559/${ports[1]} are held by pid ${blocker}.`
  );
  expect(
    allCalls(logPath)
      .slice(before)
      .map(call => call.name)
  ).toEqual(['lsof', 'lsof', 'lsof', 'lsof', 'lsof', 'lsof']);
  expect(registry().leases).toEqual([]);
  expect(existsSync(join(root, '.device-stack', 'state.json'))).toBe(false);
  expect(alive(metro)).toBe(true);
  expect(alive(blocker)).toBe(true);
});

test('stop ends the emulator, Metro and log capture that start started', async () => {
  const { stack, fakeState, logPath } = await harness();
  const started = JSON.parse((await stack('start')).stdout);

  const { status, stdout, calls } = await stack('stop');

  expect(status).toBe(0);
  expect(JSON.parse(stdout)).toEqual({
    running: false,
    stopped: ['session', 'jsLogs', 'metro', 'emulator']
  });
  expect(commands(calls)).toEqual(
    expect.arrayContaining([
      `agent-device close ${target(started.session)}`,
      `adb -s ${SERIAL} emu kill`
    ])
  );
  expect(fakeState().emulators).toEqual({});
  await new Promise(done => setTimeout(done, 200));
  expect(alive(started.metro.pid)).toBe(false);
  expect(alive(started.jsLogs.pid)).toBe(false);
  expectTargeted(allCalls(logPath), started.session);
});

test('stop and status distrust a recorded process whose start time no longer matches its PID', async () => {
  const { stack, editRecorded } = await harness();
  const started = JSON.parse((await stack('start')).stdout);
  // The PID now belongs to a different process than the one start recorded.
  editRecorded(state => {
    state.jsLogs.process.startTime = 'Mon Jan  1 00:00:00 2001';
    state.metro.process.markers = ['some-other-command'];
  });

  const observed = JSON.parse((await stack('status')).stdout);
  expect(observed).toMatchObject({
    running: false,
    observed: { emulator: 'running', metro: 'stopped', jsLogs: 'stopped' }
  });

  const { stdout } = await stack('stop');

  expect(JSON.parse(stdout)).toEqual({
    running: false,
    stopped: ['session', 'emulator'],
    untrusted: ['jsLogs', 'metro']
  });
  await new Promise(done => setTimeout(done, 200));
  expect(alive(started.jsLogs.pid)).toBe(true);
  expect(alive(started.metro.pid)).toBe(true);
});

test('status reports observed processes, or that nothing is running', async () => {
  const { stack } = await harness();

  const idle = await stack('status');
  expect(idle.status).toBe(0);
  expect(JSON.parse(idle.stdout)).toEqual({
    running: false,
    message: 'Nothing is running.'
  });

  const started = JSON.parse((await stack('start')).stdout);
  const running = await stack('status');
  expect(running.status).toBe(0);
  expect(JSON.parse(running.stdout)).toEqual({
    ...started,
    observed: { emulator: 'running', metro: 'running', jsLogs: 'running' }
  });
});

test.each([
  {
    label: 'every DEVICE_STACK_POLL_MS=10 ms, under 250 ms apart',
    poll: '10',
    range: [0, 250]
  },
  {
    label: 'every 500 ms without DEVICE_STACK_POLL_MS',
    poll: undefined,
    range: [500, Infinity]
  }
])('retried checks poll $label', async ({ poll, range: [min, max] }) => {
  const { root, stackIn } = await harness({ bootChecks: 2 });

  const { status, calls } = await stackIn(root, ['start'], undefined, {
    DEVICE_STACK_POLL_MS: poll
  });

  expect(status).toBe(0);
  const checks = calls
    .filter(
      ({ name, args }) => name === 'adb' && args.at(-1) === 'sys.boot_completed'
    )
    .map(({ at }) => at);
  expect(checks).toHaveLength(3);

  for (const [index, at] of checks.slice(1).entries()) {
    expect(at - checks[index]).toBeGreaterThanOrEqual(min);
    expect(at - checks[index]).toBeLessThan(max);
  }
});
