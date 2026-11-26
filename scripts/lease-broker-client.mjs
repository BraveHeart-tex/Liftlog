import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { request } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The in-sandbox client of the lease broker
// (docs/adr/0009-sandboxed-agents-reach-device-stacks-through-a-lease-broker.md;
// docs/verification.md "Sandboxed agents"). Run it with node inside the sandbox:
// `node scripts/lease-broker-client.mjs <command> [args]`. It sends the command with the lease
// credential from the checkout's .device-stack/broker.json, prints the output the broker
// returns and exits with its exit code. DEVICE_STACK_BROKER_HOST replaces the host.
const CHECKOUT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CREDENTIAL = join(CHECKOUT, '.device-stack', 'broker.json');
const HOST = process.env.DEVICE_STACK_BROKER_HOST || 'host.docker.internal';

const fail = message => {
  process.stderr.write(`lease-broker-client: ${message}\n`);
  process.exit(1);
};

const [command, ...args] = process.argv.slice(2);
let broker;

try {
  broker = JSON.parse(readFileSync(CREDENTIAL, 'utf8'));
} catch {
  fail(
    `NO_CREDENTIAL: no lease credential at ${CREDENTIAL}, so no lease broker serves the checkout ${CHECKOUT}; ask the maintainer to run \`pnpm run device:stack broker\` on the host from this checkout (with --sandbox <name> for a linked worktree).`
  );
}

const body = JSON.stringify({ command, args });
const sent = request(
  {
    host: HOST,
    port: broker.port,
    method: 'POST',
    path: '/command',
    headers: {
      authorization: `Bearer ${broker.credential}`,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body)
    }
  },
  response => {
    let text = '';

    response.setEncoding('utf8');
    response.on('data', chunk => (text += chunk));
    response.on('end', () => {
      let reply;

      try {
        reply = JSON.parse(text);
      } catch {
        fail(`the broker answered ${response.statusCode} without a result.`);
      }

      if (response.statusCode !== 200) {
        fail(reply.error);
      }

      process.stdout.write(reply.stdout);
      process.stderr.write(reply.stderr);
      process.exitCode = reply.status;
    });
  }
);

sent.on('error', error =>
  fail(
    `BROKER_UNREACHABLE: cannot reach the lease broker at ${HOST}:${broker.port} (${error.code ?? error.message}); check that the broker still runs on the host and that the sandbox's network policy allows localhost:${broker.port}.`
  )
);
sent.end(body);
