#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const packagePath = resolve(projectRoot, 'package.json');
const appPath = resolve(projectRoot, 'app.json');
const bump = process.argv[2];
const supportedBumps = new Set(['patch', 'minor', 'major']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function command(name, args) {
  try {
    return execFileSync(name, args, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    fail(`${name} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}

function run(name, args) {
  const result = spawnSync(name, args, {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  if (result.error) {
    fail(`${name} ${args.join(' ')} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${name} ${args.join(' ')} exited with status ${result.status}`);
  }
}

function nextVersion(version, releaseType) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    fail(`version must be stable semantic version: ${version}`);
  }

  let [, major, minor, patch] = match.map(Number);

  if (releaseType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (releaseType === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

if (!supportedBumps.has(bump)) {
  fail('usage: pnpm release:prepare <patch|minor|major>');
}

if (command('git', ['branch', '--show-current']) !== 'main') {
  fail('release preparation must run on main');
}

if (command('git', ['status', '--porcelain'])) {
  fail('release preparation requires a clean worktree');
}

const remoteMainCheck = spawnSync(
  'git',
  ['merge-base', '--is-ancestor', 'refs/remotes/origin/main', 'HEAD'],
  { cwd: projectRoot }
);

if (remoteMainCheck.status !== 0) {
  fail('local main must contain origin/main; fetch or synchronize first');
}

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const appJson = JSON.parse(readFileSync(appPath, 'utf8'));

if (packageJson.version !== appJson.expo?.version) {
  fail('package.json and app.json versions must match');
}

if (!Number.isInteger(appJson.expo?.android?.versionCode)) {
  fail('app.json expo.android.versionCode must be an integer');
}

const version = nextVersion(packageJson.version, bump);
const tag = `v${version}`;

if (
  spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/tags/${tag}`], {
    cwd: projectRoot
  }).status === 0
) {
  fail(`tag ${tag} already exists`);
}

run('pnpm', ['run', 'ts-check']);
run('pnpm', ['test']);
run('pnpm', ['run', 'lint']);
run('pnpm', ['run', 'prettier:check']);

packageJson.version = version;
appJson.expo.version = version;
appJson.expo.android.versionCode += 1;

writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
writeFileSync(appPath, `${JSON.stringify(appJson, null, 2)}\n`);

run('pnpm', ['exec', 'prettier', '--write', 'package.json', 'app.json']);
run('pnpm', ['exec', 'prettier', '--check', 'package.json', 'app.json']);
run('git', ['add', 'package.json', 'app.json']);
run('git', ['commit', '-m', `chore: prepare Android ${version} release`]);
run('git', ['tag', tag]);

process.stdout.write(
  `Prepared ${version} (${appJson.expo.android.versionCode}) and tagged ${tag}.\n` +
    `Publish explicitly with: git push --atomic origin main ${tag}\n`
);
