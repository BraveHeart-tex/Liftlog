import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Checks a ticket body against docs/tickets.md (template, criteria, size), or a parent
// body against its parent template. Returns problems as plain sentences; an empty list
// passes. Prose rules lose to an author's pull toward completeness, so the size limits
// are enforced here.
export const sizeLimits = {
  Migrations: 1,
  'New screens': 3,
  'Native modules': 1,
  Proofs: 6
};
const required = ['What to build', 'Ownership', 'Size', 'Acceptance criteria'];
const optional = ['Rules', 'Current state'];
const maxCriteria = 8;
const doneDefinition =
  /validation checks? pass|tsc --noEmit|prettier --check|pnpm run test passes|push(ed)? to main|evidence comment|close (the|this) (issue|ticket)/i;

const parentRequired = ['What to build', 'Ownership', 'Acceptance criteria'];
const parentOptional = ['Rules', 'Current state', 'Breakdown'];
const subIssuesClosed = /\b(every|all) sub-issues? (is|are) closed\b/i;

function readSections(body, problems) {
  const sections = new Map();
  let current = null;

  for (const line of body.replace(/\r\n/g, '\n').split('\n')) {
    const heading = /^## (.+?)\s*$/.exec(line);

    if (heading) {
      current = heading[1];

      if (sections.has(current)) {
        problems.push(`Duplicate section: ${current}`);
      }

      sections.set(current, []);
    } else {
      sections.get(current)?.push(line);
    }
  }

  return sections;
}

function checkSections(sections, problems, required, optional) {
  for (const name of required) {
    if (!sections.has(name)) {
      problems.push(`Missing section: ## ${name}`);
    }
  }

  for (const name of sections.keys()) {
    if (!required.includes(name) && !optional.includes(name)) {
      problems.push(`Unknown section: ## ${name}`);
    }
  }
}

const criteriaOf = sections =>
  (sections.get('Acceptance criteria') ?? []).filter(l =>
    /^- \[[ x]\] /.test(l)
  );

// docs/tickets.md#parents: no Size, and one criterion: every sub-issue is closed.
export function lintParent(body) {
  const problems = [];
  const sections = readSections(body, problems);
  checkSections(sections, problems, parentRequired, [
    ...parentOptional,
    'Size'
  ]);

  if (sections.has('Size')) {
    problems.push('A parent has no ## Size');
  }

  const criteria = criteriaOf(sections);

  if (sections.has('Acceptance criteria') && criteria.length !== 1) {
    problems.push(
      `A parent has exactly one criterion; found ${criteria.length}`
    );
  } else if (criteria.length === 1 && !subIssuesClosed.test(criteria[0])) {
    problems.push('The parent criterion states that every sub-issue is closed');
  }

  return problems;
}

export function lintTicket(body) {
  const problems = [];
  const sections = readSections(body, problems);
  checkSections(sections, problems, required, optional);

  const what = (sections.get('What to build') ?? [])
    .join(' ')
    .split(/\s+/)
    .filter(Boolean);

  if (what.length > 150) {
    problems.push(`What to build has ${what.length} words; the limit is 150`);
  }

  const ownership = sections.get('Ownership');

  if (ownership) {
    if (!ownership.some(l => /^- Owns: \S/.test(l))) {
      problems.push('Ownership needs "- Owns:"');
    }

    const out = ownership.find(l => /^- Out of scope:/.test(l));

    if (!out) {
      problems.push('Ownership needs "- Out of scope:"');
    } else if (!/#\d+|: none\s*$/i.test(out)) {
      problems.push(
        'Out of scope names the issue that owns each item, or reads "none"'
      );
    }
  }

  const sizeText = (sections.get('Size') ?? []).join(' ');

  if (sections.has('Size')) {
    const counts = {};

    for (const name of Object.keys(sizeLimits)) {
      const match = new RegExp(`${name} (\\d+)`).exec(sizeText);

      if (!match) {
        problems.push(`Size line needs "${name} <n>"`);
      } else {
        counts[name] = Number(match[1]);
      }
    }

    for (const [name, limit] of Object.entries(sizeLimits)) {
      if (counts[name] > limit) {
        problems.push(
          `${name} ${counts[name]} passes its limit ${limit}: split`
        );
      }
    }

    if (counts.Migrations > 0 && counts['New screens'] > 0) {
      problems.push(
        'A ticket with a migration adds no screens: split data from screens'
      );
    }
  }

  const criteria = criteriaOf(sections);

  if (sections.has('Acceptance criteria') && !criteria.length) {
    problems.push('Acceptance criteria need at least one "- [ ]" line');
  }

  if (criteria.length > maxCriteria) {
    problems.push(
      `${criteria.length} criteria pass ${maxCriteria}: the ticket holds two slices`
    );
  }

  criteria.forEach((line, index) => {
    const n = index + 1;
    const parts = line.split(' - Evidence: ');

    if (parts.length !== 2 || !parts[1].trim()) {
      problems.push(`Criterion ${n} needs exactly one " - Evidence: <proof>"`);
    }

    if (parts[0].includes(';')) {
      problems.push(`Criterion ${n} joins outcomes with ";": split it`);
    }

    if (doneDefinition.test(line)) {
      problems.push(
        `Criterion ${n} restates the done definition (checks, push, evidence, close)`
      );
    }
  });

  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const parent = process.argv[2] === '--parent';
  const file = process.argv[parent ? 3 : 2];

  if (!file) {
    console.error('Usage: node scripts/ticket-lint.mjs [--parent] <body-file>');
    process.exit(1);
  }

  const problems = (parent ? lintParent : lintTicket)(
    readFileSync(file, 'utf8')
  );

  for (const problem of problems) {
    console.error(problem);
  }

  process.exit(problems.length ? 1 : 0);
}
