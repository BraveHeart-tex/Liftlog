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

const repoUrl = 'https://github.com/BraveHeart-tex/Liftlog';
const issueUrl = `${repoUrl}/issues/42`;

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
// Runs this Node directly, without an env lookup on each of the file's hundreds of calls.
const fake = `#!${process.execPath}
const fs = require('node:fs')
const a = process.argv.slice(2)
const path = process.env.FAKE_STATE
const s = JSON.parse(fs.readFileSync(path, 'utf8'))
s.calls.push(a)
const value = (key) => a[a.indexOf(key) + 1]
const url = (n) => '${repoUrl}/issues/' + n
const save = () => fs.writeFileSync(path, JSON.stringify(s))
const fail = (message) => { save(); process.stderr.write(message); process.exit(1) }
const key = a.slice(0, 2).join(' ')
s.seen[key] = (s.seen[key] ?? 0) + 1
if (s.failAt === key && (!s.failNth || s.failNth === s.seen[key])) fail('injected failure')
let out = {}
if (key === 'project list') out = {projects:[{title:'LiftLog',id:'P',number:4}]}
else if (key === 'project field-list') out = {fields:[
 {name:'Status',id:'S',options:[{name:'Backlog',id:'B'}]},
 {name:'Priority',id:'F',options:['Urgent','High','Medium','Low'].map(name => ({name,id:name}))}]}
else if (key === 'issue create') {
 const n = s.next++
 s.creates++
 s.issues[n] = {number:n,url:url(n),title:value('--title'),body:fs.readFileSync(value('--body-file'),'utf8'),labels:a.flatMap((x,i) => x === '--label' ? [{name:a[i+1]}] : []),parent:null,blockedBy:{nodes:[]}}
 out = url(n)
}
else if (key === 'issue view') out = {...s.issues[a[2]], ...(s.mismatch === 'body' ? {body:'changed'} : {}), ...(s.mismatch === 'labels' ? {labels:[]} : {}), ...(s.mismatch === 'title' ? {title:'changed'} : {}), ...(s.mismatch === 'relationships' ? {parent:{number:999}} : {})}
else if (key === 'issue edit') s.issues[a[2]].body = fs.readFileSync(value('--body-file'),'utf8')
else if (key === 'project item-add') {
 if (s.alreadyInProject) fail('GraphQL: Content already exists in this project (addProjectV2ItemById)')
 out = {id:'I'}
}
else if (key === 'project item-edit') {
 if (s.fail) fail('injected denial')
 s.fields[value('--field-id')] = value('--single-select-option-id')
}
else if (key === 'api graphql' && a.some(x => x.includes('projectItems'))) out = {data:{repository:{issue:{projectItems:{nodes:[{id:'Other',project:{id:'Q'}},{id:'I',project:{id:'P'}}]}}}}}
else if (key === 'api graphql') out = {data:{node:{fieldValues:{nodes:s.mismatch === 'fields' ? [] : Object.entries(s.fields).map(([key,name]) => ({name:name === 'B' ? 'Backlog':name,field:{name:key === 'S' ? 'Status':'Priority'}}))}}}}
else if (a[0] === 'api') {
 const endpoint = a.find(x => x.startsWith('repos/'))
 const parts = endpoint.split('?')[0].split('/')
 if (a.includes('POST')) {
  const id = Number(value('-F').split('=').at(-1)) - 1000
  if (endpoint.endsWith('/sub_issues')) s.issues[id].parent = {number:Number(parts[4])}
  else s.issues[parts[4]].blockedBy.nodes.push({number:id})
 } else if (endpoint.includes('?')) out = Object.values(s.issues).sort((x, y) => y.number - x.number).map(i => ({number:i.number,title:i.title,html_url:i.url}))
 else out = {id:1000 + Number(parts.at(-1))}
} else fail('unsupported call')
save()
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

const parentTicket = [
  '## What to build',
  'Log workouts.',
  '## Ownership',
  '- Log a set: #43',
  '## Acceptance criteria',
  '- [ ] Every sub-issue is closed',
  ''
].join('\n');

type Issue = {
  title: string;
  body: string;
  parent: { number: number } | null;
  blockedBy: { nodes: { number: number }[] };
};
type State = {
  calls: string[][];
  creates: number;
  fields: Record<string, string>;
  issues: Record<string, Issue>;
};

// macOS scans each new executable on its first run, for about 300 ms, so the fake `gh` is
// written once per test file.
let bin: string | undefined;

function fakeBin() {
  if (!bin) {
    bin = mkdtempSync(join(tmpdir(), 'create-issue-bin-'));
    writeFileSync(join(bin, 'gh'), fake);
    chmodSync(join(bin, 'gh'), 0o755);
  }

  return bin;
}

afterAll(() => bin && rmSync(bin, { recursive: true, force: true }));

function harness() {
  const dir = mkdtempSync(join(tmpdir(), 'create-issue-'));
  dirs.push(dir);
  const gh = fakeBin();
  const statePath = join(dir, 'state.json');
  const bodyPath = join(dir, 'body.md');
  const body = `  Exact body\r\n\nUnicode: İ 🏋️\n${validTicket}`;
  writeFileSync(bodyPath, body);
  writeFileSync(
    statePath,
    JSON.stringify({
      calls: [],
      creates: 0,
      fields: {},
      issues: {},
      next: 42,
      seen: {}
    })
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
  const script = (args: string[]) =>
    spawnSync(process.execPath, args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${gh}${delimiter}${process.env.PATH}`,
        NODE_NO_WARNINGS: '1',
        FAKE_STATE: statePath
      }
    });
  const invoke = (extra: string[] = [], useDefaults = true) =>
    script([
      'scripts/create-issue.mjs',
      ...(useDefaults
        ? defaults.filter((_, i, all) => !extra.includes(all[i - (i % 2)]))
        : []),
      ...extra
    ]);

  return { dir, state, patch, script, invoke, body, bodyPath };
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
  assert.equal(h.state().issues[42].body, h.body);
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
  writeFileSync(h.bodyPath, parentTicket);
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

test('continues with the existing Project item when auto-add won the race', () => {
  const h = harness();
  h.patch({ alreadyInProject: true });
  const result = h.invoke();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(h.state().fields, { S: 'B', F: 'High' });
  assert.ok(
    h.state().calls.some(a => a[1] === 'graphql' && a.includes('number=42'))
  );
});

test('refuses an open same-title duplicate without creating and names its resume', () => {
  const h = harness();
  assert.equal(h.invoke().status, 0);
  h.patch({ calls: [] });
  const result = h.invoke();
  assert.equal(result.status, 1);
  const diagnostics = JSON.parse(result.stderr);
  assert.match(diagnostics.error, /#42 already has this title/);
  assert.equal(diagnostics.url, issueUrl);
  assert.match(diagnostics.resume, /--resume 42/);
  assert.equal(h.state().creates, 1);
  assert.equal(
    h.state().calls.some(a => a[1] === 'create'),
    false
  );
});

// scripts/publish-tickets.mjs: parent 42, then a, b, c in blocker order whatever the
// manifest order, so a = 43, b = 44, c = 45.
function manifestHarness() {
  const h = harness();
  const ticket = (what: string, out: string) =>
    validTicket.replace('Log a set.', what).replace('export (#55)', out);
  const files = {
    'parent.md': parentTicket.replace('#43', '{{a}}, {{b}} and {{c}}'),
    'a.md': ticket('First, before {{b}}.', 'follow-up ({{c}})'),
    'b.md': ticket('Second.', 'none'),
    'c.md': ticket('Third, after {{a}}.', 'none')
  };

  for (const [name, text] of Object.entries(files)) {
    writeFileSync(join(h.dir, name), text);
  }

  const entry = (key: string, extra: object = {}) => ({
    key,
    title: `Ticket ${key}`,
    body: `${key}.md`,
    category: 'enhancement',
    areas: ['tooling'],
    priority: 'High',
    ...extra
  });
  const manifestPath = join(h.dir, 'breakdown.json');
  writeFileSync(
    manifestPath,
    JSON.stringify({
      triageState: 'ready-for-agent',
      approvedBreakdown: true,
      parent: { ...entry('parent'), priority: undefined },
      tickets: [
        entry('c', { blockedBy: ['b'] }),
        entry('a'),
        entry('b', { blockedBy: ['a'] })
      ]
    })
  );
  const publish = () => h.script(['scripts/publish-tickets.mjs', manifestPath]);

  return { ...h, files, publish };
}

test('a manifest publishes parent and tickets in blocker order with native links and real numbers', () => {
  const h = manifestHarness();
  const result = h.publish();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    parent: 42,
    a: 43,
    b: 44,
    c: 45
  });
  const creates = h.state().calls.filter(a => a[1] === 'create');
  assert.deepEqual(
    creates.map(a => a[a.indexOf('--title') + 1]),
    ['Ticket parent', 'Ticket a', 'Ticket b', 'Ticket c']
  );
  const { issues } = h.state();
  assert.equal(issues[42].parent, null);

  for (const n of [43, 44, 45]) {
    assert.deepEqual(issues[n].parent, { number: 42 });
  }

  assert.deepEqual(issues[43].blockedBy.nodes, []);
  assert.deepEqual(issues[44].blockedBy.nodes, [{ number: 43 }]);
  assert.deepEqual(issues[45].blockedBy.nodes, [{ number: 44 }]);
  assert.equal(
    issues[42].body,
    h.files['parent.md'].replace('{{a}}, {{b}} and {{c}}', '#43, #44 and #45')
  );
  assert.equal(
    issues[43].body,
    h.files['a.md'].replace('{{b}}', '#44').replace('{{c}}', '#45')
  );
  assert.equal(issues[44].body, h.files['b.md']);
  assert.equal(issues[45].body, h.files['c.md'].replace('{{a}}', '#43'));
});

test('a rerun finishes a partially published manifest with one issue per key', () => {
  const h = manifestHarness();
  // The third issue (b) is created, then its Project step fails, as in #119.
  h.patch({ failAt: 'project item-add', failNth: 3 });
  const failed = h.publish();
  assert.equal(failed.status, 1);
  const diagnostics = JSON.parse(failed.stderr);
  assert.match(diagnostics.error, /^b: /);
  assert.deepEqual(diagnostics.unfinished, ['parent', 'a', 'b', 'c']);
  assert.match(diagnostics.rerun, /publish-tickets\.mjs/);
  h.patch({ failAt: null });
  const resumed = h.publish();
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal(h.state().creates, 4);
  assert.deepEqual(
    Object.values(h.state().issues).map(i => i.title),
    ['Ticket parent', 'Ticket a', 'Ticket b', 'Ticket c']
  );
  assert.deepEqual(h.state().issues[45].blockedBy.nodes, [{ number: 44 }]);
  assert.equal(h.state().issues[45].body.includes('#43'), true);
});

test('a manifest with a failing body makes no GitHub call', () => {
  const h = manifestHarness();
  writeFileSync(join(h.dir, 'b.md'), 'No sections\n');
  const result = h.publish();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /b: Missing section: ## Size/);
  assert.deepEqual(h.state().calls, []);
});
