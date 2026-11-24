import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { compile } from 'tailwindcss';

// Android cannot resolve a font weight against per-face runtime fonts, so a
// weight anywhere but the Text weight prop renders in the system font.

const require = createRequire(import.meta.url);
const projectRoot = resolve(process.cwd());

const textSizeUtilities = [
  'text-h1',
  'text-h2',
  'text-h3',
  'text-body',
  'text-body-medium',
  'text-small',
  'text-caption'
];

const weightNames = [
  'thin',
  'extralight',
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
  'extrabold',
  'black'
];

const weightUtilityPattern = new RegExp(
  `(?:^|[\\s'"\`:])font-(?:${weightNames.join('|')}|\\[\\d+\\])(?=$|[\\s'"\`])`
);

function resolveFrom(id: string, base: string) {
  return id.startsWith('.')
    ? resolve(base, id)
    : require.resolve(id, { paths: [base] });
}

async function buildUtilities(candidates: string[]) {
  const compiler = await compile(
    readFileSync(join(projectRoot, 'global.css'), 'utf8'),
    {
      base: projectRoot,
      loadModule: async (id, base) => {
        const path = resolveFrom(id, base);
        const module = (await import(pathToFileURL(path).href)) as {
          default: unknown;
        };

        return { path, base: dirname(path), module: module.default as never };
      },
      loadStylesheet: async (id, base) => {
        const path = resolveFrom(id, base);

        return {
          path,
          base: dirname(path),
          content: readFileSync(path, 'utf8')
        };
      }
    }
  );

  return compiler.build(candidates);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function utilityRule(css: string, utility: string) {
  return new RegExp(`\\.${utility}\\s*\\{[^}]*\\}`).exec(css)?.[0];
}

test('text size utilities emit no font weight', async () => {
  const css = await buildUtilities(textSizeUtilities);

  for (const utility of textSizeUtilities) {
    const rule = utilityRule(css, utility);
    assert.ok(rule, `${utility} is generated`);
    assert.doesNotMatch(rule, /font-weight/, utility);
  }
});

test('weight utilities are not generated', async () => {
  const utilities = weightNames.map(name => `font-${name}`);
  const css = await buildUtilities(utilities);

  for (const utility of utilities) {
    assert.equal(utilityRule(css, utility), undefined, utility);
  }
});

test('no source file uses a weight utility class', () => {
  const offenders = sourceFiles(join(projectRoot, 'src')).flatMap(file =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, index) =>
        weightUtilityPattern.test(line) ? [`${file}:${index + 1}`] : []
      )
  );
  assert.deepEqual(offenders, []);
});
