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
import { delimiter, join, resolve } from 'node:path';

const script = resolve('scripts/finish-issue.mjs');
const directories: string[] = [];
const url = 'https://github.com/BraveHeart-tex/Liftlog/issues/42';
const commentUrl = `${url}#issuecomment-1`;
const pushed = 'abc1234';

// A fake `gh` first on PATH that keeps the issue in a state file: edits, comments and close
// change it, views read it back, and every call is logged. Project calls answer from fixed
// responses; item-edit stores the Status the next item-list reports.
const fakeGh = `#!/usr/bin/env node
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs')
const args = process.argv.slice(2)
const statePath = process.env.FAKE_GH_STATE
const state = JSON.parse(readFileSync(statePath, 'utf8'))
const flag = name => args[args.indexOf(name) + 1]
const out = value => process.stdout.write(typeof value === 'string' ? value : JSON.stringify(value))
const log = { args }
if (args.includes('--body-file')) log.body = readFileSync(flag('--body-file'), 'utf8')
appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(log) + '\\n')
const key = args.slice(0, 2).join(' ')
const save = () => writeFileSync(statePath, JSON.stringify(state))
if (key === 'issue view') {
  out({ number: 42, url: '${url}', ...state.issue })
} else if (key === 'issue edit') {
  state.issue.body = log.body
  save()
} else if (key === 'issue comment') {
  const attaches = args.filter((_, i) => args[i - 1] === '--attach')
  const links = state.dropAttachments ? [] : attaches.map((_, i) => '![a](https://github.com/user-attachments/assets/' + i + ')')
  state.issue.comments.push({ url: '${commentUrl}', body: [log.body, ...links].join('\\n') })
  save()
  out('${commentUrl}\\n')
} else if (key === 'issue close') {
  state.issue.state = 'CLOSED'
  state.issue.stateReason = 'COMPLETED'
  save()
} else if (key === 'project list') {
  out({ projects: [{ number: 4, title: 'LiftLog', id: 'PVT_liftlog' }] })
} else if (key === 'project field-list') {
  out({ fields: [{ id: 'F_status', name: 'Status', options: [{ id: 'O_progress', name: 'In progress' }, { id: 'O_done', name: 'Done' }] }] })
} else if (key === 'project item-list') {
  out({ items: [{ id: 'I_existing', status: state.status, content: { url: '${url}' } }] })
} else if (key === 'project item-edit') {
  state.status = flag('--single-select-option-id') === 'O_done' ? 'Done' : 'In progress'
  save()
} else {
  process.exit(1)
}
`;

// A fake `git`: fetch succeeds; a SHA is an ancestor of origin/main only when listed.
const fakeGit = `#!/usr/bin/env node
const args = process.argv.slice(2)
require('node:fs').appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify({ args: ['git', ...args] }) + '\\n')
if (args[0] === 'fetch') process.exit(0)
if (args[0] === 'merge-base') process.exit(process.env.FAKE_ON_MAIN.split(',').includes(args[2]) ? 0 : 1)
process.exit(1)
`;

const body = [
  '## What to build',
  '',
  'Log a set.\r',
  '- [ ] not a criterion',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] First - Evidence: a test',
  '- [x] Second - Evidence: done already',
  '- [ ] Third - Evidence: a device check',
  '',
  '## Notes',
  '',
  '- [ ] stays open',
  ''
].join('\n');

type Options = {
  state?: string;
  evidence?: string;
  attach?: string[];
  dropAttachments?: boolean;
};

function finish({
  state = 'OPEN',
  evidence = `Pushed ${pushed}.`,
  attach = [],
  dropAttachments = false
}: Options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'finish-issue-'));
  directories.push(dir);

  for (const [name, source] of [
    ['gh', fakeGh],
    ['git', fakeGit]
  ]) {
    writeFileSync(join(dir, name), source);
    chmodSync(join(dir, name), 0o755);
  }

  const log = join(dir, 'calls.log');
  writeFileSync(log, '');
  const statePath = join(dir, 'state.json');
  writeFileSync(
    statePath,
    JSON.stringify({
      issue: { state, stateReason: null, body, comments: [] },
      status: 'In progress',
      dropAttachments
    })
  );
  const evidenceFile = join(dir, 'evidence.md');
  writeFileSync(evidenceFile, evidence);
  const attachments = attach.map(name => {
    writeFileSync(join(dir, name), 'png');

    return join(dir, name);
  });
  const result = spawnSync(
    process.execPath,
    [
      script,
      '42',
      '--evidence',
      evidenceFile,
      ...attachments.flatMap(file => ['--attach', file])
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${dir}${delimiter}${process.env.PATH}`,
        FAKE_GH_LOG: log,
        FAKE_GH_STATE: statePath,
        FAKE_ON_MAIN: pushed
      }
    }
  );
  const calls = readFileSync(log, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as { args: string[]; body?: string });

  return {
    ...result,
    calls,
    final: JSON.parse(readFileSync(statePath, 'utf8')),
    evidenceFile,
    attachments
  };
}

// Calls that change the issue or the Project.
const writes = (calls: { args: string[] }[]) =>
  calls.filter(({ args }) =>
    [
      'issue edit',
      'issue comment',
      'issue close',
      'project item-edit'
    ].includes(args.slice(0, 2).join(' '))
  );

afterEach(() =>
  directories.splice(0).forEach(dir => rmSync(dir, { recursive: true }))
);

test('ticks every criterion box and leaves the rest of the body byte-identical', () => {
  const { status, calls } = finish();
  assert.equal(status, 0);
  const edit = calls.find(({ args }) => args[1] === 'edit');
  assert.equal(
    edit?.body,
    body
      .replace('- [ ] First', '- [x] First')
      .replace('- [ ] Third', '- [x] Third')
  );
});

test('posts the evidence with attachments, closes and sets Done, reading each back', () => {
  const { status, calls, final, evidenceFile, attachments, stdout } = finish({
    attach: ['before.png', 'after.png']
  });
  assert.equal(status, 0);
  const sequence = calls.map(
    ({ args }) =>
      args.slice(0, 2).join(' ') +
      (args[0] === 'issue' && args[1] === 'view' ? ` ${args.at(-1)}` : '')
  );
  assert.deepEqual(sequence, [
    'issue view number,url,state,body',
    'git fetch',
    'git merge-base',
    'issue edit',
    'issue view body',
    'issue comment',
    'issue view comments',
    'issue close',
    'issue view state,stateReason',
    'project list',
    'project field-list',
    'project item-list',
    'project item-edit',
    'project list',
    'project item-list'
  ]);
  const comment = calls.find(({ args }) => args[1] === 'comment')!;
  assert.deepEqual(comment.args, [
    ...['issue', 'comment', '42', '--body-file', evidenceFile],
    ...['--attach', attachments[0], '--attach', attachments[1]]
  ]);
  assert.equal(comment.body, `Pushed ${pushed}.`);
  assert.deepEqual(writes(calls).at(-1)?.args, [
    ...[
      'project',
      'item-edit',
      '--id',
      'I_existing',
      '--project-id',
      'PVT_liftlog'
    ],
    ...['--field-id', 'F_status', '--single-select-option-id', 'O_done']
  ]);
  assert.equal(final.issue.state, 'CLOSED');
  assert.equal(final.status, 'Done');
  assert.deepEqual(JSON.parse(stdout), {
    issue: url,
    commit: pushed,
    criteria: 3,
    comment: commentUrl,
    uploads: [
      'https://github.com/user-attachments/assets/0',
      'https://github.com/user-attachments/assets/1'
    ],
    status: 'Done'
  });
});

test('stops before closing when the comment read-back lacks an uploaded link', () => {
  const { status, stderr, calls } = finish({
    attach: ['after.png'],
    dropAttachments: true
  });
  assert.notEqual(status, 0);
  assert.match(stderr, /1 attachments but 0 uploaded links/);
  assert.equal(
    calls.some(({ args }) => args[1] === 'close'),
    false
  );
});

test('refuses a closed issue, writing nothing', () => {
  const { status, stderr, calls } = finish({ state: 'CLOSED' });
  assert.notEqual(status, 0);
  assert.match(stderr, /#42 is closed/);
  assert.deepEqual(writes(calls), []);
});

test('refuses an evidence file citing no commit on origin/main, writing nothing', () => {
  const { status, stderr, calls } = finish({
    evidence: 'Local only: def5678.'
  });
  assert.notEqual(status, 0);
  assert.match(stderr, /cites no commit on origin\/main/);
  assert.ok(
    calls.some(({ args }) => args.join(' ') === 'git fetch origin main')
  );
  assert.deepEqual(writes(calls), []);
});
