import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// eslint-disable-next-line no-restricted-imports
import {
  changedPaths,
  changes,
  git,
  validationRecord
} from './validation-state.mjs';

function ship() {
  const commit = git('rev-parse', 'HEAD');
  git('fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main');
  const base = git('rev-parse', 'refs/remotes/origin/main');

  if (git('merge-base', base, commit) !== base) {
    throw new Error('Rebase onto origin/main and run the ship command again.');
  }

  const record = validationRecord();
  const retry = `Run pnpm run validate:changed --base ${base} and retry shipping.`;

  if (!existsSync(record)) {
    throw new Error(retry);
  }

  const validated = JSON.parse(readFileSync(record, 'utf8'));

  if (git('merge-base', validated.base, base) !== validated.base) {
    throw new Error(retry);
  }

  const issuePaths = new Set([
    ...validated.paths,
    ...changedPaths(base, commit)
  ]);
  const overlaps = changedPaths(validated.base, base).filter(path =>
    issuePaths.has(path)
  );

  if (overlaps.length) {
    throw new Error(
      `Upstream changes overlap the issue files:\n${overlaps.map(path => JSON.stringify(path)).join('\n')}\n${retry}`
    );
  }

  if (changes(base, commit) !== validated.changes) {
    throw new Error(retry);
  }

  // The checked commit descends from base. The lease pins the upstream ref to
  // that base so a concurrent update must go through the guard again.
  execFileSync(
    'git',
    [
      'push',
      `--force-with-lease=refs/heads/main:${base}`,
      'origin',
      `${commit}:refs/heads/main`
    ],
    { stdio: 'inherit' }
  );
}

try {
  ship();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
