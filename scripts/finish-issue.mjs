import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Plain Node runs this script, so the @/ alias cannot resolve here.
// eslint-disable-next-line no-restricted-imports
import { readStatus, run, setStatus } from './project-status.mjs';

// Closes an issue (docs/tickets.md "Closing"), the counterpart to start-issue.mjs. Checks
// first and writes nothing on refusal: a closed issue, an issue with no criteria, a missing
// attachment, or an evidence file citing no commit on origin/main. Then ticks every
// criterion box, posts the evidence comment with its attachments, closes the issue as
// completed and sets its LiftLog Project Status to Done, reading each write back.
const USAGE =
  'Usage: node scripts/finish-issue.mjs <n> --evidence <file> [--attach <png>...]';
const UPLOAD = /https:\/\/github\.com\/user-attachments\/[^\s)"']+/g;

const gh = (...args) => JSON.parse(run('gh', args));

function parseArgs(argv) {
  const [ref, ...rest] = argv;
  const options = { ref, evidence: null, attach: [] };

  for (let i = 0; i < rest.length; i += 2) {
    const value = rest[i + 1];

    if (!value) {
      throw new Error(USAGE);
    }

    if (rest[i] === '--evidence') {
      options.evidence = value;
    } else if (rest[i] === '--attach') {
      options.attach.push(value);
    } else {
      throw new Error(USAGE);
    }
  }

  if (!ref || !options.evidence) {
    throw new Error(USAGE);
  }

  return options;
}

// Ticks every "- [ ]" box in the Acceptance criteria section; every other byte is kept.
function tickCriteria(body) {
  let inCriteria = false;
  let count = 0;
  const lines = body.split('\n').map(line => {
    if (/^## /.test(line)) {
      inCriteria = /^## Acceptance criteria\s*$/.test(line);
    } else if (inCriteria && /^- \[[ xX]\] /.test(line)) {
      count += 1;

      return line.replace(/^- \[ \]/, '- [x]');
    }

    return line;
  });

  return { body: lines.join('\n'), count };
}

function uncheckedCriteria(body) {
  const ticked = tickCriteria(body);

  return ticked.body !== body || !ticked.count;
}

const onMain = sha =>
  spawnSync('git', ['merge-base', '--is-ancestor', sha, 'origin/main'], {
    stdio: 'ignore'
  }).status === 0;

function finish({ ref, evidence, attach }) {
  const issue = gh('issue', 'view', ref, '--json', 'number,url,state,body');
  const ticked = tickCriteria(issue.body);

  if (issue.state !== 'OPEN') {
    throw new Error(`#${issue.number} is ${issue.state.toLowerCase()}.`);
  }

  if (!ticked.count) {
    throw new Error(`#${issue.number} has no acceptance criteria to tick.`);
  }

  const missing = [evidence, ...attach.map(a => a.split('#')[0])].filter(
    path => !existsSync(path)
  );

  if (missing.length) {
    throw new Error(`Missing files: ${missing.join(', ')}.`);
  }

  run('git', ['fetch', 'origin', 'main']);
  const cited = [
    ...new Set(readFileSync(evidence, 'utf8').match(/\b[0-9a-f]{7,40}\b/g))
  ];
  const pushed = cited.find(onMain);

  if (!pushed) {
    throw new Error(
      `${evidence} cites no commit on origin/main; push first and cite its SHA.`
    );
  }

  const number = String(issue.number);
  const dir = mkdtempSync(join(tmpdir(), 'finish-issue-'));

  try {
    const bodyFile = join(dir, 'body.md');
    writeFileSync(bodyFile, ticked.body);
    run('gh', ['issue', 'edit', number, '--body-file', bodyFile]);
  } finally {
    rmSync(dir, { recursive: true });
  }

  if (uncheckedCriteria(gh('issue', 'view', number, '--json', 'body').body)) {
    throw new Error(`Read-back: #${number} still has an unticked criterion.`);
  }

  const commentUrl = run('gh', [
    ...['issue', 'comment', number, '--body-file', evidence],
    ...attach.flatMap(file => ['--attach', file])
  ])
    .trim()
    .split('\n')
    .at(-1);
  const comment = gh(
    'issue',
    'view',
    number,
    '--json',
    'comments'
  ).comments.find(c => c.url === commentUrl);

  if (!comment) {
    throw new Error(`Read-back: evidence comment ${commentUrl} not found.`);
  }

  const uploads = comment.body.match(UPLOAD) ?? [];

  if (uploads.length < attach.length) {
    throw new Error(
      `Read-back: ${attach.length} attachments but ${uploads.length} uploaded links in ${commentUrl}.`
    );
  }

  run('gh', ['issue', 'close', number, '--reason', 'completed']);
  const closed = gh('issue', 'view', number, '--json', 'state,stateReason');

  if (closed.state !== 'CLOSED' || closed.stateReason !== 'COMPLETED') {
    throw new Error(`Read-back: #${number} is not closed as completed.`);
  }

  setStatus(issue.url, 'Done');
  const status = readStatus(issue.url);

  if (status !== 'Done') {
    throw new Error(`Read-back: #${number} Project Status is ${status}.`);
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        issue: issue.url,
        commit: pushed,
        criteria: ticked.count,
        comment: commentUrl,
        uploads,
        status
      },
      null,
      2
    )}\n`
  );
}

try {
  finish(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
