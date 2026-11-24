import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  findBrokenLinks,
  slugify,
  trackedMarkdown
} from '@/scripts/doc-links.mjs';

// implement-issue linked AGENTS.md sections that had been renamed, so its sandbox and
// doc-routing pointers led nowhere.
test('every relative link in tracked Markdown reaches a file and heading', () => {
  const root = resolve(__dirname, '../..');

  assert.deepEqual(findBrokenLinks(root, trackedMarkdown(root)), []);
});

test('reports a missing heading and a missing file', () => {
  const root = mkdtempSync(join(tmpdir(), 'doc-links-'));

  writeFileSync(join(root, 'target.md'), '# Target\n\n## Done when\n');
  writeFileSync(
    join(root, 'source.md'),
    [
      '[ok](target.md#done-when)',
      '[self](#source)',
      '[gone](target.md#renamed)',
      '[missing](absent.md)',
      '`[code](absent.md)`',
      '# Source'
    ].join('\n')
  );

  assert.deepEqual(findBrokenLinks(root, ['source.md']), [
    'source.md: target.md#renamed (no such heading)',
    'source.md: absent.md (no such file)'
  ]);
});

test('slugs headings as GitHub does', () => {
  assert.equal(
    slugify('Agent-safe `EPERM` handling!'),
    'agent-safe-eperm-handling'
  );
  assert.equal(slugify('Size & limits'), 'size--limits');
});
