# Android full APK updates

- **Status**: Approved; implementation not started
- **Scope**: Personal-use Android direct distribution; ARM64 only
- **Channel**: Public immutable GitHub Releases
- **Decisions**: [ADR-0001](../docs/adr/0001-use-github-releases-for-android-full-apk-updates.md), [ADR-0002](../docs/adr/0002-publish-immutable-arm64-update-releases.md), [ADR-0003](../docs/adr/0003-reconcile-android-update-attempts-durably.md), [ADR-0004](../docs/adr/0004-publish-android-updates-from-protected-ci.md), [ADR-0005](../docs/adr/0005-use-a-backward-compatible-update-discovery-contract.md)

## Goal

The release-signed app discovers, downloads, verifies, and submits a higher APK to
Android. The user accepts native prompts. Protected CI builds and publishes every
post-bootstrap release; no later USB or local APK installation.

This is a full APK update, not Expo/JavaScript OTA.

## Contract

- Package `com.borakaraca94.liftlog`; one `arm64-v8a` APK.
- Latest published stable release; ignore drafts/prereleases.
- Optional only. Auto-check at most every 24 hours; manual bypasses time throttle.
- Public requests plus ETag; no client GitHub token.
- Native `versionCode` orders updates; new code strictly higher.
- User-confirmed install. `REQUEST_INSTALL_PACKAGES` only; no
  `UPDATE_PACKAGES_WITHOUT_USER_ACTION`.
- Foreground download; cellular allowed after showing exact size.
- Update exclusion: user confirmation through terminal native result.
- Active workout or transient workout edit blocks confirmation.
- Published binary/manifest immutable; broken release gets higher version code.
- Production secrets and publish require protected-environment approval.

## Release assets

```text
GitHub Release v<versionName>
├── liftlog-<versionName>-arm64-v8a.apk
└── update.json
```

```json
{
  "schemaVersion": 1,
  "versionName": "1.1.0",
  "versionCode": 2,
  "apkFilename": "liftlog-1.1.0-arm64-v8a.apk",
  "sha256": "<64 lowercase hex>",
  "sizeBytes": 12345678
}
```

GitHub body owns plain-text notes. Manifest has no URL, notes, or mandatory flag.
Resolve the exact same-release APK. Cross-check manifest/API/download size,
manifest hash, and GitHub digest when present.

## Runtime invariants

```text
check -> available -> permission -> download -> verify -> commit
                                                     |
                                                     v
                                      native confirmation/install
                                                     |
                                                     v
                                      reconcile -> terminal result
```

- Commit means requested, never succeeded. Installed native version proves success.
- Later hides only that version's automatic banner.
- Ordinary background during download means interrupted; delete partial and Retry.
- Permission Settings/installer are expected external transitions.
- App Cancel ends at commit; Android owns cancellation afterward.
- One live attempt/session. Stale callbacks cannot mutate a newer attempt.
- Restart restores exclusion before workout actions become interactive.

## Prototype policy

`feat/ota-updates` is evidence only. Never merge/cherry-pick wholesale; it diverges
from current backup work.

| Port after review                                   | Rewrite/discard                                      |
| --------------------------------------------------- | ---------------------------------------------------- |
| Exact asset/size checks; streaming hash concept     | Manifest; automatic modal; silent-install permission |
| Package/version/current-signer verification concept | Cache path; callbacks; confirmation; reconciliation  |
| External JKS; ARM64 inspection concept              | Exclusion; cancellation; workout/UI integration      |

Prototype blockers: JS/native cache paths differ, installer events have no
subscriber, confirmation can stall, sessions can duplicate, success is not
reconciled from installed version, background download is unenforced, no tests.

## Phases

### 1. Signing and version identity

Targets: `app.json`, `plugins/with-android-release-signing.js`, release build script,
plugin tests.

- [ ] Add explicit positive `android.versionCode`; `version` remains version name.
- [ ] Create production JKS outside Git; record certificate SHA-256; verify two
      separately stored encrypted backups.
- [ ] Add idempotent source config plugin surviving clean prebuild. Prefer generated
      Gradle fragment plus minimal marker hook, not broad regex mutation.
- [ ] Read JKS path/passwords/alias from environment. Release fails closed; debug
      stays usable; secrets never print.
- [ ] Add Linux-safe headless ARM64 build. Gate macOS notifications/Finder locally.
- [ ] Test clean Expo SDK 54 output; never edit/commit generated `android/`.

Gate: APK package, name/code, ABI, and production certificate match; no secret leak.

### 2. Protected release CI

Targets: `.github/workflows/release-android.yml`,
`scripts/prepare-android-release.mjs`, release-tool tests.

- [ ] Configure immutable releases, `v*` tag ruleset, protected `android-release`
      environment, required approval, serialized non-cancelling release runs.
- [ ] Preflight without secrets: semantic tag equals `v<versionName>`; commit equals
      current `main`; version code exceeds all published manifests; quality passes.
- [ ] After approval, use pinned Ubuntu, JDK 17, exact NDK/pnpm, and actions pinned
      to full SHAs. Cache dependencies only.
- [ ] Give preflight `contents: read`; publish job only `contents: write`. Use
      `GITHUB_TOKEN`; no PAT/OIDC.
- [ ] Store encoded JKS, credentials, least-privilege Sentry token in environment
      secrets. Decode under `$RUNNER_TEMP`; chmod; always delete.
- [ ] Build ARM64; derive package/ABI/name/code/cert/size/hash from APK; generate
      manifest; reject mismatch.
- [ ] Create/reuse only exact-tag workflow draft; upload two assets; download and
      reverify; generate notes; publish once. Draft retry idempotent; published tag
      fails closed.
- [ ] Retain signed workflow artifact 7-14 days.

Gate: tag plus approval publishes one valid immutable release without local build,
manifest, upload, or USB work.

### 3. Native updater

Create `modules/liftlog-updater/`: Expo metadata/bindings, Android manifest, Kotlin
module, result receiver, notification channel, tests.

- [ ] API: installed build, durable attempt, begin/cancel, install permission/
      settings, owned download target, verify/stage/commit, reconcile.
- [ ] Native creates/canonicalizes private cache path; reject other paths,
      traversal, symlinks, non-files.
- [ ] Off-main-thread streaming verification: size/hash, own package, exact expected
      name/code, strictly newer code, current signing certificate.
- [ ] Stage verified bytes without mutation gap; Android remains final validator.
- [ ] Configure full install, size/package, `USER_ACTION_REQUIRED`, explicit unique
      mutable callback PendingIntent compatible with target 36.
- [ ] Validate callback attempt/session identity. Handle pending action and every
      terminal PackageInstaller status.
- [ ] Persist attempt/stage/target/file/session/pending-confirmation status/exclusion/
      result. Do not serialize Android continuation Intent for recovery.
- [ ] Reconcile installed version first, then session. Missed callback cannot turn
      successful replacement into failure.
- [ ] Launch confirmation while active; otherwise notification. If unavailable,
      recover on foreground without blind duplicate session.
- [ ] Clean owned partial/stale/terminal files and noncommitted sessions; preserve
      live committed work.
- [ ] Return stable permission/storage/hash/package/version/certificate/cancel/
      timeout/install error codes.

Gate: native tests/compile pass; commit never equals success; duplicate session
impossible.

### 4. Discovery and foreground download

Create `src/features/app-updates/`: types/parser, GitHub client, repository, service,
native adapter, store, tests.

- [ ] Strict manifest v1; additive unknown fields allowed; unknown schema rejected.
      Preserve v1 asset during any future breaking-schema transition.
- [ ] Fetch latest stable release, exact manifest, exact same-release APK. Reject
      tag/version mismatch, malformed/duplicate/missing assets, manifest URLs.
      Allow normal redirects from GitHub's resolved asset URL.
- [ ] Compare native installed code, never `app.json`.
- [ ] Persist successful-check time, ETag, cached release metadata, dismissed code
      through repository-owned `app_meta`; no schema migration expected.
- [ ] Deduplicate checks; handle clock rollback/rate limits without retry loops.
- [ ] Download to native-provided path with bytes/percent, cellular, Cancel, restart
      Retry, attempt IDs rejecting stale callbacks.
- [ ] Stage-aware AppState: ordinary background cancels/cleans; Settings/installer
      transitions do not.
- [ ] Auto failures quiet; manual failures actionable; diagnostics follow ADR-0005.
- [ ] Android-only native loading; other platforms start cleanly.

Gate: tests cover schema/assets, caching/throttle/dismissal, concurrency, rate limit,
clock rollback, interruption/cancel/retry, stale results, unsupported platforms.

### 5. Race-safe workout exclusion

Targets: updater provider/guard, repository active-workout query, transient-edit
registry, every active-workout creation action.

- [ ] After DB readiness, reconcile native attempt and hydrate synchronous JS latch
      before interactive children mount.
- [ ] Update confirm flips latch before first await, durably begins attempt, then
      queries authoritative SQLite `status = 'in_progress'`; unwind on failure.
- [ ] Every active-workout action synchronously checks latch before repository write.
      Re-audit blank, template/replacement, repeat, and new call sites.
- [ ] `SetForm` editors register dirty transient input. Block update until commit/
      discard; clean persisted historical drafts stay allowed.
- [ ] Before installer commit, recheck active workout, permission, installed code,
      attempt identity. Hold exclusion through terminal reconciliation.
- [ ] Test both race orders, restart, restored workout, dirty/clean historical draft,
      duplicate taps, cancellation, failure, control recovery.

Gate: no tested interleaving starts installation and active workout together.

### 6. Presentation

Targets: update host/banner/details, Settings update section,
`src/providers/common-providers.tsx`, UI tests.

- [ ] Use `steps-sync-host.tsx` idle/foreground pattern. Never replace another
      global confirmation.
- [ ] Nonblocking banner opens details: version, capped plain-text notes, exact size,
      Later, Update.
- [ ] Keep details non-dismissible during download/verification. Show measurable
      progress; indeterminate otherwise; Cancel only pre-commit.
- [ ] Close when Android owns flow. Settings mirrors installed/available version,
      last check, live/terminal state, manual check, permission, Retry.
- [ ] Distinct active-workout, dirty-edit, update-in-progress copy.
- [ ] Match bottom-sheet, typography, safe-area, touch, accessibility,
      reduced-motion rules.

Gate: availability never interrupts workout entry; each recoverable state has one
clear action.

### 7. Operations and proof

Create `docs/android-updates.md`; link from `docs/index.md`.

- [ ] Document key/recovery, certificate, secrets/approval, immutable/tag settings,
      version/tag flow, CI retry, bad release, permission, interruption, storage,
      verification, cancellation, callback/session recovery.
- [ ] Register/monitor package and signer for Android developer verification; date
      regional-policy assumptions.
- [ ] Export/validate backup; approve first updater CI release; perform one-time
      debug uninstall/release install; restore and verify data.
- [ ] Publish higher test version via CI; complete in-app update/reconciliation.
- [ ] Run TypeScript, targeted ESLint/Prettier, focused tests, full `pnpm run test`,
      discovered native unit/compile tasks, production ARM64 build.
- [ ] Device/API: 26, 31, 35+, connected ARM64 API 37 16 KB emulator, personal
      physical device.
- [ ] Negative: wrong size/hash/package/name/code/cert, corrupt APK, storage,
      permission, system cancel, background, process death, missed/duplicate
      callback, stale file/session, offline/rate limit.
- [ ] UX/races: active/restored workout, every start path, dirty/clean draft, Later,
      auto/manual check, Cancel/Retry, non-Android startup.
- [ ] Handoff exact checks, device evidence, fingerprint, release IDs, blockers,
      next action. JS/mocks alone cannot prove installation.

Gate: first signed install updates to higher CI release through native prompts,
relaunches at new version, preserves workout data.

## Boundaries

- No EAS/JS OTA, Play flow, forced/silent install, rollback/kill switch, delta,
  background/resumable service, multi-ABI, automatic relaunch/uninstall.
- No credentials, key, arbitrary URL, sensitive diagnostics in app/repo/log/
  artifact/manifest.
- No generated Android/Drizzle/lockfile hand edits; no unrelated refactor.
- `expo-file-system` already exists; do not add it again.

## References

- [Android PackageInstaller](https://developer.android.com/reference/android/content/pm/PackageInstaller)
- [Android install-source permission](<https://developer.android.com/reference/android/content/pm/PackageManager#canRequestPackageInstalls()>)
- [Android app signing](https://developer.android.com/studio/publish/app-signing)
- [GitHub latest release API](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)
- [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)
- [GitHub Actions security](https://docs.github.com/en/actions/reference/security/secure-use)
