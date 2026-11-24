import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// Plain Node runs this script, so the @/ alias cannot resolve here.
// eslint-disable-next-line no-restricted-imports
import { lintParent, lintTicket } from './ticket-lint.mjs';

// Publishes an approved breakdown from one manifest (docs/tickets.md#publishing-a-breakdown).
// Each issue goes through scripts/create-issue.mjs. Phase 1 creates the parent, then the
// tickets in blocker order, with every {{key}} drafted as #0 so a resume sees the same
// body. Phase 2 writes real numbers into each body. The state file next to the manifest
// records key to number, so a rerun resumes unfinished keys and never creates one twice.
const repo = 'BraveHeart-tex/Liftlog';
const createIssue = fileURLToPath(
  new URL('./create-issue.mjs', import.meta.url)
);
const placeholder = /\{\{([^{}]+)\}\}/g;
const manifestPath = process.argv[2];
const gh = (...args) =>
  execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
let keys = [];
let state = {};
let drafts;

try {
  if (!manifestPath || process.argv.length > 3) {
    throw new Error('Usage: node scripts/publish-tickets.mjs <manifest.json>');
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const dir = dirname(resolve(manifestPath));
  const statePath = `${manifestPath.replace(/\.json$/, '')}.state.json`;
  const { parent, tickets } = manifest;

  if (!parent || !Array.isArray(tickets) || !tickets.length) {
    throw new Error('Manifest needs a parent and at least one ticket');
  }

  const byKey = new Map();

  for (const entry of [parent, ...tickets]) {
    const isParent = entry === parent;

    for (const name of ['key', 'title', 'body', 'category']) {
      if (typeof entry[name] !== 'string' || !entry[name].trim()) {
        throw new Error(`Entry ${entry.key ?? '?'} needs ${name}`);
      }
    }

    if (!Array.isArray(entry.areas) || !entry.areas.length) {
      throw new Error(`Entry ${entry.key} needs areas`);
    }

    if (
      isParent
        ? entry.priority !== undefined || entry.blockedBy !== undefined
        : typeof entry.priority !== 'string'
    ) {
      throw new Error(
        `Entry ${entry.key}: tickets need priority; the parent has no priority or blockers`
      );
    }

    if (byKey.has(entry.key)) {
      throw new Error(`Duplicate key: ${entry.key}`);
    }

    byKey.set(entry.key, {
      ...entry,
      isParent,
      text: readFileSync(resolve(dir, entry.body), 'utf8')
    });
  }

  // Blockers before the tickets they block, otherwise manifest order.
  const order = [byKey.get(parent.key)];
  const visiting = new Set();
  const visit = key => {
    const ticket = byKey.get(key);

    if (!ticket || ticket.isParent) {
      throw new Error(`Unknown blocker key: ${key}`);
    }

    if (order.includes(ticket)) {
      return;
    }

    if (visiting.has(key)) {
      throw new Error(`Blocker cycle at ${key}`);
    }

    visiting.add(key);
    (ticket.blockedBy ?? []).forEach(visit);
    order.push(ticket);
  };

  tickets.forEach(t => visit(t.key));
  keys = order.map(t => t.key);

  const fill = (text, numbers) =>
    text.replace(placeholder, (_, key) => {
      if (!byKey.has(key)) {
        throw new Error(`Unknown placeholder {{${key}}}`);
      }

      return `#${numbers[key] ?? 0}`;
    });
  const problems = order.flatMap(t => {
    t.draft = fill(t.text, {});

    return (t.isParent ? lintParent : lintTicket)(t.draft).map(
      p => `${t.key}: ${p}`
    );
  });

  if (problems.length) {
    throw new Error(`Ticket bodies:\n- ${problems.join('\n- ')}`);
  }

  state = existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, 'utf8'))
    : {};
  const save = () =>
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  drafts = mkdtempSync(join(tmpdir(), 'publish-tickets-'));

  for (const ticket of order) {
    if (state[ticket.key]?.created) {
      continue;
    }

    const file = join(drafts, `${ticket.key}.md`);
    writeFileSync(file, ticket.draft);
    const known = state[ticket.key]?.number;
    const result = spawnSync(
      process.execPath,
      [
        createIssue,
        '--title',
        ticket.title,
        '--body-file',
        file,
        '--category',
        ticket.category,
        '--areas',
        ticket.areas.join(','),
        ...(manifest.triageState
          ? ['--triage-state', manifest.triageState]
          : []),
        ...(manifest.approvedBreakdown ? ['--approved-breakdown'] : []),
        ...(ticket.isParent
          ? ['--parent-ticket']
          : [
              '--priority',
              ticket.priority,
              '--parent',
              String(state[parent.key].number)
            ]),
        ...(ticket.blockedBy?.length
          ? [
              '--blocked-by',
              ticket.blockedBy.map(k => state[k].number).join(',')
            ]
          : []),
        ...(known ? ['--resume', String(known)] : [])
      ],
      { encoding: 'utf8' }
    );

    if (result.status !== 0) {
      const line = result.stderr.trim().split('\n').at(-1) ?? '';
      let diagnostics;

      try {
        diagnostics = JSON.parse(line);
      } catch {
        diagnostics = { error: result.stderr.trim() || String(result.error) };
      }

      // Record an issue that exists, so the rerun resumes it instead of creating it.
      if (diagnostics.url) {
        state[ticket.key] = {
          number: Number(diagnostics.url.split('/').at(-1)),
          created: false
        };
        save();
      }

      throw new Error(`${ticket.key}: ${diagnostics.error}`);
    }

    state[ticket.key] = {
      number: JSON.parse(result.stdout).number,
      created: true
    };
    save();
  }

  const numbers = Object.fromEntries(keys.map(k => [k, state[k].number]));

  for (const ticket of order) {
    if (state[ticket.key].final) {
      continue;
    }

    const body = fill(ticket.text, numbers);
    const number = String(numbers[ticket.key]);

    if (body !== ticket.draft) {
      const file = join(drafts, `${ticket.key}.final.md`);
      writeFileSync(file, body);
      gh('issue', 'edit', number, '--repo', repo, '--body-file', file);
    }

    const saved = JSON.parse(
      gh('issue', 'view', number, '--repo', repo, '--json', 'body')
    );

    if (saved.body !== body) {
      throw new Error(`${ticket.key}: read-back mismatch: body of #${number}`);
    }

    state[ticket.key].final = true;
    save();
  }

  process.stdout.write(`${JSON.stringify(numbers)}\n`);
} catch (error) {
  const unfinished = keys.filter(k => !state[k]?.final);
  console.error(
    JSON.stringify({
      error: String(error.stderr || error.message).trim(),
      ...(unfinished.length && Object.keys(state).length
        ? {
            unfinished,
            rerun: `Fix the cause, then rerun node scripts/publish-tickets.mjs ${manifestPath}`
          }
        : {})
    })
  );
  process.exitCode = 1;
} finally {
  if (drafts) {
    rmSync(drafts, { recursive: true, force: true });
  }
}
