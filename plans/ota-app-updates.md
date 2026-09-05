**LiftLog: Android APK self-update implementation plan**

**Status:** Design approved; implementation not started. Implement only when explicitly requested. Work through the steps in order and record completed checks and remaining blockers at each handoff.

**Objective**

Add full APK updates for Android sideload installations using GitHub Releases. TypeScript owns release checks and downloading; a local Kotlin Expo module owns APK inspection, permissions, and `PackageInstaller.Session` installation.

**Approved decisions**

- Android only; one ARM64 APK per release.
- Public repository: `BraveHeart-tex/Liftlog`. Use the latest stable release; ignore drafts and prereleases.
- Android `versionCode` is authoritative.
- Automatic checks on launch/foreground, at most once every 24 hours. Manual checks bypass throttling.
- Download and install only after the user taps **Update**.
- Updates remain optional, including when a manifest contains `mandatory: true`.
- **Later** suppresses automatic prompts for that version; Settings still offers it.
- Foreground downloads with cancellation and retry. No reliable background-download requirement.
- Allow cellular downloads; show APK size before consent.
- Block updates during any unfinished workout, including restored workouts. Block starting workouts while an update executes.
- Add `expo-file-system`; this production dependency is already approved.
- Use a dedicated, backed-up release signing key. A one-time fresh installation for existing debug-signed builds, with potential local data loss, was accepted. This does not authorize automatically uninstalling anyone’s app.
- Build locally, generate release metadata, and upload both assets to a draft release manually.
- No EAS Update, Google Play integration, mandatory enforcement, binary rollback, or release CI in this implementation.

**Repository context**

Verified during planning; recheck for drift before implementation.

| Area             | Current state                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | Expo SDK 54, React Native 0.81.5                                                                                                        |
| Android identity | `com.borakaraca94.liftlog`                                                                                                              |
| Version          | `app.json`: `1.0.0`; no explicit `android.versionCode`; generated build uses `1`                                                        |
| Android SDK      | Minimum 26; compile/target 36                                                                                                           |
| Signing          | Generated release configuration currently uses debug signing                                                                            |
| Build            | `scripts/build-android-release-single-arch.sh`; clean Android prebuild, then Gradle release build; ARM64 default; requires Sentry token |
| Native sources   | `android/` is generated; no existing local Expo modules                                                                                 |
| GitHub           | Public repository; no published releases when inspected                                                                                 |
| Persistence      | Existing application metadata storage can hold check/dismissal timestamps without schema changes                                        |
| Tooling          | Java 17, Android SDK, `adb`, Expo CLI, generated Gradle wrapper available; no existing native test harness verified                     |

Follow `AGENTS.md` and `.codexignore`. Read the relevant `docs/` rules before editing each subsystem: data access, database, styling, layout, navigation, reduced motion, and workout UX. Modify source configuration and plugins; never hand-edit generated native files or migrations.

**Step 1 — Establish durable signing and versioning**

File targets:

- `app.json`
- `scripts/build-android-release-single-arch.sh`
- New `plugins/with-android-release-signing.js`
- `.gitignore`, only if needed for private signing material

Actions:

1. Add explicit Android `versionCode`.
2. Configure release signing through a source Expo config plugin that survives clean prebuild.
3. Load keystore location and credentials from local build configuration; keep secrets outside Git and tool output.
4. Make release builds fail clearly when signing inputs are missing instead of silently using debug signing.
5. Keep the package name and ARM64 distribution.
6. Require a higher `versionCode` for each published binary.

**Completion:** A clean-prebuild release APK has the expected package, version, architecture, and dedicated certificate. Record its public certificate fingerprint and the key-backup procedure.

**Step 2 — Build the local Kotlin Expo module**

Create `modules/liftlog-updater/` with:

- `package.json`, `expo-module.config.json`, TypeScript bindings
- `android/build.gradle`
- `android/src/main/AndroidManifest.xml`
- Kotlin module, APK verification helper, and installation-result receiver

Keep the public API small: installed-build information, install permission status/settings action, verify/install, installation status reconciliation, and cleanup.

Actions:

1. Read installed version and certificate from Android, not Expo’s JavaScript configuration.
2. Stream SHA-256 calculation off the main thread.
3. Inspect the downloaded APK and require matching package name, manifest `versionCode`, and installed signing certificate. Reject equal/older versions again at the native boundary.
4. Accept only updater-owned private cache files. Ensure the bytes staged for installation are the verified bytes.
5. Declare `REQUEST_INSTALL_PACKAGES`; handle `canRequestPackageInstalls()` and returning from permission Settings.
6. Create, write, flush, close, and commit `PackageInstaller.Session`.
7. On Android 12+, request `USER_ACTION_NOT_REQUIRED` when eligible and declare `UPDATE_PACKAGES_WITHOUT_USER_ACTION`.
8. Always handle `STATUS_PENDING_USER_ACTION` by presenting Android’s confirmation flow when foregrounded.
9. Use an explicit, appropriately secured mutable callback `PendingIntent`, compatible with target SDK 36.
10. Persist session ID, intended version, and terminal result natively. JavaScript promises/listeners alone are insufficient because replacement can terminate the process.
11. Reconcile installed version and outstanding session after restart. Treat commit as “installation requested,” not success.
12. Clean files and abandoned sessions after cancellation/failure/completion and during startup recovery. Preserve live installer work until reconciled.

Return structured error codes for permission denial, verification failure, user cancellation, storage failure, incompatible APK, and installation failure. Android retains responsibility for final APK signature validation.

**Completion:** Native compilation passes. A same-key higher-version APK installs; wrong package, signer, hash, or version is rejected. Record device evidence separately from mocked tests.

**Step 3 — Implement TypeScript orchestration**

Create under `src/features/app-updates/`:

```text
app-update.types.ts
app-update.service.ts
app-update.repository.ts
app-update.store.ts
```

Update `package.json` and the package-manager-generated lockfile for the approved Expo-compatible `expo-file-system` dependency.

Actions:

1. Fetch GitHub’s latest stable release without embedding credentials.
2. Load `update.json`; validate field types, positive integer version, SHA-256 format, filename, and size.
3. Resolve the APK from that same release’s assets, rather than accepting arbitrary manifest download URLs.
4. Compare with the installed native `versionCode`.
5. Persist check timing and dismissed version using existing metadata storage. Deduplicate checks and handle GitHub rate limits without retry loops.
6. Implement explicit states: checking, available, permission required, downloading, verifying, installing, awaiting confirmation, succeeded, cancelled, and failed.
7. Report download bytes/percentage. Keep verification and installation indeterminate unless their progress is actually measurable.
8. Support cancellation before installer commit. Ignore stale asynchronous callbacks after cancellation or retry.
9. Stop or cancel interrupted foreground downloads safely; restart on explicit retry. Permission Settings and the system installer are expected lifecycle transitions, not ordinary download failures.
10. Keep automatic check failures quiet; manual failures expose a useful retry action.
11. Use Android-only loading/bindings so other platforms do not require the native module.

**Completion:** Tests cover malformed/missing assets, version comparison, throttling, dismissal, concurrent requests, network failures, cancellation, retries, and restart reconciliation.

**Step 4 — Add UI and workout exclusion**

File targets:

- `src/providers/common-providers.tsx`
- `src/features/settings/components/about-info-section.tsx`
- New update host, availability dialog, and Settings progress component
- Workout action files listed below

Reuse the Android host pattern in `src/features/steps/components/steps-sync-host.tsx`. Mount after database readiness.

UI behavior:

- Dialog: version, release notes, APK size, **Later**, **Update**.
- Settings → Updates: installed version, manual check, progress, cancel, retry, and permission guidance.
- Wait until idle before automatic prompting. The shared dialog store replaces existing dialogs, so never displace another confirmation.
- Follow existing typography, buttons, snackbar, accessibility, and reduced-motion conventions.

Workout protection:

- Authoritative state is SQLite `workouts.status = 'in_progress'`.
- Treat loading/read failures as unavailable for updating.
- Acquire update exclusion before the first asynchronous operation and recheck authoritative workout state before installation.
- Guard all creation paths, not just visible buttons:

| Path                       | Action file                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| Quick start                | `src/features/workouts/active/hooks/use-workout-start.ts`              |
| Template start/replacement | `src/features/workouts/templates/hooks/use-workout-template-detail.ts` |
| History repeat             | `src/features/workouts/history/hooks/use-repeat-workout.ts`            |

These ultimately call `createWorkout`, `repeatWorkout`, and `createWorkoutFromTemplate` in the shared/template repositories. Preserve repository ownership of database queries and synchronous creation behavior when implementing exclusion.

Also inspect `workout-start-screen.tsx`: it sets local loading before calling the action. A blocked start must clear that state. Resume navigation must remain consistent with persisted workout and installer recovery.

**Completion:** Tests demonstrate no update/workout-start race across all three paths, restored-workout protection, and no stuck controls after cancellation or failure.

**Step 5 — Generate release assets and documentation**

Create:

- `scripts/prepare-android-release.mjs`
- `docs/android-updates.md`
- Link the documentation from `docs/index.md`

Release structure:

```text
GitHub stable release
├── liftlog-<version>-arm64-v8a.apk
└── update.json
```

Manifest fields:

```text
versionName
versionCode
apkFilename
sha256
sizeBytes
releaseNotes
mandatory    optional; not enforced
```

Derive version, size, checksum, package, and signing validation from the finished APK using existing Android build tools. Reject mismatched configuration before producing publishable assets.

Document:

1. Secure key creation and backup.
2. Incrementing version code and building.
3. Generating/validating metadata.
4. Uploading both assets to a draft, then publishing stable.
5. Manually installing the initial updater-capable release.
6. Publishing a higher version code to fix broken releases.
7. Troubleshooting permission, verification, installation, and interrupted-download errors.

**Completion:** A repeatable local command produces matching APK/manifest assets, and the documentation is sufficient without this conversation.

**Step 6 — Validate the complete flow and hand off**

Run applicable checks:

```sh
./node_modules/.bin/tsc --noEmit --project ./tsconfig.json
./node_modules/.bin/eslint <changed-files>
./node_modules/.bin/prettier --check <changed-files>
pnpm run test
```

Run native build/tests using actual discovered Gradle tasks. Use live output for long commands. Follow `docs/agent-problems.md` for nontrivial tool failures or sandbox workarounds.

Device validation must cover:

- Successful same-key upgrade preserving workout data.
- Android below 12 and Android 12+ confirmation behavior, including target-SDK-36 callback compatibility.
- Wrong hash/package/version/certificate and corrupt APK.
- Permission refusal, system cancellation, insufficient storage.
- Background interruption, process death, relaunch, and stale-file cleanup.
- Active/restored workouts and simultaneous workout-start attempts.
- Manual and automatic update checks.
- Other platforms loading without updater-module errors.

At handoff, record completed steps, exact checks and outcomes, device/API coverage, remaining blockers, and the next unfinished action. Do not mark device behavior verified from JavaScript tests alone.
