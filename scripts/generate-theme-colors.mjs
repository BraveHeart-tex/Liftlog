#!/usr/bin/env node
// Generates src/theme/colors.generated.ts from the --color-* tokens of the
// .theme-light and .theme-dark rules in global.css. --check exits 1 when the
// generated file is out of date.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(rootDir, 'global.css');
const outputPath = join(rootDir, 'src', 'theme', 'colors.generated.ts');
const schemes = ['light', 'dark'];

function toThemeKey(customProperty) {
  return customProperty
    .replace(/^--color-/, '')
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function readSchemeColors(root, scheme) {
  const colors = new Map();

  root.walkRules(`.theme-${scheme}`, rule => {
    rule.walkDecls(/^--color-/, decl => {
      colors.set(toThemeKey(decl.prop), decl.value);
    });
  });

  if (colors.size === 0) {
    throw new Error(`No --color-* tokens in .theme-${scheme} in ${cssPath}`);
  }

  return colors;
}

function render(colorsByScheme) {
  const keys = [...colorsByScheme.light.keys()];
  const mismatched = [
    ...keys.filter(key => !colorsByScheme.dark.has(key)),
    ...[...colorsByScheme.dark.keys()].filter(key => !keys.includes(key))
  ];

  if (mismatched.length > 0) {
    throw new Error(
      `Light and dark color tokens differ: ${mismatched.join(', ')}`
    );
  }

  const lines = [
    '// Generated from global.css by scripts/generate-theme-colors.mjs.',
    '// Do not edit; run pnpm run theme:generate.',
    '',
    'export const themeColors = {'
  ];

  schemes.forEach((scheme, index) => {
    lines.push(`  ${scheme}: {`);
    keys.forEach((key, keyIndex) => {
      const separator = keyIndex === keys.length - 1 ? '' : ',';
      lines.push(
        `    ${key}: '${colorsByScheme[scheme].get(key)}'${separator}`
      );
    });
    lines.push(index === schemes.length - 1 ? '  }' : '  },');
  });

  lines.push('} as const;', '');

  return lines.join('\n');
}

const root = postcss.parse(readFileSync(cssPath, 'utf8'), { from: cssPath });
const output = render(
  Object.fromEntries(
    schemes.map(scheme => [scheme, readSchemeColors(root, scheme)])
  )
);

if (process.argv.includes('--check')) {
  let current = '';

  try {
    current = readFileSync(outputPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (current !== output) {
    console.error(
      'src/theme/colors.generated.ts is out of date. Run pnpm run theme:generate.'
    );
    process.exit(1);
  }
} else {
  writeFileSync(outputPath, output);
}
