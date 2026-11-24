# ADR-0007: Set an explicit Android permission policy

- Status: Accepted
- Date: 2026-11-24

## Context

LiftLog's Android manifest is assembled from three sources: the Expo prebuild
template (`expo-template-bare-minimum`), the `android.permissions` list in
`app.json`, and the manifests of every native library merged at build time. Only
the first two appear in `expo config --type introspect`; library manifests appear
only in the merged APK. The template marks its storage, overlay and vibration
permissions as optional, and several libraries request permissions for features
LiftLog does not use. LiftLog targets SDK 36 with minSdk 26 and is distributed as
a signed APK through GitHub Releases ([ADR-0001](0001-use-github-releases-for-android-full-apk-updates.md)).

## Decision

- Every permission in the release APK is listed below with its origin and need.
  A permission without a LiftLog feature is removed through
  `android.blockedPermissions` in `app.json`, which writes `tools:node="remove"`
  and so also strips library-merged entries.
- `android.permissions` lists only permissions LiftLog's own features request.
- A new permission reaching the release APK requires updating this table.

Variants: `all` reaches debug, debugOptimized and release. `debug` reaches only
debug and debugOptimized.

| Permission                                                                                    | Origin                                                               | Variants | Need                                                                                                    | Security and policy note                                                                     | Policy |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ |
| `INTERNET`                                                                                    | template; `@sentry/react-native`; `expo-file-system`                 | all      | Update discovery and download, Sentry reporting                                                         | Normal; no user prompt                                                                       | Keep   |
| `ACCESS_NETWORK_STATE`                                                                        | `@sentry/react-native`                                               | all      | Sentry offline caching and connectivity breadcrumbs                                                     | Normal                                                                                       | Keep   |
| `REQUEST_INSTALL_PACKAGES`                                                                    | `app.json`; `liftlog-updater`                                        | all      | In-app full APK update install ([ADR-0001](0001-use-github-releases-for-android-full-apk-updates.md))   | User grants "install unknown apps" per source; Play restricts it, LiftLog ships outside Play | Keep   |
| `SCHEDULE_EXACT_ALARM`                                                                        | `app.json`; `liftlog-exact-alarm`                                    | all      | Exact rest timer delivery ([ADR-0006](0006-reconcile-android-rest-timers-with-native-notifications.md)) | Special access granted in system settings; inexact fallback when denied                      | Keep   |
| `POST_NOTIFICATIONS`                                                                          | `expo-notifications`; `liftlog-updater`                              | all      | Rest timer notification, update status                                                                  | Runtime permission on API 33+; refusal keeps timers working                                  | Keep   |
| `RECEIVE_BOOT_COMPLETED`                                                                      | `expo-notifications`                                                 | all      | Reschedules a pending rest timer notification after reboot                                              | Normal                                                                                       | Keep   |
| `VIBRATE`                                                                                     | template; `expo-haptics`                                             | all      | Haptic feedback, notification vibration                                                                 | Normal                                                                                       | Keep   |
| `MODIFY_AUDIO_SETTINGS`                                                                       | `expo-audio`                                                         | all      | Audio mode for rest timer and stopwatch sounds                                                          | Normal; cannot record or read audio                                                          | Keep   |
| `WAKE_LOCK`                                                                                   | `firebase-messaging` via `expo-notifications`                        | all      | Library wake locks while delivering notifications                                                       | Normal; removal risks dropped deliveries in transitive libraries                             | Keep   |
| `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`                                                    | `androidx.core`                                                      | all      | Protects LiftLog's non-exported runtime receivers                                                       | Signature-level, app-private                                                                 | Keep   |
| `health.READ_STEPS`                                                                           | `app.json`                                                           | all      | Steps screen                                                                                            | Health Connect grant; Play health policy applies if ever published there                     | Keep   |
| `health.READ_HEALTH_DATA_HISTORY`                                                             | `app.json`                                                           | all      | Steps older than 30 days                                                                                | Health Connect grant                                                                         | Keep   |
| `health.READ_HEALTH_DATA_IN_BACKGROUND`                                                       | `app.json`                                                           | all      | None: requested, but no background read exists                                                          | Health Connect grant for background data access                                              | Remove |
| `READ_EXTERNAL_STORAGE`                                                                       | template; `expo-file-system`                                         | all      | None: backups use app storage, the system file picker and the share sheet                               | Dangerous; no effect on API 33+, broad media access below                                    | Remove |
| `WRITE_EXTERNAL_STORAGE`                                                                      | template; `expo-file-system`                                         | all      | None: as above                                                                                          | Dangerous; no effect on API 30+                                                              | Remove |
| `SYSTEM_ALERT_WINDOW`                                                                         | template main manifest; template debug manifests; React Native debug | all      | None in release; the debug dev menu does not require it                                                 | Special access to draw over other apps; abuse-prone                                          | Remove |
| `RECORD_AUDIO`                                                                                | `expo-audio`                                                         | all      | None: LiftLog only plays audio                                                                          | Dangerous microphone access                                                                  | Remove |
| `FOREGROUND_SERVICE`                                                                          | `expo-audio`                                                         | all      | None: lock-screen and background playback are unused                                                    | Normal, but implies a foreground service                                                     | Remove |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK`                                                           | `expo-audio`                                                         | all      | None: as above                                                                                          | Play requires a foreground service type declaration for target SDK 34+                       | Remove |
| `com.google.android.c2dm.permission.RECEIVE`                                                  | `firebase-messaging` via `expo-notifications`                        | all      | None: LiftLog uses local notifications only                                                             | Lets FCM deliver remote push                                                                 | Remove |
| `com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE`                      | `installreferrer` via `expo-application`                             | all      | None: install referrer is unused and LiftLog ships outside Play                                         | Reads Play install attribution                                                               | Remove |
| `READ_APP_BADGE` and 15 launcher badge permissions (Samsung, HTC, Sony, Huawei, OPPO, others) | `ShortcutBadger` via `expo-notifications`                            | all      | None: LiftLog sets no badge counts                                                                      | Vendor launcher settings access                                                              | Remove |

## Consequences

- Release APK permissions are checked against this table: a native test checks
  the generated manifest, and `scripts/verify-android-release.sh` checks the built
  APK against the release allowlist in `config/android-release.json`.
- Adding remote push, background audio, background step reads or recording
  requires amending this ADR and unblocking the permission first.
- Template and library upgrades can add permissions silently; only the merged APK
  shows them.
