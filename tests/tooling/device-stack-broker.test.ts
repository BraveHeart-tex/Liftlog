import { spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  SERIAL,
  allCalls,
  freePort,
  harness,
  pids,
  waitUntil
} from '@/tests/tooling/device-stack-harness';

// docs/adr/0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md
const SANDBOX = 'liftlog-dev';

type Reply = { status: number; body: Record<string, any> };

const post = (port: number, body: string, headers: Record<string, string>) =>
  new Promise<Reply>((done, fail) => {
    const sent = request(
      { host: '127.0.0.1', port, method: 'POST', path: '/command', headers },
      response => {
        let text = '';
        response.setEncoding('utf8');
        response.on('data', chunk => (text += chunk));
        response.on('end', () =>
          done({ status: response.statusCode!, body: JSON.parse(text) })
        );
      }
    );
    sent.on('error', fail);
    sent.end(body);
  });

const deviceCalls = (logPath: string, from: number) =>
  allCalls(logPath)
    .slice(from)
    .filter(({ name }) => name === 'agent-device' || name === 'adb');

async function brokerRunning() {
  const stack = await harness();
  const brokerPorts = [await freePort(), await freePort()];

  stack.writeConfig({ sandbox: SANDBOX, brokerPorts });

  return { ...stack, brokerPorts, ...(await startBroker(stack, stack.root)) };
}

// The client runs from the checkout's scripts/, as it does in the sandbox.
async function startBroker(
  stack: Awaited<ReturnType<typeof harness>>,
  root: string,
  ...flags: string[]
) {
  const credentialPath = join(root, '.device-stack', 'broker.json');

  mkdirSync(join(root, 'scripts'));
  copyFileSync(
    resolve('scripts/lease-broker-client.mjs'),
    join(root, 'scripts', 'lease-broker-client.mjs')
  );
  const exited = stack.stackIn(root, ['broker', ...flags], child =>
    pids.push(child.pid!)
  );
  let broker: { port: number; credential: string } | undefined;

  await waitUntil(() => {
    try {
      broker = JSON.parse(readFileSync(credentialPath, 'utf8'));

      return true;
    } catch {
      return false;
    }
  });

  const client = (...args: string[]) =>
    new Promise<{ status: number | null; stdout: string; stderr: string }>(
      done => {
        const child = spawn(
          process.execPath,
          [join(root, 'scripts', 'lease-broker-client.mjs'), ...args],
          { env: { ...stack.env, DEVICE_STACK_BROKER_HOST: '127.0.0.1' } }
        );
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', chunk => (stdout += chunk));
        child.stderr.on('data', chunk => (stderr += chunk));
        child.on('close', status => done({ status, stdout, stderr }));
      }
    );
  const send = (body: unknown) =>
    post(broker!.port, JSON.stringify(body), {
      authorization: `Bearer ${broker!.credential}`
    });

  // Stops the lease through the broker and waits for the broker to exit.
  const end = async () => {
    await client('stop');
    await exited;
  };

  return {
    end,
    brokerPort: broker!.port,
    credential: broker!.credential,
    credentialPath,
    exited,
    client,
    send
  };
}

// The policy rule the broker adds with the lease and removes with it.
const ruleCalls = (port: number, sandbox = SANDBOX) => [
  [
    'policy',
    'allow',
    'network',
    '--no-input',
    '--sandbox',
    sandbox,
    `localhost:${port}`
  ],
  [
    'policy',
    'rm',
    'network',
    '--no-input',
    '--force',
    '--sandbox',
    sandbox,
    '--resource',
    `localhost:${port}`
  ]
];

test('broker refuses to start without a sandbox in the host config and leases nothing', async () => {
  const { stack, registry } = await harness({}, { seedBuild: false });

  const run = await stack('broker');

  expect(run.status).toBe(1);
  expect(run.stderr).toContain('NO_SANDBOX');
  expect(registry().leases).toEqual([]);
  expect(run.calls.filter(({ name }) => name === 'sbx')).toEqual([]);
});

// The client alone, in a checkout the broker does not serve.
test('the client tells a missing credential, naming the checkout, from an unreachable broker, naming the endpoint', async () => {
  const checkout = realpathSync(mkdtempSync(join(tmpdir(), 'broker-client-')));
  const clientPath = join(checkout, 'scripts', 'lease-broker-client.mjs');
  const run = () =>
    new Promise<{ status: number | null; stderr: string }>(done => {
      const child = spawn(process.execPath, [clientPath, 'status'], {
        env: { ...process.env, DEVICE_STACK_BROKER_HOST: '127.0.0.1' }
      });
      let stderr = '';
      child.stderr.on('data', chunk => (stderr += chunk));
      child.on('close', status => done({ status, stderr }));
    });

  mkdirSync(join(checkout, 'scripts'));
  copyFileSync(resolve('scripts/lease-broker-client.mjs'), clientPath);

  const missing = await run();

  expect(missing.status).toBe(1);
  expect(missing.stderr).toContain('NO_CREDENTIAL');
  expect(missing.stderr).toContain(checkout);
  expect(missing.stderr).not.toContain('BROKER_UNREACHABLE');

  const port = await freePort();
  const credential = 'c'.repeat(64);

  mkdirSync(join(checkout, '.device-stack'));
  writeFileSync(
    join(checkout, '.device-stack', 'broker.json'),
    JSON.stringify({ port, credential })
  );

  const unreachable = await run();

  expect(unreachable.status).toBe(1);
  expect(unreachable.stderr).toContain('BROKER_UNREACHABLE');
  expect(unreachable.stderr).toContain(`127.0.0.1:${port}`);
  expect(unreachable.stderr).not.toContain('NO_CREDENTIAL');
  expect(unreachable.stderr).not.toContain(credential);
});

test('the broker refuses a missing or wrong lease credential and runs nothing', async () => {
  const {
    brokerPort,
    brokerPorts,
    registry,
    logPath,
    client,
    credentialPath,
    end
  } = await brokerRunning();
  const from = allCalls(logPath).length;
  const status = JSON.stringify({ command: 'status', args: [] });

  // The broker port is the one fixed by the lease's slot.
  expect(brokerPort).toBe(brokerPorts[registry().leases[0].slot]);
  // Owner-only, like the checkout's .device-stack/.
  expect(statSync(credentialPath).mode & 0o777).toBe(0o600);

  for (const headers of [
    {} as Record<string, string>,
    { authorization: `Bearer ${'0'.repeat(64)}` },
    { authorization: 'Bearer short' },
    { authorization: 'Basic abc' }
  ]) {
    const reply = await post(brokerPort, status, headers);

    expect(reply.status).toBe(401);
    expect(reply.body.error).toContain('UNAUTHORIZED');
  }

  expect(deviceCalls(logPath, from)).toEqual([]);

  const served = await client('status');

  expect(served.status).toBe(0);
  expect(JSON.parse(served.stdout).running).toBe(true);
  await end();
});

test('the broker refuses commands outside its allowlist and arguments naming a flag, serial or path', async () => {
  const { root, logPath, send, client, recorded, end } = await brokerRunning();
  const from = allCalls(logPath).length;
  const refusedRequests = [
    { command: 'adb', args: ['shell', 'id'] },
    { command: 'shell', args: ['id'] },
    { command: 'install', args: ['app.apk'] },
    { command: 'device', args: ['snapshot'] },
    { command: 'toString', args: [] },
    { command: '__proto__', args: [] },
    { command: 'press', args: ['--serial'] },
    { command: 'press', args: ['@e1', '--serial=emulator-5554'] },
    { command: 'press', args: ['@e1;reboot'] },
    { command: 'fill', args: ['@e2', '-v'] },
    { command: 'open', args: ['emulator-5554'] },
    { command: 'open', args: ['workout/../../etc'] },
    { command: 'open', args: ['/etc/passwd'] },
    { command: 'open', args: ['liftlog://expo-development-client'] },
    { command: 'type', args: ['emulator-5554'] },
    { command: 'screenshot', args: ['../shot'] },
    { command: 'screenshot', args: ['/tmp/shot'] },
    { command: 'logs', args: ['js', '--grep'] },
    { command: 'start', args: ['--fresh'] },
    { command: 'snapshot', args: [42] }
  ];

  for (const body of refusedRequests) {
    const reply = await send(body);

    expect([body, reply.status]).toEqual([body, 403]);
    expect(reply.body.error).toContain('REFUSED');
  }

  expect(deviceCalls(logPath, from)).toEqual([]);

  // Allowed commands run their fixed argv on the lease.
  const { session } = recorded();
  const pressed = await client('press', '@e3');
  const shot = await client('screenshot', 'start-screen');

  expect(pressed.status).toBe(0);
  expect(shot.status).toBe(0);
  expect(
    deviceCalls(logPath, from).map(({ name, args }) => [name, ...args])
  ).toEqual(
    [
      ['press', '@e3'],
      [
        'screenshot',
        join(root, '.device-stack', 'screenshots', 'start-screen.png')
      ]
    ].map(command => [
      'agent-device',
      '--platform',
      'android',
      '--serial',
      SERIAL,
      '--session',
      session,
      '--config',
      join(root, '.device-stack', 'agent-device.json'),
      ...command
    ])
  );
  await end();
});

test('the broker runs motion on|off as the fixed device:stack motion argv and refuses any other argument', async () => {
  const { send, client, logPath, end } = await brokerRunning();
  const from = allCalls(logPath).length;

  for (const args of [[], ['sideways'], ['--on'], ['on', 'off'], ['1']]) {
    const reply = await send({ command: 'motion', args });

    expect([args, reply.status]).toEqual([args, 403]);
    expect(reply.body.error).toContain('REFUSED');
  }

  expect(deviceCalls(logPath, from)).toEqual([]);

  const on = await client('motion', 'on');

  expect(on.status).toBe(0);
  expect(
    deviceCalls(logPath, from)
      .filter(({ name }) => name === 'adb')
      .map(({ args }) => args.join(' '))
      .filter(line => line.includes(' settings put '))
  ).toEqual(
    [
      'window_animation_scale',
      'transition_animation_scale',
      'animator_duration_scale'
    ].map(scale => `-s ${SERIAL} shell settings put global ${scale} 1`)
  );
  await end();
});

test('stop through the broker releases the lease, stops the broker and removes its sandbox policy rule', async () => {
  const { brokerPort, client, exited, registry, credentialPath } =
    await brokerRunning();

  const stopped = await client('stop');
  const run = await exited;

  expect(stopped.status).toBe(0);
  expect(JSON.parse(stopped.stdout).running).toBe(false);
  expect(run.status).toBe(0);
  expect(registry().leases).toEqual([]);
  expect(existsSync(credentialPath)).toBe(false);
  expect(
    run.calls.filter(({ name }) => name === 'sbx').map(({ args }) => args)
  ).toEqual(ruleCalls(brokerPort));
});

test('releasing the lease on the host stops the broker and removes its sandbox policy rule', async () => {
  const { brokerPort, stack, exited, credentialPath } = await brokerRunning();

  expect((await stack('stop')).status).toBe(0);
  const run = await exited;

  expect(run.status).toBe(0);
  expect(existsSync(credentialPath)).toBe(false);
  expect(
    run.calls.filter(({ name }) => name === 'sbx').map(({ args }) => args)
  ).toEqual(ruleCalls(brokerPort));
});

test('a linked worktree has its own broker, Android target, recording artifacts and cleanup', async () => {
  const stack = await harness({}, { limit: 2 });
  const linked = stack.worktree();
  const sandbox = 'linked-sandbox';
  const brokerPorts = [await freePort(), await freePort()];
  stack.writeConfig({ limit: 2, sandbox: SANDBOX, brokerPorts });

  expect((await stack.stackIn(linked, ['broker'])).stderr).toContain(
    'NO_SANDBOX'
  );
  expect(
    (await stack.stackIn(linked, ['broker', '--sandbox', '--bad'])).status
  ).toBe(1);
  expect(stack.registry().leases).toEqual([]);

  const main = await startBroker(stack, stack.root);
  const issue = await startBroker(stack, linked, '--sandbox', sandbox);
  const state = JSON.parse((await issue.client('status')).stdout);
  const mainState = JSON.parse((await main.client('status')).stdout);

  expect(state).toMatchObject({ root: linked, running: true });
  expect(state.lease.serial).not.toBe(mainState.lease.serial);
  expect(state.port).not.toBe(mainState.port);
  expect(issue.brokerPort).toBe(brokerPorts[state.lease.slot]);
  expect(issue.brokerPort).not.toBe(main.brokerPort);
  expect(
    (
      await post(issue.brokerPort, '{"command":"status"}', {
        authorization: `Bearer ${main.credential}`
      })
    ).status
  ).toBe(401);

  const from = allCalls(stack.logPath).length;

  for (const args of [
    [],
    ['../outside'],
    ['/tmp/outside'],
    ['sub/clip'],
    ['--help'],
    ['clip.mp4'],
    ['clip', 'extra']
  ]) {
    expect((await issue.send({ command: 'record-start', args })).status).toBe(
      403
    );
  }

  expect(
    (await issue.send({ command: 'record-stop', args: ['clip'] })).status
  ).toBe(403);

  const artifacts = join(linked, '.device-stack', 'recordings');
  mkdirSync(artifacts);
  symlinkSync(stack.root, join(artifacts, 'redirect'));
  expect(
    (await issue.send({ command: 'record-start', args: ['redirect'] })).status
  ).toBe(403);
  expect(deviceCalls(stack.logPath, from)).toEqual([]);

  expect((await issue.client('record-start', 'clip')).status).toBe(0);
  expect((await issue.client('record-stop')).status).toBe(0);
  expect(
    deviceCalls(stack.logPath, from)
      .filter(({ name }) => name === 'agent-device')
      .map(({ args }) => args)
  ).toEqual(
    [['start', join(artifacts, 'clip', 'clip.mp4')], ['stop']].map(command => [
      '--platform',
      'android',
      '--serial',
      state.lease.serial,
      '--session',
      state.session,
      '--config',
      join(linked, '.device-stack', 'agent-device.json'),
      'record',
      ...command
    ])
  );

  await issue.end();
  expect(existsSync(issue.credentialPath)).toBe(false);
  expect(existsSync(main.credentialPath)).toBe(true);
  expect(stack.registry().leases.map(({ id }) => id)).toEqual([
    mainState.lease.id
  ]);
  expect(JSON.parse((await main.client('status')).stdout).running).toBe(true);
  const policy = () =>
    allCalls(stack.logPath)
      .filter(({ name }) => name === 'sbx')
      .map(({ args }) => args);
  expect(policy()).toEqual([
    ruleCalls(main.brokerPort)[0],
    ...ruleCalls(issue.brokerPort, sandbox)
  ]);
  await main.end();
  expect(policy().at(-1)).toEqual(ruleCalls(main.brokerPort)[1]);
});
