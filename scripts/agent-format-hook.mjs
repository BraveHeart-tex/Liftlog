// PostToolUse hook for Claude Code (Edit|Write) and Codex (apply_patch): formats every file the
// tool wrote inside the project with ESLint layout fixes, then prettier. Layout fixes only, so a
// `problem` fix never removes an import the agent added but has not used yet. It fails open: a
// formatter error never blocks the agent.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PATCH_PATH = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/gm;
const LINTED = /\.(?:[cm]?js|jsx|tsx?)$/;

try {
  const payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const input = payload.tool_input ?? {};
  const base = payload.cwd ?? ROOT;
  const paths = new Set(
    [payload.tool_response?.filePath, input.file_path].filter(Boolean)
  );
  const patch = [input.command, input.patch, input.input]
    .filter(value => typeof value === 'string')
    .join('\n');

  for (const [, path] of patch.matchAll(PATCH_PATH)) {
    paths.add(path.trim());
  }

  const files = [...paths]
    .map(path => (isAbsolute(path) ? path : resolve(base, path)))
    .filter(path => {
      const inside = relative(ROOT, path);

      return (
        inside &&
        !inside.startsWith('..') &&
        !isAbsolute(inside) &&
        existsSync(path)
      );
    });

  const linted = files.filter(path => LINTED.test(path));

  if (linted.length > 0) {
    // Exits non-zero while unfixable errors remain; those are for validation to report.
    spawnSync(
      join(ROOT, 'node_modules', '.bin', 'eslint'),
      ['--fix', '--fix-type', 'layout', '--no-warn-ignored', ...linted],
      { cwd: ROOT, stdio: 'ignore' }
    );
  }

  if (files.length > 0) {
    execFileSync(
      join(ROOT, 'node_modules', '.bin', 'prettier'),
      ['--write', '--ignore-unknown', '--log-level', 'warn', ...files],
      { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] }
    );
  }
} catch {
  // Fail open.
}
