import { spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync
} from 'node:fs';
import { request } from 'node:http';
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

// Runs `broker` in the harness checkout, which is a main checkout, and waits for its lease
// credential. The client runs from the checkout's scripts/, as it does in the sandbox.
async function brokerRunning() {
  const stack = await harness();
  const brokerPorts = [await freePort(), await freePort()];
  const credentialPath = join(stack.root, '.device-stack', 'broker.json');

  stack.writeConfig({ sandbox: SANDBOX, brokerPorts });
  mkdirSync(join(stack.root, 'scripts'));
  copyFileSync(
    resolve('scripts/lease-broker-client.mjs'),
    join(stack.root, 'scripts', 'lease-broker-client.mjs')
  );
  const exited = stack.stackIn(stack.root, ['broker'], child =>
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
          [join(stack.root, 'scripts', 'lease-broker-client.mjs'), ...args],
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
    ...stack,
    end,
    brokerPort: broker!.port,
    brokerPorts,
    credentialPath,
    exited,
    client,
    send
  };
}

// The policy rule the broker adds with the lease and removes with it.
const ruleCalls = (port: number) => [
  [
    'policy',
    'allow',
    'network',
    '--no-input',
    '--sandbox',
    SANDBOX,
    `localhost:${port}`
  ],
  [
    'policy',
    'rm',
    'network',
    '--no-input',
    '--force',
    '--sandbox',
    SANDBOX,
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
