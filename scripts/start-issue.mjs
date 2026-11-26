// Plain Node runs this script, so the @/ alias cannot resolve here.
// eslint-disable-next-line no-restricted-imports
import { run, setStatus } from './project-status.mjs';

// Starts work on an issue (docs/tickets.md "Selecting work"): reads the issue and its
// relations, refuses a closed issue or an open blocker, then sets the issue's LiftLog Project
// Status to In progress through project-status.mjs. Prints
// { issue, parent, subIssues, blockedBy, base } as JSON.
const gh = (...args) => JSON.parse(run('gh', args));

function refusal(issue) {
  if (issue.state !== 'OPEN') {
    return `#${issue.number} is ${issue.state.toLowerCase()}.`;
  }

  const open = issue.blockedBy.filter(blocker => blocker.state === 'OPEN');

  if (open.length) {
    return `#${issue.number} has open blockers: ${open.map(b => `#${b.number}`).join(', ')}.`;
  }
}

const ref = process.argv[2];

try {
  if (!ref) {
    throw new Error(
      'Usage: node scripts/start-issue.mjs <issue number or URL>'
    );
  }

  const raw = gh(
    'issue',
    'view',
    ref,
    '--json',
    'number,title,url,body,state,comments,parent,subIssues,blockedBy'
  );
  const relation = ({ number, state }) => ({ number, state });
  const issue = {
    ...raw,
    parent: raw.parent ? relation(raw.parent) : null,
    subIssues: (raw.subIssues?.nodes ?? []).map(relation),
    blockedBy: (raw.blockedBy?.nodes ?? []).map(relation)
  };
  const reason = refusal(issue);

  if (reason) {
    throw new Error(`Not starting: ${reason}`);
  }

  const base = run('git', ['rev-parse', 'HEAD']).trim();
  setStatus(issue.url, 'In progress');
  const { number, title, url, body } = issue;
  const comments = raw.comments.map(c => ({
    author: c.author?.login ?? null,
    createdAt: c.createdAt,
    body: c.body
  }));
  process.stdout.write(
    `${JSON.stringify(
      {
        issue: { number, title, url, body, comments },
        parent: issue.parent,
        subIssues: issue.subIssues,
        blockedBy: issue.blockedBy,
        base
      },
      null,
      2
    )}\n`
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
