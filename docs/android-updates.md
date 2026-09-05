# Android APK updates

LiftLog distributes optional Android updates as signed APK assets on stable GitHub Releases. The public repository is `BraveHeart-tex/Liftlog`. Each release contains exactly two assets:

```text
liftlog-<version>-arm64-v8a.apk
update.json
```

The app compares Android `versionCode`, not `versionName`. `mandatory` is accepted in the manifest for compatibility but is not enforced; updates remain optional.

## Create and protect the release key

Create a dedicated key once. Do not use the debug keystore, commit the keystore, or put passwords in Git.

```sh
keytool -genkeypair \
  -keystore "$LIFTLOG_ANDROID_KEYSTORE_PATH" \
  -alias "$LIFTLOG_ANDROID_KEY_ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore in an encrypted password manager and keep a second encrypted backup. Record the alias, creation date, and SHA-256 certificate fingerprint. The certificate is the long-term identity of every OTA update; losing the key requires a fresh installation because Android will reject a differently signed APK.

The local build environment must provide these variables, normally through `.env.local` loaded by the package script:

```text
LIFTLOG_ANDROID_KEYSTORE_PATH=/private/path/liftlog-release.jks
LIFTLOG_ANDROID_KEY_ALIAS=liftlog
LIFTLOG_ANDROID_STORE_PASSWORD=...
LIFTLOG_ANDROID_KEY_PASSWORD=...
SENTRY_AUTH_TOKEN=...
```

Never paste the values into terminal output, issues, or release notes.

## Increment and build

Set `expo.android.versionCode` in `app.json` to the version code of the last accepted baseline. Use a strictly higher `LIFTLOG_ANDROID_VERSION_CODE` for every published APK. Keep `expo.version` aligned with the user-facing release version.

Build the one supported architecture:

```sh
LIFTLOG_ANDROID_VERSION_CODE=2 pnpm run android:release:single-arch
```

The build performs a clean Expo prebuild, requires the dedicated signing inputs, and writes the APK under `android/app/build/outputs/apk/release/`. A failed signing step must be fixed before continuing; do not fall back to debug signing.

## Generate and validate release assets

Supply release notes from a file or directly on the command line:

```sh
pnpm run android:release:prepare -- \
  --apk android/app/build/outputs/apk/release/app-release.apk \
  --release-notes-file /path/to/release-notes.md
```

The command writes `dist/android-release/liftlog-<version>-arm64-v8a.apk` and `dist/android-release/update.json`. It derives the package, version, byte size, SHA-256 checksum, and signing certificate from the finished APK. It rejects a wrong package, version, version code, ABI, APK signature, or keystore certificate before producing assets. It also verifies the APK contains only ARM64 native libraries.

The generated manifest has this shape:

```json
{
  "versionName": "1.0.1",
  "versionCode": 2,
  "apkFilename": "liftlog-1.0.1-arm64-v8a.apk",
  "sha256": "<64 lowercase hex characters>",
  "sizeBytes": 12345678,
  "releaseNotes": "Summary of the release"
}
```

Review both output files and keep their checksum and certificate output with the release record.

## Upload and publish

1. Create a GitHub Release tagged with the same user-facing version, leave it as a draft, and mark it stable (not prerelease).
2. Upload both files from `dist/android-release/`; do not rename either file.
3. Confirm the release asset size matches `update.json`, then publish the draft.
4. Verify the public release exposes `update.json` and the APK from the same release. The app intentionally ignores drafts and prereleases.

For an initial updater-capable release, manually install the signed APK on existing devices. Existing debug-signed installations cannot be upgraded by the dedicated release key; Android requires uninstalling the debug build first, which can remove local data. Export or back up important data before that one-time transition. Do not automate an uninstall.

## Fixing a broken release

Never reuse a published `versionCode`. Correct the build or metadata, increment the version code, generate a new APK and manifest, and publish the higher version as a new stable release. Devices reject equal or older versions at both the TypeScript and native boundaries.

## Troubleshooting

- **Install permission:** Android may require enabling “Allow from this source” for LiftLog. Return to LiftLog after changing the setting and retry from Settings → Updates.
- **Verification failed:** Regenerate `update.json` from the exact APK being uploaded. Check package name, `versionCode`, SHA-256, ARM64 architecture, and that the same release keystore signed the APK.
- **Installation failed:** Check available storage, keep the APK in the updater flow, and retry. Android’s package installer remains the authority for final signature validation.
- **User cancelled:** This is a normal optional-update outcome. Start the update again from Settings when ready.
- **Interrupted download or process death:** Relaunch LiftLog and use retry. The updater reconciles the persisted installer session and removes stale updater-owned cache files after terminal failure or completion.
- **No update appears:** Confirm the release is published and stable, both assets are present, `update.json` points to the APK in that same release, and its `versionCode` is higher than the installed build.
