import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test, { afterEach } from 'node:test';

const issueUrl = 'https://github.com/BraveHeart-tex/Liftlog/issues/42';

test('rejects missing required inputs before calling GitHub', () => {
  const result = spawnSync(process.execPath, ['scripts/create-issue.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '/nonexistent' }
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--title/);
});

const dirs: string[] = [];
afterEach(() =>
  dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true }))
);

// A fake `gh` first on PATH that keeps issue, relationship and Project state in a JSON file,
// so creation, partial failure and resume run end to end without touching GitHub.
const fake = `#!/usr/bin/env node
const fs = require('node:fs')
const a = process.argv.slice(2)
const path = process.env.FAKE_STATE
const s = JSON.parse(fs.readFileSync(path, 'utf8'))
s.calls.push(a)
const value = (key) => a[a.indexOf(key) + 1]
let out = {}
let failure = false
if (s.failAt === a.slice(0,2).join(' ')) { process.stderr.write('injected failure'); process.exit(1) }
const key = a.slice(0, 2).join(' ')
if (key === 'project list') out = {projects:[{title:'LiftLog',id:'P',number:4}]}
else if (key === 'project field-list') out = {fields:[
 {name:'Status',id:'S',options:[{name:'Backlog',id:'B'}]},
 {name:'Priority',id:'F',options:['Urgent','High','Medium','Low'].map(name => ({name,id:name}))}]}
else if (key === 'issue create') {
 s.creates++
 s.issue = {number:42,url:'${issueUrl}',title:value('--title'),body:fs.readFileSync(value('--body-file'),'utf8'),labels:a.flatMap((x,i) => x === '--label' ? [{name:a[i+1]}] : []),parent:null,blockedBy:{nodes:[]}}
 out = s.issue.url
}
else if (key === 'issue view') out = {...s.issue, ...(s.mismatch === 'body' ? {body:'changed'} : {}), ...(s.mismatch === 'labels' ? {labels:[]} : {}), ...(s.mismatch === 'title' ? {title:'changed'} : {}), ...(s.mismatch === 'relationships' ? {parent:{number:999}} : {})}
else if (key === 'project item-add') out = {id:'I'}
else if (key === 'project item-edit') {
 if (s.fail) failure = true
 else s.fields[value('--field-id')] = value('--single-select-option-id')
}
else if (key === 'api graphql') out = {data:{node:{fieldValues:{nodes:s.mismatch === 'fields' ? [] : Object.entries(s.fields).map(([key,name]) => ({name:name === 'B' ? 'Backlog':name,field:{name:key === 'S' ? 'Status':'Priority'}}))}}}}
else if (a[0] === 'api') {
 const endpoint = a.find(x => x.startsWith('repos/'))
 if (a.includes('POST')) {
  if (endpoint.endsWith('/sub_issues')) s.issue.parent = {number:Number(endpoint.split('/').at(-2))}
  else s.issue.blockedBy.nodes.push({number:Number(value('-F').split('=').at(-1)) - 1000})
 } else out = {id:1000 + Number(endpoint.split('/').at(-1))}
} else failure = true
fs.writeFileSync(path,JSON.stringify(s))
if (failure) { process.stderr.write('injected denial'); process.exit(1) }
process.stdout.write(typeof out === 'string' ? out + '\\n' : JSON.stringify(out))
`;
const validTicket = [
  '## What to build',
  'Log a set.',
  '## Ownership',
  '- Owns: the log-set command',
  '- Out of scope: export (#55)',
  '## Size',
  'Migrations 0 · New screens 0 · Native modules 0 · Proofs 1',
  '## Acceptance criteria',
  '- [ ] A logged set saves - Evidence: repository test',
  ''
].join('\n');

type State = {
  calls: string[][];
  creates: number;
  fields: Record<string, string>;
  issue: { body: string };
};

function harness() {
  const dir = mkdtempSync(join(tmpdir(), 'create-issue-'));
  dirs.push(dir);
  const statePath = join(dir, 'state.json');
  const bodyPath = join(dir, 'body.md');
  const body = `  Exact body\r\n\nUnicode: İ 🏋️\n${validTicket}`;
  writeFileSync(bodyPath, body);
  writeFileSync(join(dir, 'gh'), fake);
  chmodSync(join(dir, 'gh'), 0o755);
  writeFileSync(
    statePath,
    JSON.stringify({ calls: [], creates: 0, fields: {} })
  );
  const state = (): State => JSON.parse(readFileSync(statePath, 'utf8'));
  const patch = (value: object) =>
    writeFileSync(statePath, JSON.stringify({ ...state(), ...value }));
  const defaults = [
    '--title',
    'A ticket',
    '--body-file',
    bodyPath,
    '--category',
    'enhancement',
    '--areas',
    'ui',
    '--priority',
    'High'
  ];
  const invoke = (extra: string[] = [], useDefaults = true) =>
    spawnSync(
      process.execPath,
      [
        'scripts/create-issue.mjs',
        ...(useDefaults
          ? defaults.filter((_, i, all) => !extra.includes(all[i - (i % 2)]))
          : []),
        ...extra
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${dir}${delimiter}${process.env.PATH}`,
          NODE_NO_WARNINGS: '1',
          FAKE_STATE: statePath
        }
      }
    );

  return { state, patch, invoke, body, bodyPath };
}

test('creates once, preserves exact body and verifies relationships and Project fields', () => {
  const h = harness();
  const result = h.invoke(['--parent', '7', '--blocked-by', '8,9']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.deepEqual(JSON.parse(result.stdout), {
    number: 42,
    url: issueUrl,
    status: 'Backlog',
    priority: 'High',
    labels: ['enhancement', 'ui', 'needs-triage'],
    relationships: { verified: true, parent: 7, blockedBy: [8, 9] }
  });
  assert.equal(h.state().creates, 1);
  assert.equal(h.state().issue.body, h.body);
  assert.deepEqual(h.state().fields, { S: 'B', F: 'High' });
});

for (const extra of [
  ['--category', 'other'],
  ['--areas', 'ui,other'],
  ['--areas', 'ui,ui'],
  ['--areas', 'frontend'],
  ['--triage-state', 'other'],
  ['--triage-state', 'ready-for-agent'],
  ['--priority', 'Critical'],
  ['--parent-ticket'],
  ['--parent', '0'],
  ['--blocked-by', '8,8'],
  ['--blocked-by', '-1'],
  ['--resume', 'https://example.com/42'],
  ['--milestone', 'unused'],
  ['--title']
]) {
  test(`invalid inputs cause no GitHub calls: ${JSON.stringify(extra)}`, () => {
    const h = harness();
    const result = h.invoke(extra);
    assert.equal(result.status, 1);
    assert.deepEqual(h.state().calls, []);
  });
}

for (const triageState of [
  'needs-triage',
  'needs-info',
  'ready-for-agent',
  'ready-for-human',
  'wontfix'
]) {
  test(`verifies the explicit triage state ${triageState}`, () => {
    const h = harness();
    const result = h.invoke([
      '--triage-state',
      triageState,
      ...(triageState === 'ready-for-agent' ? ['--approved-breakdown'] : [])
    ]);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(JSON.parse(result.stdout).labels.includes(triageState));
  });
}

for (const priority of ['Urgent', 'High', 'Medium', 'Low']) {
  test(`configures Priority ${priority}`, () => {
    const h = harness();
    const result = h.invoke(
      [
        '--title',
        'A ticket',
        '--body-file',
        h.bodyPath,
        '--category',
        'bug',
        '--areas',
        'data,native',
        '--priority',
        priority
      ],
      false
    );
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.priority, priority);
    assert.deepEqual(output.labels, ['bug', 'data', 'native', 'needs-triage']);
    assert.equal(h.state().fields.F, priority);
  });
}

test('parent-ticket mode omits Priority and permits a native parent', () => {
  const h = harness();
  const result = h.invoke(
    [
      '--title',
      'A ticket',
      '--body-file',
      h.bodyPath,
      '--category',
      'bug',
      '--areas',
      'data',
      '--parent-ticket',
      '--parent',
      '7'
    ],
    false
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal('priority' in JSON.parse(result.stdout), false);
  assert.deepEqual(h.state().fields, { S: 'B' });
});

test('partial failure identifies the existing issue and resumes without duplicate creation or relationships', () => {
  const h = harness();
  h.patch({ fail: true });
  const failed = h.invoke(['--parent', '7', '--blocked-by', '8']);
  assert.equal(failed.status, 1);
  const diagnostics = JSON.parse(failed.stderr);
  assert.equal(diagnostics.url, issueUrl);
  assert.deepEqual(diagnostics.unfinished, ['Project fields', 'verify']);
  assert.match(failed.stderr, /injected denial/);
  assert.match(failed.stderr, /--resume 42/);
  h.patch({ fail: false });
  const resumed = h.invoke([
    '--parent',
    '7',
    '--blocked-by',
    '8',
    '--resume',
    '42'
  ]);
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal(h.state().creates, 1);
  assert.equal(h.state().calls.filter(a => a.includes('POST')).length, 2);
});

for (const mismatch of ['title', 'body', 'labels', 'relationships', 'fields']) {
  test(`read-back mismatch fails explicitly: ${mismatch}`, () => {
    const h = harness();
    h.patch({ mismatch });
    const result = h.invoke();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Read-back mismatch/);
    assert.ok(result.stderr.includes(issueUrl));
  });
}

for (const failAt of ['issue view', 'api --method', 'project item-add']) {
  test(`failure at ${failAt} retains recovery identity`, () => {
    const h = harness();
    h.patch({ failAt });
    const failed = h.invoke(['--parent', '7']);
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /--resume 42/);
    h.patch({ failAt: null });
    const resumed = h.invoke(['--parent', '7', '--resume', '42']);
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.equal(h.state().creates, 1);
  });
}

test('resume refuses changed content before any writes', () => {
  const h = harness();
  assert.equal(h.invoke().status, 0);
  h.patch({ calls: [] });
  const result = h.invoke(['--title', 'Different', '--resume', '42']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Read-back mismatch/);
  assert.equal(
    h
      .state()
      .calls.some(a =>
        ['create', 'item-add', 'item-edit', '--method'].includes(a[1])
      ),
    false
  );
});

for (const flag of ['--parent', '--blocked-by', '--resume']) {
  test(`rejects empty optional numeric input ${flag}`, () => {
    const h = harness();
    const result = h.invoke([flag, '']);
    assert.equal(result.status, 1);
    assert.deepEqual(h.state().calls, []);
  });
}

test('resume diagnostics retain identity even when metadata discovery fails', () => {
  const h = harness();
  assert.equal(h.invoke().status, 0);
  h.patch({ failAt: 'project list' });
  const result = h.invoke(['--resume', '42']);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(issueUrl));
});

test('non-parent tickets require Priority before any GitHub call', () => {
  const h = harness();
  const result = h.invoke(
    [
      '--title',
      'Ticket',
      '--body-file',
      h.bodyPath,
      '--category',
      'bug',
      '--areas',
      'data'
    ],
    false
  );
  assert.equal(result.status, 1);
  assert.deepEqual(h.state().calls, []);
});

test('non-parent ticket bodies fail the ticket rules before any GitHub call', () => {
  const h = harness();
  writeFileSync(h.bodyPath, 'No sections\n');
  const result = h.invoke(
    [
      '--title',
      'Ticket',
      '--body-file',
      h.bodyPath,
      '--category',
      'bug',
      '--areas',
      'data',
      '--priority',
      'High'
    ],
    false
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing section: ## Size/);
  assert.deepEqual(h.state().calls, []);
});
