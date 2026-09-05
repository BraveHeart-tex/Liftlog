#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const appConfig = JSON.parse(
  readFileSync(join(projectRoot, 'app.json'), 'utf8')
);
const androidConfig = appConfig?.expo?.android ?? {};

function fail(message) {
  console.error(`Release preparation failed: ${message}`);
  process.exit(1);
}

function usage() {
  console.error(`Usage:
  node scripts/prepare-android-release.mjs --apk <path> [options]

Options:
  --apk <path>                 Finished signed APK (required)
  --output-dir <path>          Output directory (default: dist/android-release)
  --release-notes-file <path> Markdown/text release notes
  --release-notes <text>       Release notes supplied directly
  --mandatory                  Include mandatory: true in update.json (not enforced by the app)
  --help                       Show this help

Signing validation uses the same environment variables as the release build:
  LIFTLOG_ANDROID_KEYSTORE_PATH
  LIFTLOG_ANDROID_KEY_ALIAS
  LIFTLOG_ANDROID_STORE_PASSWORD
  LIFTLOG_ANDROID_KEY_PASSWORD`);
}

function parseArguments(argv) {
  const options = {
    outputDir: join(projectRoot, 'dist/android-release'),
    mandatory: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help') {
      usage();
      process.exit(0);
    }

    if (argument === '--mandatory') {
      options.mandatory = true;
      continue;
    }

    if (
      ![
        '--apk',
        '--output-dir',
        '--release-notes-file',
        '--release-notes'
      ].includes(argument)
    ) {
      usage();
      fail(`unknown argument: ${argument}`);
    }

    const value = argv[index + 1];

    if (!value || value.startsWith('--')) {
      fail(`${argument} requires a value`);
    }

    if (argument === '--apk') {
      options.apkPath = value;
    }

    if (argument === '--output-dir') {
      options.outputDir = resolve(projectRoot, value);
    }

    if (argument === '--release-notes-file') {
      options.releaseNotesFile = resolve(projectRoot, value);
    }

    if (argument === '--release-notes') {
      options.releaseNotes = value;
    }

    index += 1;
  }

  if (!options.apkPath) {
    usage();
    fail('--apk is required');
  }

  if (options.releaseNotesFile && options.releaseNotes !== undefined) {
    fail('use either --release-notes-file or --release-notes, not both');
  }

  options.apkPath = resolve(projectRoot, options.apkPath);

  return options;
}

function run(command, args, description, { input } = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    input,
    maxBuffer: 1024 * 1024
  });

  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr.trim();
    fail(`${description}${detail ? `: ${detail}` : ''}`);
  }

  return result.stdout;
}

function findTool(name, candidates) {
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  const lookup = spawnSync('command', ['-v', name], {
    cwd: projectRoot,
    encoding: 'utf8'
  });

  if (lookup.status === 0 && lookup.stdout.trim()) {
    return lookup.stdout.trim();
  }

  fail(
    `could not find ${name}; install Android SDK build tools and ensure ANDROID_HOME or ANDROID_SDK_ROOT is set`
  );
}

function findAndroidTool(name) {
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const buildToolsRoot = sdkRoot ? join(sdkRoot, 'build-tools') : null;
  const buildToolVersions = [];

  if (buildToolsRoot && existsSync(buildToolsRoot)) {
    const versions = readdirSync(buildToolsRoot)
      .sort()
      .reverse()
      .map(version => join(buildToolsRoot, version));
    buildToolVersions.push(...versions);
  }

  return findTool(name, [
    ...buildToolVersions.map(version => join(version, name)),
    process.env[`LIFTLOG_${name.toUpperCase()}_PATH`]
  ]);
}

function normalizeDigest(value) {
  return value.toLowerCase().replace(/[^a-f0-9]/g, '');
}

function readApkMetadata(apkPath, aapt2Path) {
  const output = run(
    aapt2Path,
    ['dump', 'badging', apkPath],
    'aapt2 could not inspect the APK'
  );
  const packageMatch = output.match(
    /package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/
  );

  if (!packageMatch) {
    fail('aapt2 did not return package, versionCode, and versionName');
  }

  const [, packageName, rawVersionCode, versionName] = packageMatch;
  const versionCode = Number(rawVersionCode);

  if (!Number.isSafeInteger(versionCode) || versionCode < 1) {
    fail(`APK versionCode is invalid: ${rawVersionCode}`);
  }

  return { packageName, versionCode, versionName };
}

function validateArm64(apkPath) {
  const entries = run(
    'unzip',
    ['-Z1', apkPath],
    'unzip could not inspect the APK'
  )
    .split('\n')
    .filter(Boolean);
  const nativeLibraries = entries.filter(entry => entry.startsWith('lib/'));

  if (!nativeLibraries.some(entry => entry.startsWith('lib/arm64-v8a/'))) {
    fail('APK does not contain an arm64-v8a native library');
  }

  const unsupportedAbi = nativeLibraries.find(
    entry => !entry.startsWith('lib/arm64-v8a/')
  );

  if (unsupportedAbi) {
    fail(`APK contains a non-ARM64 native library: ${unsupportedAbi}`);
  }
}

function validateCertificate(apkPath, apksignerPath) {
  const output = run(
    apksignerPath,
    ['verify', '--verbose', '--print-certs', apkPath],
    'apksigner rejected the APK'
  );
  const digestMatch = output.match(
    /certificate SHA-256 digest:\s*([a-f0-9: ]+)/i
  );

  if (!digestMatch) {
    fail('apksigner did not return a SHA-256 signing certificate digest');
  }

  const apkDigest = normalizeDigest(digestMatch[1]);
  const keystorePath = process.env.LIFTLOG_ANDROID_KEYSTORE_PATH;
  const keyAlias = process.env.LIFTLOG_ANDROID_KEY_ALIAS;
  const storePassword = process.env.LIFTLOG_ANDROID_STORE_PASSWORD;
  const keyPassword = process.env.LIFTLOG_ANDROID_KEY_PASSWORD;

  for (const [name, value] of Object.entries({
    LIFTLOG_ANDROID_KEYSTORE_PATH: keystorePath,
    LIFTLOG_ANDROID_KEY_ALIAS: keyAlias,
    LIFTLOG_ANDROID_STORE_PASSWORD: storePassword,
    LIFTLOG_ANDROID_KEY_PASSWORD: keyPassword
  })) {
    if (!value) {
      fail(
        `${name} is not set; refusing to publish an APK without signing validation`
      );
    }
  }

  if (!existsSync(keystorePath)) {
    fail(`Android release keystore does not exist at ${keystorePath}`);
  }

  const keytoolOutput = run(
    'keytool',
    [
      '-J-Duser.language=en',
      '-list',
      '-v',
      '-keystore',
      keystorePath,
      '-alias',
      keyAlias,
      '-storepass',
      storePassword,
      '-keypass',
      keyPassword
    ],
    'keytool could not inspect the configured release certificate'
  );
  const keytoolDigestMatch = keytoolOutput.match(/SHA256:\s*([a-f0-9: ]+)/i);

  if (!keytoolDigestMatch) {
    fail('keytool did not return a SHA-256 certificate fingerprint');
  }

  const keystoreDigest = normalizeDigest(keytoolDigestMatch[1]);

  if (apkDigest !== keystoreDigest) {
    fail(
      `APK certificate ${apkDigest} does not match the configured release keystore certificate ${keystoreDigest}`
    );
  }

  return keystoreDigest;
}

const options = parseArguments(process.argv.slice(2));

if (!existsSync(options.apkPath)) {
  fail(`APK does not exist: ${options.apkPath}`);
}

const aapt2Path = findAndroidTool('aapt2');
const apksignerPath = findAndroidTool('apksigner');
const metadata = readApkMetadata(options.apkPath, aapt2Path);
const expectedPackage = androidConfig.package;
const expectedVersionName = appConfig?.expo?.version;
const expectedVersionCode = androidConfig.versionCode;

if (metadata.packageName !== expectedPackage) {
  fail(
    `APK package ${metadata.packageName} does not match app.json package ${expectedPackage}`
  );
}

if (metadata.versionName !== expectedVersionName) {
  fail(
    `APK versionName ${metadata.versionName} does not match app.json version ${expectedVersionName}`
  );
}

if (metadata.versionCode <= expectedVersionCode) {
  fail(
    `APK versionCode ${metadata.versionCode} must be higher than app.json versionCode ${expectedVersionCode}`
  );
}

if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(metadata.versionName)) {
  fail(
    `APK versionName ${metadata.versionName} cannot be used in a release filename`
  );
}

validateArm64(options.apkPath);
const certificateSha256 = validateCertificate(options.apkPath, apksignerPath);
const apkBytes = readFileSync(options.apkPath);
const apkFilename = `liftlog-${metadata.versionName}-arm64-v8a.apk`;
const releaseNotes = options.releaseNotesFile
  ? readFileSync(options.releaseNotesFile, 'utf8').trim()
  : (options.releaseNotes ?? '').trim();
const manifest = {
  versionName: metadata.versionName,
  versionCode: metadata.versionCode,
  apkFilename,
  sha256: createHash('sha256').update(apkBytes).digest('hex'),
  sizeBytes: apkBytes.byteLength,
  releaseNotes,
  ...(options.mandatory ? { mandatory: true } : {})
};

mkdirSync(options.outputDir, { recursive: true });
const outputApkPath = join(options.outputDir, apkFilename);
const outputManifestPath = join(options.outputDir, 'update.json');

if (resolve(options.apkPath) !== resolve(outputApkPath)) {
  copyFileSync(options.apkPath, outputApkPath);
} else if (!existsSync(outputApkPath)) {
  fail('output APK path unexpectedly does not exist');
}

const manifestJson = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(outputManifestPath, manifestJson, 'utf8');

const output = [
  `Prepared Android release assets in ${options.outputDir}`,
  `APK: ${apkFilename}`,
  `versionName: ${metadata.versionName}`,
  `versionCode: ${metadata.versionCode}`,
  `sizeBytes: ${manifest.sizeBytes}`,
  `sha256: ${manifest.sha256}`,
  `certificateSha256: ${certificateSha256}`
];
process.stdout.write(`${output.join('\n')}\n`);
