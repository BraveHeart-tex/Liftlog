import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

// Catches a script whose `--selectProjects` takes the file path as a second project name, so
// the whole project runs instead of the named file.
test.each([
  ['test:tooling', 'tests/tooling/doc-links.test.ts'],
  ['test:native', 'tests/native/android-release-config.test.ts']
])('%s with a file path runs only that file', (script, file) => {
  const listed = execFileSync(
    'pnpm',
    ['--silent', 'run', script, file, '--listTests'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
  );

  // Jest prints the selected project before the listed paths.
  const paths = listed.split('\n').filter(line => line.startsWith('/'));

  expect(paths).toEqual([resolve(file)]);
});
