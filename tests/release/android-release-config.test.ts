import { compileModsAsync } from 'expo/config-plugins';
import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const projectRoot = resolve(process.cwd());
const pluginPath = resolve(
  projectRoot,
  'plugins/with-android-release-signing.js'
);
const buildScriptPath = resolve(
  projectRoot,
  'scripts/build-android-release-single-arch.sh'
);
const verifyScriptPath = resolve(
  projectRoot,
  'scripts/verify-android-release.sh'
);

const signingEnvironmentVariables = [
  'LIFTLOG_ANDROID_KEYSTORE_PATH',
  'LIFTLOG_ANDROID_KEY_ALIAS',
  'LIFTLOG_ANDROID_STORE_PASSWORD',
  'LIFTLOG_ANDROID_KEY_PASSWORD'
] as const;
const appConfig = require(resolve(projectRoot, 'app.json')) as {
  expo: {
    version: string;
    android: { package: string; versionCode: number };
  };
};
const releaseConfig = require(
  resolve(projectRoot, 'config/android-release.json')
) as { certificateSha256: string };

async function runPlugin(projectDirectory: string): Promise<void> {
  const withAndroidReleaseSigning = require(pluginPath) as (
    config: Parameters<typeof compileModsAsync>[0]
  ) => Parameters<typeof compileModsAsync>[0];
  const config = withAndroidReleaseSigning({
    name: 'Liftlog',
    slug: 'liftlog'
  });

  await compileModsAsync(config, {
    projectRoot: projectDirectory,
    platforms: ['android']
  });
}

function createAndroidProject(): string {
  const projectDirectory = mkdtempSync(
    join(tmpdir(), 'liftlog-release-plugin-')
  );
  const appDirectory = join(projectDirectory, 'android', 'app');

  mkdirSync(appDirectory, { recursive: true });
  writeFileSync(
    join(appDirectory, 'build.gradle'),
    'android {\n    buildTypes {\n        release {\n            signingConfig signingConfigs.debug\n        }\n    }\n}\n'
  );

  return projectDirectory;
}

function writeExecutable(path: string, contents: string): void {
  writeFileSync(path, `#!/usr/bin/env bash\n${contents}`);
  chmodSync(path, 0o755);
}

test('source config declares a positive Android version code', () => {
  const versionCode = appConfig.expo.android.versionCode;

  assert.equal(Number.isInteger(versionCode), true);
  assert.equal((versionCode as number) > 0, true);
});

test('release signing plugin generates an idempotent secret-free Gradle contract', async () => {
  const projectDirectory = createAndroidProject();
  const secretSentinel = 'must-not-be-written-to-generated-files';
  const previousEnvironment = Object.fromEntries(
    signingEnvironmentVariables.map(name => [name, process.env[name]])
  );

  for (const name of signingEnvironmentVariables) {
    process.env[name] = secretSentinel;
  }

  try {
    await runPlugin(projectDirectory);
    await runPlugin(projectDirectory);

    const buildGradle = readFileSync(
      join(projectDirectory, 'android', 'app', 'build.gradle'),
      'utf8'
    );
    const signingGradle = readFileSync(
      join(
        projectDirectory,
        'android',
        'app',
        'liftlog-release-signing.gradle'
      ),
      'utf8'
    );

    assert.equal(
      buildGradle.match(/apply from: .*liftlog-release-signing\.gradle/g)
        ?.length,
      1
    );
    assert.match(signingGradle, /gradle\.taskGraph\.whenReady/);
    assert.match(
      signingGradle,
      /signingConfig = liftlogReleaseSigningConfigured/
    );
    assert.match(signingGradle, /throw new GradleException/);

    for (const name of signingEnvironmentVariables) {
      assert.match(signingGradle, new RegExp(name));
    }

    assert.doesNotMatch(buildGradle, new RegExp(secretSentinel));
    assert.doesNotMatch(signingGradle, new RegExp(secretSentinel));
  } finally {
    for (const name of signingEnvironmentVariables) {
      const previousValue = previousEnvironment[name];

      if (previousValue === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = previousValue;
      }
    }

    rmSync(projectDirectory, { recursive: true, force: true });
  }
});

test(
  'clean Expo SDK 54 prebuild generates release signing configuration',
  { timeout: 60_000 },
  () => {
    const projectDirectory = mkdtempSync(
      join(tmpdir(), 'liftlog-clean-prebuild-')
    );

    writeFileSync(
      join(projectDirectory, 'package.json'),
      JSON.stringify({
        name: 'liftlog-release-plugin-fixture',
        version: '1.0.0',
        private: true,
        dependencies: {
          expo: '~54.0.36',
          react: '19.1.0',
          'react-native': '0.81.5'
        }
      })
    );
    writeFileSync(
      join(projectDirectory, 'app.json'),
      JSON.stringify({
        expo: {
          name: 'Liftlog',
          slug: 'liftlog',
          version: appConfig.expo.version,
          android: {
            package: appConfig.expo.android.package,
            versionCode: appConfig.expo.android.versionCode
          },
          plugins: [pluginPath]
        }
      })
    );
    symlinkSync(
      resolve(projectRoot, 'node_modules'),
      join(projectDirectory, 'node_modules'),
      'dir'
    );

    const result = spawnSync(
      resolve(projectRoot, 'node_modules/.bin/expo'),
      ['prebuild', '--clean', '--platform', 'android', '--no-install'],
      {
        cwd: projectDirectory,
        env: { ...process.env, CI: 'true', EXPO_NO_GIT_STATUS: '1' },
        encoding: 'utf8'
      }
    );

    try {
      assert.equal(result.status, 0, result.stderr);
      assert.match(
        readFileSync(
          join(projectDirectory, 'android', 'app', 'build.gradle'),
          'utf8'
        ),
        /apply from: file\("liftlog-release-signing\.gradle"\)/
      );
      assert.match(
        readFileSync(
          join(
            projectDirectory,
            'android',
            'app',
            'liftlog-release-signing.gradle'
          ),
          'utf8'
        ),
        /gradle\.taskGraph\.whenReady/
      );
    } finally {
      rmSync(projectDirectory, { recursive: true, force: true });
    }
  }
);

test('release command does not invoke desktop UI in CI', () => {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), 'liftlog-headless-release-')
  );
  const binaryDirectory = join(temporaryDirectory, 'bin');
  const desktopUiMarker = join(temporaryDirectory, 'desktop-ui-called');
  const osascriptPath = join(binaryDirectory, 'osascript');
  const environment = { ...process.env };

  mkdirSync(binaryDirectory);
  writeFileSync(
    osascriptPath,
    `#!/usr/bin/env bash\ntouch '${desktopUiMarker}'\n`
  );
  chmodSync(osascriptPath, 0o755);

  delete environment.SENTRY_AUTH_TOKEN;

  for (const name of signingEnvironmentVariables) {
    delete environment[name];
  }

  const result = spawnSync(buildScriptPath, {
    cwd: projectRoot,
    env: {
      ...environment,
      CI: 'true',
      PATH: `${binaryDirectory}:${environment.PATH ?? ''}`
    },
    encoding: 'utf8'
  });

  try {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SENTRY_AUTH_TOKEN is not set/);
    assert.throws(() => readFileSync(desktopUiMarker));
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test('release command fails before prebuild without signing credentials', () => {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    SENTRY_AUTH_TOKEN: 'configured-for-test'
  };

  for (const name of signingEnvironmentVariables) {
    delete environment[name];
  }

  const result = spawnSync(buildScriptPath, {
    cwd: projectRoot,
    env: { ...environment, CI: 'true' },
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /LIFTLOG_ANDROID_KEYSTORE_PATH is not set/);
});

test('APK verifier accepts only the configured release identity', () => {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), 'liftlog-release-verifier-')
  );
  const apkPath = join(temporaryDirectory, 'app-release.apk');
  const aaptPath = join(temporaryDirectory, 'aapt');
  const apksignerPath = join(temporaryDirectory, 'apksigner');
  const unzipPath = join(temporaryDirectory, 'unzip');

  writeFileSync(apkPath, 'controlled test artifact');
  writeExecutable(
    aaptPath,
    `echo "package: name='${appConfig.expo.android.package}' versionCode='${appConfig.expo.android.versionCode}' versionName='${appConfig.expo.version}'"\n`
  );
  writeExecutable(
    apksignerPath,
    `echo 'Signer #1 certificate SHA-256 digest: ${releaseConfig.certificateSha256.replaceAll(':', '').toLowerCase()}'\n`
  );
  writeExecutable(unzipPath, "echo 'lib/arm64-v8a/libliftlog.so'\n");

  const validResult = spawnSync(verifyScriptPath, [apkPath], {
    cwd: projectRoot,
    env: {
      ...process.env,
      AAPT_BIN: aaptPath,
      APKSIGNER_BIN: apksignerPath,
      UNZIP_BIN: unzipPath
    },
    encoding: 'utf8'
  });

  writeExecutable(
    apksignerPath,
    "echo 'Signer #1 certificate SHA-256 digest: ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'\n"
  );

  const wrongSignerResult = spawnSync(verifyScriptPath, [apkPath], {
    cwd: projectRoot,
    env: {
      ...process.env,
      AAPT_BIN: aaptPath,
      APKSIGNER_BIN: apksignerPath,
      UNZIP_BIN: unzipPath
    },
    encoding: 'utf8'
  });

  try {
    assert.equal(validResult.status, 0, validResult.stderr);
    assert.match(validResult.stdout, /Verified production release APK/);
    assert.notEqual(wrongSignerResult.status, 0);
    assert.match(wrongSignerResult.stderr, /certificate SHA-256/);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
