import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// Finds relative Markdown links whose file or heading anchor does not exist, across the
// tracked .md files. Agent docs and skills route by these links, so a broken anchor
// silently drops guidance. Anchors follow GitHub's heading slugs.
export function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_]|\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/ /g, '-');
}

function withoutCode(markdown) {
  return markdown
    .replace(/^(```|~~~)[\s\S]*?^\1/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

function anchors(markdown) {
  const seen = new Map();

  return new Set(
    [...withoutCode(markdown).matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)].map(
      ([, heading]) => {
        const slug = slugify(heading);
        const count = seen.get(slug) ?? 0;

        seen.set(slug, count + 1);

        return count ? `${slug}-${count}` : slug;
      }
    )
  );
}

export function findBrokenLinks(root, files) {
  const broken = [];

  for (const file of files) {
    const source = readFileSync(join(root, file), 'utf8');

    for (const [, target] of withoutCode(source).matchAll(
      /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
    )) {
      if (/^[a-z]+:/i.test(target)) {
        continue;
      }

      const [path, anchor] = target.split('#');
      const targetFile = path
        ? resolve(root, dirname(file), path)
        : join(root, file);

      if (!existsSync(targetFile)) {
        broken.push(`${file}: ${target} (no such file)`);
      } else if (
        anchor &&
        statSync(targetFile).isFile() &&
        targetFile.endsWith('.md') &&
        !anchors(readFileSync(targetFile, 'utf8')).has(anchor)
      ) {
        broken.push(`${file}: ${target} (no such heading)`);
      }
    }
  }

  return broken;
}

export function trackedMarkdown(root) {
  return execFileSync('git', ['ls-files', '*.md'], {
    cwd: root,
    encoding: 'utf8'
  })
    .split('\n')
    .filter(Boolean);
}
