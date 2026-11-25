import type { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import {
  SERIAL,
  pids,
  alive,
  harness,
  commands,
  allCalls,
  expectTargeted,
  waitUntil
} from '@/tests/tooling/device-stack-harness';

const gradleCalls = (logPath: string) =>
  allCalls(logPath).filter(call => call.name === 'gradlew');

test.each([
  ['the app is not installed', null],
  ['another build is installed', 'apk:fingerprint-0']
])(
  'a cache hit installs the cached APK once without running Gradle when %s',
  async (_, installed) => {
    const { stack, editFake, fakeState, logPath } = await harness();
    const cached = fakeState().installed;
    editFake(state => (state.installed = installed));

    const { status, stdout, calls } = await stack('start');

    expect(status).toBe(0);
    const state = JSON.parse(stdout);
    expect(state.devBuild).toMatchObject({ built: false, installed: true });
    const order = commands(calls);
    expect(
      order.filter(call => call.startsWith('adb -s ' + SERIAL + ' install'))
    ).toEqual([`adb -s ${SERIAL} install -r -d ${state.devBuild.apk}`]);
    expect(order.findIndex(call => call.includes(' install '))).toBeLessThan(
      order.findIndex(call => call.startsWith('agent-device open'))
    );
    expect(calls.map(call => call.name)).not.toContain('gradlew');
    expect(fakeState().installed).toBe(cached);
    expectTargeted(allCalls(logPath), state.session);
    await stack('stop');
  }
);

test('start --no-build on a miss exits with BUILD_MISSING before building or booting', async () => {
  const { root, stack, recorded, logPath } = await harness(
    {},
    { seedBuild: false }
  );

  const { status, stderr, calls } = await stack('start', '--no-build');

  expect(status).toBe(1);
  expect(stderr).toContain('BUILD_MISSING: no cached dev build for key');
  expect(calls.map(call => call.name).filter(name => name !== 'lsof')).toEqual(
    []
  );
  expect(recorded()).toBeNull();
  expect(existsSync(join(root, '.device-stack', 'build.log'))).toBe(false);
  expect(gradleCalls(logPath)).toEqual([]);
});

test('a cache build regenerates android/ from scratch, so a file planted there never reaches it', async () => {
  const { root, stack } = await harness({}, { seedBuild: false });
  mkdirSync(join(root, 'android'));
  writeFileSync(join(root, 'android', 'planted.gradle'), 'stale');

  const { status, stdout, calls } = await stack('build');

  expect(status).toBe(0);
  expect(commands(calls)).toContain(
    'pnpm exec expo prebuild --platform android --no-install'
  );
  const gradle = calls.filter(call => call.name === 'gradlew');
  expect(gradle).toHaveLength(1);
  expect(gradle[0].args).toEqual([
    'app:assembleDebug',
    expect.stringMatching(/^-PreactNativeArchitectures=(arm64-v8a|x86_64)$/)
  ]);
  expect(gradle[0].files).toEqual(['gradlew']);
  const { apk, built } = JSON.parse(stdout);
  expect(built).toBe(true);
  expect(apk).toContain(join(root, '.git', 'device-stack', 'dev-builds'));
  expect(readFileSync(apk, 'utf8')).toBe('apk:fingerprint-1');
});

test.each([
  ['fails', { gradleFails: true }, 'the dev build failed'],
  [
    'sees the build key change',
    { fingerprintAfterBuild: 'fingerprint-2' },
    'the dev build key changed during the build, so nothing was published'
  ]
])(
  'a build that %s publishes nothing and exits with BUILD_FAILED and its log path',
  async (_, seed, reason) => {
    const { root, stack, buildLock } = await harness(seed, {
      seedBuild: false
    });

    const { status, stderr } = await stack('build');

    expect(status).toBe(1);
    const buildLog = join(root, '.device-stack', 'build.log');
    expect(stderr).toContain(`BUILD_FAILED: ${reason}; see ${buildLog}.`);
    expect(readFileSync(buildLog, 'utf8')).toContain('assembleDebug');
    const cache = join(root, '.git', 'device-stack', 'dev-builds');
    expect(existsSync(cache) ? readdirSync(cache) : []).toEqual([]);
    expect(existsSync(buildLock)).toBe(false);
  }
);

test('two worktrees missing the same key run one build, and the second installs its result', async () => {
  const { dir, stack, stackIn, worktree, editFake, logPath } = await harness(
    {},
    { seedBuild: false }
  );
  const hold = join(dir, 'release-gradle');
  editFake(state => (state.gradleHold = hold));
  const other = worktree();

  const first = stack('build');
  await waitUntil(() => gradleCalls(logPath).length > 0);
  const second = stackIn(other, ['start']);
  // The second start records the build it waits for.
  const otherState = join(other, '.device-stack', 'state.json');
  await waitUntil(
    () =>
      existsSync(otherState) &&
      readFileSync(otherState, 'utf8').includes('"devBuild"')
  );
  writeFileSync(hold, '');
  const [built, started] = await Promise.all([first, second]);

  expect(built.status).toBe(0);
  expect(started.status).toBe(0);
  const { apk } = JSON.parse(built.stdout);
  const state = JSON.parse(started.stdout);
  expect(state.devBuild).toMatchObject({ built: true, installed: true, apk });
  expect(commands(started.calls)).toContain(
    `adb -s ${SERIAL} install -r -d ${apk}`
  );
  expect(gradleCalls(logPath)).toHaveLength(1);
  expect(gradleCalls(logPath)[0].cwd).not.toContain(other);
  await stackIn(other, ['stop']);
});

test('killing start leaves the build lock with the build process, and the next start installs its APK', async () => {
  const { dir, root, stack, stackIn, buildLock, editFake, fakeState, logPath } =
    await harness({}, { seedBuild: false });
  const hold = join(dir, 'release-gradle');
  editFake(state => (state.gradleHold = hold));
  let starter: ReturnType<typeof spawn> | undefined;

  const first = stackIn(root, ['start'], child => (starter = child));
  await waitUntil(() => gradleCalls(logPath).length > 0);
  const owner = JSON.parse(readFileSync(buildLock, 'utf8'));
  pids.push(owner.pid);
  starter!.kill('SIGTERM');
  const killed = await first;

  expect(killed.signal).toBe('SIGTERM');
  await new Promise(done => setTimeout(done, 300));
  expect(JSON.parse(readFileSync(buildLock, 'utf8'))).toEqual(owner);
  expect(owner.pid).not.toBe(starter!.pid);
  expect(owner.markers).toContain('build-worker');
  expect(alive(owner.pid)).toBe(true);

  writeFileSync(hold, '');
  await waitUntil(() => !existsSync(buildLock));
  await stack('stop');
  const next = await stack('start');

  expect(next.status).toBe(0);
  const state = JSON.parse(next.stdout);
  expect(state.devBuild).toMatchObject({ built: false, installed: true });
  expect(fakeState().installed).toBe('apk:fingerprint-1');
  expect(gradleCalls(logPath)).toHaveLength(1);
  await stack('stop');
});
