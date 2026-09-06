#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const app = JSON.parse(
  readFileSync(resolve(projectRoot, 'app.json'), 'utf8')
).expo;
const releaseConfig = JSON.parse(
  readFileSync(resolve(projectRoot, 'config/android-release.json'), 'utf8')
);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function command(name, args, options = {}) {
  try {
    return execFileSync(name, args, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    }).trim();
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    fail(`${name} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}

function assertConfig() {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(app.version)) {
    fail(`expo.version must be semantic: ${app.version}`);
  }

  if (
    !Number.isInteger(app.android?.versionCode) ||
    app.android.versionCode < 1
  ) {
    fail('expo.android.versionCode must be a positive integer');
  }

  if (app.android?.package !== 'com.borakaraca94.liftlog') {
    fail('expo.android.package must remain com.borakaraca94.liftlog');
  }
}

function assertTag() {
  const tag = process.env.GITHUB_REF_NAME ?? '';
  const expectedTag = `v${app.version}`;

  if (
    tag !== expectedTag ||
    !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)
  ) {
    fail(`tag ${tag || '(missing)'} must equal ${expectedTag}`);
  }

  const repository = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;

  if (!repository || !sha) {
    fail('GITHUB_REPOSITORY and GITHUB_SHA are required');
  }

  const mainSha = command('gh', [
    'api',
    `repos/${repository}/commits/main`,
    '--jq',
    '.sha'
  ]);

  if (mainSha !== sha) {
    fail('release tag commit is not the current commit on main');
  }
}

function publishedVersionCodes() {
  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository) {
    fail('GITHUB_REPOSITORY is required');
  }

  const output = command('gh', [
    'api',
    '--paginate',
    `repos/${repository}/releases?per_page=100`,
    '--jq',
    '.[] | select(.draft == false and .prerelease == false) | .assets[] | select(.name == "update.json") | [.url, .id] | @tsv'
  ]);

  if (!output) {
    return [];
  }

  return output.split('\n').map(line => {
    const [url, id] = line.split('\t');
    const manifest = JSON.parse(
      command('gh', ['api', url, '-H', 'Accept: application/octet-stream'])
    );

    if (
      manifest.schemaVersion !== 1 ||
      !Number.isInteger(manifest.versionCode)
    ) {
      fail(
        `published update.json asset ${id} is not a valid schema-v1 manifest`
      );
    }

    return manifest.versionCode;
  });
}

function preflight() {
  assertConfig();
  assertTag();
  const previousCodes = publishedVersionCodes();
  const highest = previousCodes.length ? Math.max(...previousCodes) : 0;

  if (app.android.versionCode <= highest) {
    fail(
      `versionCode ${app.android.versionCode} must exceed published maximum ${highest}`
    );
  }

  process.stdout.write(
    `Release preflight passed for ${app.version} (${app.android.versionCode})\n`
  );
}

function apkMetadata(apkPath) {
  const androidSdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  const buildTools = androidSdk ? `${androidSdk}/build-tools` : undefined;
  const aapt =
    process.env.AAPT_BIN ||
    (buildTools
      ? command('bash', [
          '-c',
          `find "${buildTools}" -type f -name aapt -print -quit`
        ])
      : 'aapt');
  const apksigner =
    process.env.APKSIGNER_BIN ||
    (buildTools
      ? command('bash', [
          '-c',
          `find "${buildTools}" -type f -name apksigner -print -quit`
        ])
      : 'apksigner');
  const unzip = process.env.UNZIP_BIN || 'unzip';
  const packageLine = command(aapt, ['dump', 'badging', apkPath])
    .split('\n')
    .find(line => line.startsWith('package: '));
  const packageMatch = packageLine?.match(
    /name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/
  );

  if (!packageMatch) {
    fail('could not derive package metadata from APK');
  }

  const abis = command(unzip, ['-Z1', apkPath])
    .split('\n')
    .map(item => item.match(/^lib\/([^/]+)\//)?.[1])
    .filter(Boolean);
  const uniqueAbis = [...new Set(abis)];
  const certificate = command(apksigner, ['verify', '--print-certs', apkPath])
    .split('\n')
    .find(line => line.startsWith('Signer #1 certificate SHA-256 digest:'))
    ?.replace('Signer #1 certificate SHA-256 digest:', '')
    .replaceAll(':', '')
    .trim()
    .toUpperCase();
  const sha256 = createHash('sha256')
    .update(readFileSync(apkPath))
    .digest('hex');
  const sizeBytes = statSync(apkPath).size;

  if (
    packageMatch[1] !== app.android.package ||
    packageMatch[2] !== String(app.android.versionCode) ||
    packageMatch[3] !== app.version
  ) {
    fail('APK metadata does not match app.json');
  }

  if (uniqueAbis.length !== 1 || uniqueAbis[0] !== 'arm64-v8a') {
    fail('APK must contain only arm64-v8a');
  }

  if (
    certificate !==
    releaseConfig.certificateSha256.replaceAll(':', '').toUpperCase()
  ) {
    fail('APK certificate does not match release config');
  }

  return {
    versionName: packageMatch[3],
    versionCode: Number(packageMatch[2]),
    apkFilename: basename(apkPath),
    sha256,
    sizeBytes
  };
}

function manifest() {
  const apkPath = process.argv[3];
  const outputPath = process.argv[4];

  if (!apkPath || !outputPath) {
    fail('usage: prepare-android-release.mjs manifest <apk> <update.json>');
  }

  const metadata = apkMetadata(apkPath);
  writeFileSync(
    outputPath,
    `${JSON.stringify({ schemaVersion: 1, ...metadata }, null, 2)}\n`
  );
  process.stdout.write(`Generated ${outputPath}\n`);
}

assertConfig();

if (process.argv[2] === 'preflight') {
  preflight();
} else if (process.argv[2] === 'manifest') {
  manifest();
} else {
  fail('usage: prepare-android-release.mjs <preflight|manifest>');
}
