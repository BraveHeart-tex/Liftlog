import {
  createUpdateCoordinator,
  type UpdatePersistence
} from '@/src/features/app-updates/update-coordinator';
import type {
  GitHubRelease,
  UpdateCache
} from '@/src/features/app-updates/update.types';
import assert from 'node:assert/strict';
import test from 'node:test';

const APK_NAME = 'liftlog-1.1.0-arm64-v8a.apk';
const MANIFEST = {
  schemaVersion: 1,
  versionName: '1.1.0',
  versionCode: 5,
  apkFilename: APK_NAME,
  sha256: 'a'.repeat(64),
  sizeBytes: 12_345,
  futureField: true
};

function release(overrides: Partial<GitHubRelease> = {}): GitHubRelease {
  return {
    id: 65,
    tag_name: 'v1.1.0',
    draft: false,
    prerelease: false,
    body: 'Faster logging',
    assets: [
      { id: 1, name: 'update.json', size: 200, url: 'manifest-api' },
      {
        id: 2,
        name: APK_NAME,
        size: 12_345,
        url: 'apk-api',
        browser_download_url: 'apk-download',
        digest: `sha256:${'a'.repeat(64)}`
      }
    ],
    ...overrides
  };
}

function persistence(initial?: UpdateCache): UpdatePersistence & {
  value?: UpdateCache;
  writes: number;
} {
  return {
    value: initial,
    writes: 0,
    read() {
      return this.value;
    },
    write(value) {
      this.value = value;
      this.writes += 1;
    }
  };
}

test('manual discovery validates one stable same-release manifest and APK', async () => {
  const cache = persistence();
  const coordinator = createUpdateCoordinator({
    persistence: cache,
    installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
    now: () => 1_000,
    github: {
      getLatestRelease: async () => ({
        status: 200,
        etag: 'etag-1',
        release: release()
      }),
      getManifest: async () => MANIFEST
    }
  });

  const state = await coordinator.check('manual');

  assert.equal(state.status, 'available');
  assert.equal(state.release?.versionCode, 5);
  assert.equal(state.release?.apkDownloadUrl, 'apk-download');
  assert.equal(cache.value?.etag, 'etag-1');
  assert.equal(cache.value?.lastSuccessfulCheckAt, 1_000);
});

test('rejects unsupported schemas, manifest URLs, duplicate assets, and tag mismatches', async t => {
  const cases: [string, GitHubRelease, unknown][] = [
    ['unsupported schema', release(), { ...MANIFEST, schemaVersion: 2 }],
    [
      'manifest URL',
      release(),
      { ...MANIFEST, downloadUrl: 'https://evil.invalid/app.apk' }
    ],
    ['draft release', release({ draft: true }), MANIFEST],
    ['prerelease', release({ prerelease: true }), MANIFEST],
    ['missing manifest', release({ assets: [release().assets[1]] }), MANIFEST],
    [
      'duplicate manifest',
      release({ assets: [...release().assets, release().assets[0]] }),
      MANIFEST
    ],
    ['missing APK', release({ assets: [release().assets[0]] }), MANIFEST],
    ['malformed field', release(), { ...MANIFEST, sizeBytes: -1 }],
    [
      'size mismatch',
      release({
        assets: [release().assets[0], { ...release().assets[1], size: 1 }]
      }),
      MANIFEST
    ],
    [
      'digest mismatch',
      release({
        assets: [
          release().assets[0],
          { ...release().assets[1], digest: `sha256:${'b'.repeat(64)}` }
        ]
      }),
      MANIFEST
    ],
    [
      'duplicate asset',
      release({ assets: [...release().assets, release().assets[1]] }),
      MANIFEST
    ],
    ['tag mismatch', release({ tag_name: 'v1.2.0' }), MANIFEST]
  ];

  for (const [name, candidateRelease, manifest] of cases) {
    await t.test(name, async () => {
      const coordinator = createUpdateCoordinator({
        persistence: persistence(),
        installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
        now: () => 1_000,
        github: {
          getLatestRelease: async () => ({
            status: 200,
            release: candidateRelease
          }),
          getManifest: async () => manifest
        }
      });

      assert.equal(
        (await coordinator.check('manual')).error?.code,
        'malformed_release'
      );
    });
  }
});

test('native version code suppresses equal and older releases', async () => {
  const coordinator = createUpdateCoordinator({
    persistence: persistence(),
    installedBuild: () => ({ versionName: '9.0.0', versionCode: 5 }),
    now: () => 1_000,
    github: {
      getLatestRelease: async () => ({ status: 200, release: release() }),
      getManifest: async () => MANIFEST
    }
  });

  const state = await coordinator.check('manual');

  assert.equal(state.status, 'up_to_date');
  assert.equal(state.release, undefined);
});

test('additive fields including URL capability flags are tolerated', async () => {
  const coordinator = createUpdateCoordinator({
    persistence: persistence(),
    installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
    now: () => 1_000,
    github: {
      getLatestRelease: async () => ({ status: 200, release: release() }),
      getManifest: async () => ({
        ...MANIFEST,
        releaseNotesUrlSupported: false
      })
    }
  });

  assert.equal((await coordinator.check('manual')).status, 'available');
});

test('dismissed version is persisted without discarding discovery metadata', async () => {
  const cache = persistence({
    etag: 'etag-1',
    lastSuccessfulCheckAt: 1_000,
    release: undefined
  });
  const coordinator = createUpdateCoordinator({
    persistence: cache,
    installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
    now: () => 2_000,
    github: {
      getLatestRelease: async () => ({ status: 304 }),
      getManifest: async () => MANIFEST
    }
  });

  coordinator.dismiss(5);

  assert.equal(cache.value?.dismissedVersionCode, 5);
  assert.equal(cache.value?.etag, 'etag-1');
});

test('automatic checks throttle for 24 hours, while manual checks retain ETag caching', async () => {
  const cache = persistence({
    etag: 'etag-1',
    lastSuccessfulCheckAt: 10_000,
    release: undefined,
    dismissedVersionCode: undefined
  });
  const etags: (string | undefined)[] = [];
  const coordinator = createUpdateCoordinator({
    persistence: cache,
    installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
    now: () => 20_000,
    github: {
      getLatestRelease: async etag => {
        etags.push(etag);

        return { status: 304 };
      },
      getManifest: async () => MANIFEST
    }
  });

  assert.equal((await coordinator.check('automatic')).status, 'idle');
  assert.equal(etags.length, 0);
  assert.equal((await coordinator.check('manual')).status, 'up_to_date');
  assert.deepEqual(etags, ['etag-1']);
  assert.equal(cache.value?.lastSuccessfulCheckAt, 20_000);
});

test('clock rollback permits an automatic check and concurrent checks deduplicate', async () => {
  const cache = persistence({ lastSuccessfulCheckAt: 20_000 });
  let calls = 0;
  let resolveRelease!: (value: { status: 200; release: GitHubRelease }) => void;
  const pending = new Promise<{ status: 200; release: GitHubRelease }>(
    resolve => {
      resolveRelease = resolve;
    }
  );
  const coordinator = createUpdateCoordinator({
    persistence: cache,
    installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
    now: () => 10_000,
    github: {
      getLatestRelease: async () => {
        calls += 1;

        return pending;
      },
      getManifest: async () => MANIFEST
    }
  });

  const first = coordinator.check('automatic');
  const second = coordinator.check('manual');
  resolveRelease({ status: 200, release: release() });

  assert.strictEqual(first, second);
  assert.equal((await first).status, 'available');
  assert.equal(calls, 1);
});

test('rate limits and offline failures are actionable and never retried', async t => {
  for (const [name, error, code] of [
    ['rate limit', { status: 403, rateLimited: true }, 'rate_limited'],
    ['offline', new TypeError('Network request failed'), 'offline']
  ] as const) {
    await t.test(name, async () => {
      let calls = 0;
      const coordinator = createUpdateCoordinator({
        persistence: persistence(),
        installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
        now: () => 1_000,
        github: {
          getLatestRelease: async () => {
            calls += 1;

            if (error instanceof Error) {
              throw error;
            }

            return error;
          },
          getManifest: async () => MANIFEST
        }
      });

      assert.equal((await coordinator.check('manual')).error?.code, code);
      assert.equal(calls, 1);
    });
  }
});

test('cached freshness and available metadata survive a failed check', async () => {
  const coordinator = createUpdateCoordinator({
    persistence: persistence({
      lastSuccessfulCheckAt: 1_000,
      release: {
        releaseId: 65,
        versionName: '1.1.0',
        versionCode: 5,
        apkFilename: APK_NAME,
        apkDownloadUrl: 'apk-download',
        sha256: 'a'.repeat(64),
        sizeBytes: 12_345,
        releaseNotes: 'Faster logging'
      }
    }),
    installedBuild: () => ({ versionName: '1.0.3', versionCode: 4 }),
    now: () => 2_000,
    github: {
      getLatestRelease: async () => {
        throw new TypeError('Network request failed');
      },
      getManifest: async () => MANIFEST
    }
  });

  assert.equal(coordinator.currentState().lastSuccessfulCheckAt, 1_000);
  const failed = await coordinator.check('manual');

  assert.equal(failed.lastSuccessfulCheckAt, 1_000);
  assert.equal(failed.release?.versionCode, 5);
});
