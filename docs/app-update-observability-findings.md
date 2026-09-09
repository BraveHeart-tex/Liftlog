# App update observability findings

## Scope

- Feature: Android full APK updates
- Runtimes: React Native JavaScript and Android Kotlin
- Reporter: Sentry React Native 8.17.2
- Findings: 2 missing-capture, 1 unactionable-capture
- Plan status: refined and accepted on 2026-09-09

## Incident diagnosis

The connected emulator had LiftLog 1.0.3, version code 4, installed as a
debuggable application signed with the Android debug certificate. The downloaded
LiftLog 1.0.4 release, version code 5, was signed with the production certificate.

Android cannot replace an installed application unless the update has the same
application ID and signing identity. The published APKs themselves were valid:

- Both used `com.borakaraca94.liftlog`.
- The version code increased from 4 to 5.
- Both published releases used the production signing certificate.
- Both APKs contained only ARM64 native libraries.
- Their sizes and SHA-256 hashes matched their `update.json` manifests.

The failure therefore came from attempting to replace a locally installed,
debug-signed build with a production-signed release.

## Findings

### 1. Android installer results are not reported

Severity: High  
Class: Missing capture

`InstallationResultReceiver` receives the final result from Android's
`PackageInstaller`, but only converts the integer status into a coarse internal
result code. It does not retain or report useful Android diagnostics such as:

- `PackageInstaller.EXTRA_STATUS_MESSAGE`
- The raw installer status
- A blocking package, when supplied
- The relevant storage path, when supplied
- Developer-verification failure information, when supplied

The result is persisted and later reconciled into UI state, but reconciliation
does not send terminal installer failures to Sentry. A user can therefore receive
an installation failure while no diagnostic event is created.

Evidence:

- `modules/liftlog-updater/android/src/main/java/expo/modules/liftlogupdater/InstallationResultReceiver.kt`
- `modules/liftlog-updater/android/src/main/java/expo/modules/liftlogupdater/UpdaterContract.kt`
- `src/features/app-updates/update-attempt-coordinator.ts`

Recommended fix:

Persist sanitized installer diagnostics in a bounded native backlog. When the app
next starts or returns to the foreground, submit the oldest diagnostic to Sentry
and acknowledge that exact diagnostic only after Sentry returns an event ID.

### 2. Existing update-attempt reports are not actionable enough

Severity: Medium  
Class: Unactionable capture

Exceptions raised before installer ownership do produce a Sentry message named
`UPDATE_ATTEMPT_FAILED`. The event currently includes only:

- Stage
- Updater error code
- Android API level

The original exception is discarded. The event also lacks the installed and
target builds, attempt identity, build type, and signing relationship. This makes
it difficult to distinguish a corrupt download, lifecycle failure, permission
problem, debug-to-release signing mismatch, or unexpected native exception.

Evidence:

- `src/features/app-updates/update-attempt-coordinator.ts`
- `src/features/app-updates/update-provider.tsx`

Recommended fix:

Use `captureException(error)` for real exceptions and attach safe structured
context:

- `feature: app_updates`
- Operation and stage
- Updater error code
- Attempt ID
- Installed version name and code
- Target version name and code
- Android API level
- Whether the installed application is debuggable
- `candidateSignerMatchesInstalled`

Do not send APK paths, credentials, release tokens, application data, or other
unnecessary device or user information.

### 3. Startup reconciliation failures are console-only

Severity: Medium  
Class: Missing capture

The update provider catches native reconciliation failures during startup and
only calls `console.error`. Console capture is not configured in the current
Sentry setup, so these failures are not reliably visible in Sentry.

This path is consequential because the application deliberately keeps the update
exclusion active when native ownership is unknown. A reconciliation failure can
therefore affect update recovery and block operations protected by that exclusion.

Evidence:

- `src/features/app-updates/update-provider.tsx`
- `src/features/app-updates/update-exclusion.ts`

Recommended fix:

Capture the original reconciliation exception at the caller boundary on startup
and foreground transitions. Include operation, native stage, target version code,
update-exclusion state, and Android API level. Avoid lower-boundary capture of the
same exception.

## Recommended reporting flow

```text
Android installer callback
  -> sanitize before persistence
  -> append diagnostic to bounded native backlog
  -> app starts or returns to foreground
  -> reconcile durable native state
  -> submit oldest diagnostic to Sentry
  -> receive a local Sentry event ID
  -> acknowledge that diagnostic by attempt ID and diagnostic ID
```

This design survives process termination and application replacement without
requiring the Sentry SDK to be initialized directly inside the broadcast receiver.

The diagnosed signing mismatch is rejected during native verification before an
installer session is created. It therefore belongs to the exception-based update
attempt event family, not `UPDATE_INSTALL_FAILED`. An actionable event would
resemble:

```text
eventFamily: update_attempt_exception
operation: verify
errorCode: UPDATER_CERTIFICATE_MISMATCH
stage: verification
installedVersionCode: 4
targetVersionCode: 5
isDebuggable: true
candidateSignerMatchesInstalled: false
```

`UPDATE_INSTALL_FAILED` is reserved for silent Android-owned or
reconciliation-produced terminal failures that were not already reported as a
rejected operation.

## Expected and already-covered paths

- Manual release-discovery failures already create diagnostic Sentry messages.
- Pre-installer verification exceptions are reported, although their context
  needs improvement as described above.
- Automatic update-check failures are intentionally quiet.
- User cancellation and foreground-download interruption are expected outcomes
  and should not generate error events.
- Unhandled React Native errors have top-level Sentry coverage through the root
  application wrapper.

## Recommended remediation order

1. Persist and report final Android installer diagnostics.
2. Preserve original pre-installer exceptions and attach update context.
3. Report startup and foreground reconciliation failures.
4. Expand user-facing mappings so known native result codes do not fall through
   to the generic installation message.

## Refined design

### Reporting ownership

- A rejected update operation with a real exception is reported once with
  `captureException`. A non-`Error` rejection uses a message fallback.
- A silent Android-owned or reconciliation-produced failed terminal state is
  reported as `UPDATE_INSTALL_FAILED`.
- Cancellation, interruption, success, and automatic-check failures remain quiet.
- Reporting is fail-open. Enrichment, capture, or acknowledgement failures never
  change update UI state, update exclusion, or whether a new update may begin.
- The original application error always wins. Reporter failures use console
  fallback and do not recursively create Sentry events.

### Durable diagnostic backlog

Store a FIFO backlog in the updater's existing native SharedPreferences. It is
separate from `NativeUpdateState`, has a maximum of five sanitized records, and
survives process termination. A new update attempt does not clear it.

Each record contains only:

- `diagnosticId`: Native-generated UUID
- `attemptId`
- `occurredAt`
- Source: installer callback, reconciliation, or legacy state
- Native stage and stable updater result code
- Raw numeric installer status when available
- Sanitized status message when available
- Explicit blocking package when Android supplies one
- Storage-location classification, never a filesystem path
- API-gated developer-verification fields only when the compiled Android API
  exposes them as safely structured values

Sanitize before persistence. Normalize whitespace; redact file and content URIs,
absolute paths, long hashes, token-like values, and package-like identifiers from
free text; then truncate the message to 512 characters. Never retain the original
unsanitized text. Do not store APK paths, credentials, release tokens,
certificates, or application data in a diagnostic.

When the backlog exceeds five records, discard the oldest record and increment a
durable dropped-diagnostic counter. Attach the counter to the next successfully
submitted event and clear it only when that diagnostic is acknowledged. Pending
records do not expire; include their age in reported context.

### Native bridge contract

Keep diagnostic reporting separate from lifecycle state:

- `getPendingDiagnosticsAsync()` returns the backlog oldest-first.
- `acknowledgeDiagnosticAsync({ attemptId, diagnosticId })` removes only the exact
  matching record.

Submit one diagnostic at a time. Acknowledge only after Sentry returns a nonempty
event ID. If capture throws or produces no event ID, retain the record for the next
startup or foreground attempt. A crash between submission and acknowledgement can
produce a rare duplicate; losing the diagnostic is the less acceptable outcome.

### Context and grouping

All events use low-cardinality tags for `feature: app_updates`, operation, stage,
and updater error code. Attempt ID, diagnostic ID, versions, raw status, diagnostic
age, and dropped count remain extras.

- Real exceptions retain Sentry's default stack-based grouping.
- `UPDATE_INSTALL_FAILED` uses a fingerprint based on event family, result code,
  native stage, and raw numeric status.
- Read `isDebuggable` from native `ApplicationInfo.FLAG_DEBUGGABLE`; do not infer
  APK build type from `__DEV__`.
- `candidateSignerMatchesInstalled` is tri-state: `false` for the exact
  certificate-mismatch failure, `true` after successful candidate verification,
  and `null` when comparison did not complete.
- Installed-build enrichment is best-effort. Failure to collect context must not
  replace or suppress the source failure.

### Reconciliation and legacy state

- Reconcile and drain diagnostics on startup and every foreground transition.
- Remove the redundant second startup reconciliation.
- Capture reconciliation exceptions at the provider caller boundary, while
  keeping update exclusion conservatively active when native ownership is unknown.
- Convert an existing native `failed` state into one reduced legacy diagnostic
  only when it has an attempt ID and result code. Persist a materialized marker so
  acknowledgement cannot recreate it on later reconciliations.
- Never synthesize diagnostics for cancelled, interrupted, or succeeded states.

### User-facing outcomes

Add specific recovery copy for stable, actionable codes including incompatible
APK, install conflict, invalid APK, timeout, confirmation unavailable, ABI
mismatch, and file-changed. Keep session, state, and internal failures generic in
the UI while retaining their precise code in observability events.

## Implementation sequence

1. Add pure native diagnostic models, status extraction, sanitization, backlog,
   overflow tracking, legacy materialization, and identity-gated acknowledgement.
2. Update `InstallationResultReceiver` and native reconciliation to create
   diagnostics for silent unexpected failures without changing update exclusion.
3. Expose the two diagnostic bridge methods and native `isDebuggable`; update the
   TypeScript module contract.
4. Add an app-update reporter that owns Sentry tags, extras, sanitization defense,
   grouping, capture result handling, and backlog draining.
5. Pass original attempt errors and available attempt/release context out of the
   attempt coordinator. Capture real exceptions instead of reducing them to
   messages.
6. Rework provider startup and foreground reconciliation to use one caller-owned
   error boundary, remove duplicate startup reconciliation, and drain diagnostics.
7. Expand presenter mappings for actionable native result codes.
8. Update focused native, coordinator, provider, and presenter tests.

## Acceptance criteria

- Every unexpected rejected update operation preserves its original exception and
  safe structured context in Sentry.
- Every silent failed Android-owned outcome remains reportable across process
  death and is acknowledged only after local Sentry acceptance.
- One failure is not intentionally reported by both event families. Rare
  submit-before-ack crash duplicates remain identifiable by diagnostic ID.
- Reporter failures do not block an update, release update exclusion, overwrite
  update UI state, or discard pending diagnostics.
- Sentry events contain no APK path, URI, certificate hash, token, application
  data, or unsanitized OEM status text.
- Kotlin tests cover extraction, sanitization, FIFO order and cap, overflow count,
  legacy materialization, and identity-gated acknowledgement.
- TypeScript tests cover original-error preservation, safe context, grouping,
  capture retry and acknowledgement, startup and foreground reconciliation, and
  duplicate prevention.
- Presenter tests cover each new actionable user-facing mapping.
- TypeScript, focused ESLint and Prettier, focused JavaScript tests, and native
  Gradle tests pass.
- Manual validation covers ADR-0003's API 26, API 31, API 35 or newer, and the
  personal physical device matrix.
- A test Sentry project receives one verified event from each event family with
  expected grouping and no sensitive fields.
