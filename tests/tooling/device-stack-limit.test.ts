import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { harness } from '@/tests/tooling/device-stack-harness';

const hostConfig = (hostDir: string) =>
  JSON.parse(readFileSync(join(hostDir, 'config.json'), 'utf8'));

// An overwrite with only `limit` dropped `sandbox`, `metroPorts` and `brokerPorts`.
test('limit 2 merges the limit into the host config and keeps every other key', async () => {
  const { stack, hostDir, ports } = await harness({}, { seedBuild: false });
  const kept = {
    metroPorts: ports,
    brokerPorts: [18_101, 18_102],
    sandbox: 'liftlog-sandbox'
  };
  writeFileSync(join(hostDir, 'config.json'), JSON.stringify(kept));

  const set = await stack('limit', '2');

  expect(set.status).toBe(0);
  expect(hostConfig(hostDir)).toEqual({ ...kept, limit: 2 });
});

test('limit refuses a value outside 1 to the maximum and leaves the config unchanged', async () => {
  const { stack, hostDir } = await harness({}, { seedBuild: false, limit: 1 });
  const before = readFileSync(join(hostDir, 'config.json'), 'utf8');

  const runs = await Promise.all(
    [['3'], ['0'], ['-1'], ['1.5'], ['two'], ['1', '2']].map(args =>
      stack('limit', ...args)
    )
  );

  for (const run of runs) {
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('device-stack: ');
  }

  expect(readFileSync(join(hostDir, 'config.json'), 'utf8')).toBe(before);
});

test('limit with no argument prints the effective limit and its source', async () => {
  const { stackIn, root, writeConfig } = await harness(
    {},
    { seedBuild: false }
  );
  const limit = async (env: Record<string, string | undefined> = {}) => {
    const run = await stackIn(root, ['limit'], undefined, {
      DEVICE_STACK_LIMIT: undefined,
      ...env
    });
    expect(run.status).toBe(0);

    return JSON.parse(run.stdout);
  };

  expect(await limit()).toEqual({ limit: 1, source: 'default' });
  writeConfig({ limit: 2 });
  expect(await limit()).toEqual({ limit: 2, source: 'host config' });
  expect(await limit({ DEVICE_STACK_LIMIT: '1' })).toEqual({
    limit: 1,
    source: 'DEVICE_STACK_LIMIT'
  });
  // The environment only lowers the limit, so a higher value leaves the host config's.
  writeConfig({ limit: 1 });
  expect(await limit({ DEVICE_STACK_LIMIT: '2' })).toEqual({
    limit: 1,
    source: 'host config'
  });
});
