import { presentUpdateState } from '@/src/features/app-updates/update-presenter';
import assert from 'node:assert/strict';
import test from 'node:test';

test('presents no-update and actionable failure messages', () => {
  assert.equal(
    presentUpdateState({ status: 'up_to_date', installedVersion: '1.0.3' })
      .message,
    'LiftLog is up to date.'
  );
  assert.match(
    presentUpdateState({
      status: 'error',
      installedVersion: '1.0.3',
      error: { code: 'rate_limited' }
    }).message ?? '',
    /GitHub rate limit/
  );
  assert.match(
    presentUpdateState({
      status: 'error',
      installedVersion: '1.0.3',
      error: { code: 'offline' }
    }).message ?? '',
    /connection/
  );
});

test('caps remote notes and formats the APK size in MB', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      releaseId: 65,
      versionName: '1.1.0',
      versionCode: 5,
      apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
      apkDownloadUrl: 'url',
      sha256: 'a'.repeat(64),
      sizeBytes: 58_720_256,
      releaseNotes: 'x'.repeat(5_000)
    }
  });

  assert.equal(presentation.availableVersion, '1.1.0');
  assert.equal(presentation.size, '56 MB');
  assert.equal(presentation.releaseNotes?.length, 4_001);
  assert.ok(presentation.releaseNotes?.endsWith('\u2026'));
});

test('hides generated compare-only release notes', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      releaseId: 65,
      versionName: '1.1.0',
      versionCode: 5,
      apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
      apkDownloadUrl: 'url',
      sha256: 'a'.repeat(64),
      sizeBytes: 58_720_256,
      releaseNotes:
        "## What's Changed\n\n**Full Changelog**: https://github.com/example/liftlog/compare/v1.0.3...v1.1.0"
    }
  });

  assert.equal(presentation.releaseNotes, undefined);
});

test('keeps authored notes while removing the generated changelog footer', () => {
  const presentation = presentUpdateState({
    status: 'available',
    installedVersion: '1.0.3',
    release: {
      releaseId: 65,
      versionName: '1.1.0',
      versionCode: 5,
      apkFilename: 'liftlog-1.1.0-arm64-v8a.apk',
      apkDownloadUrl: 'url',
      sha256: 'a'.repeat(64),
      sizeBytes: 58_720_256,
      releaseNotes:
        'Faster startup.\n\n**Full Changelog**: https://github.com/example/liftlog/compare/v1.0.3...v1.1.0'
    }
  });

  assert.equal(presentation.releaseNotes, 'Faster startup.');
});
