# Android release signing

LiftLog production releases use a dedicated JKS outside Git. The committed public certificate identity is:

`SHA-256 9A:9F:C0:51:44:D0:78:56:BF:70:99:FB:E4:8E:02:78:DE:69:32:19:C1:CE:80:34:07:D1:0B:58:D4:77:6E:9B`

The build reads these secret environment variables:

- `LIFTLOG_ANDROID_KEYSTORE_PATH`
- `LIFTLOG_ANDROID_KEY_ALIAS`
- `LIFTLOG_ANDROID_STORE_PASSWORD`
- `LIFTLOG_ANDROID_KEY_PASSWORD`
- `SENTRY_AUTH_TOKEN`

Keep the JKS and real values outside the repository. `.gitignore` rejects JKS and keystore files as a secondary guard. A release task stops before compilation when credentials are missing or the keystore path is not a file. Debug tasks do not require these values.

Run `pnpm run android:release:single-arch`. It performs a clean Android prebuild, builds only `arm64-v8a`, then runs `scripts/verify-android-release.sh`. The verifier compares the APK with `app.json` and `config/android-release.json` for package, version name/code, ABI, and signer fingerprint.

## Backup readiness

Before distributing the first production-signed APK:

1. Put two encrypted copies in independently recoverable storage controlled by different failure domains.
2. Restore each copy into a separate temporary directory.
3. Run `keytool -list` against each restored copy using secret input, without printing passwords or aliases.
4. Confirm both restored copies report the committed SHA-256 fingerprint above.
5. Delete the temporary restored copies and record the verification date and custodians outside Git.

Losing this key prevents future in-place updates. Do not publish until both recovery tests are recorded.
