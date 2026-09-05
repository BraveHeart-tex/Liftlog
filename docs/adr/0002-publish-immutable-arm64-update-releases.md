# ADR-0002: Publish immutable ARM64 update releases

- Status: Accepted
- Date: 2026-09-06

## Context

LiftLog's direct-distribution channel is for personal use on known ARM64 devices.
The release process needs a small artifact, a trustworthy update contract, and a
recoverable signing procedure. Repetitive build, signing, manifest, and publishing
work should not require local manual steps.

## Decision

- Publish one ARM64 APK per update release. Do not publish a universal or multi-ABI
  APK in v1.
- Use the latest published, stable GitHub Release for discovery. Ignore drafts and
  prereleases.
- Store machine-readable metadata in `update.json`: schema version, version name,
  positive integer version code, exact APK filename, SHA-256, and byte size.
- Use the GitHub release body for human release notes. Do not duplicate release
  notes in the update manifest.
- Resolve the APK by exact asset name from the same release. Never accept an
  arbitrary manifest URL or select the first APK-like asset.
- Treat the installed native package metadata and signing certificate as
  authoritative. Android remains the final installation validator.
- Enable immutable GitHub releases. Validate assets while the release is a draft,
  then publish once without replacing published assets.
- Recover from a bad release by stopping further distribution when possible and
  publishing a corrected APK with a higher version code. Do not implement binary
  rollback, a remote kill switch, or forced updates in v1.
- Keep downloads foreground-only. Allow cellular downloads after showing their
  size. Support progress, cancellation, and explicit retry from the beginning.
- Announce availability with a nonblocking banner and a Settings surface. Open
  update details only after user interaction.
- Acquire update exclusion when the user confirms Update and hold it through
  permission, download, verification, and installer commit.
- Keep the release JKS and credentials outside Git, maintain two encrypted backups
  in separate locations, record the public certificate fingerprint, and verify
  key recovery before the first update release.
- Include Android developer-verification registration and monitoring in release
  readiness without speculating about unfinished future enforcement behavior.
- Automate release building, signing, validation, manifest generation, and GitHub
  publishing in CI. Record the exact trigger and release controls separately once
  they are settled.

## Consequences

- APK downloads stay smaller than a universal build, but non-ARM64 devices are not
  supported.
- The update manifest is an early integrity and compatibility check, not a
  substitute for native certificate and package verification.
- Publishing is intentionally one-way. Corrections consume a new version code.
- Backgrounding or terminating LiftLog can interrupt a download. The UI must make
  that limitation clear and recover without stale state or files.
- Android's native permission and confirmation steps remain user actions even
  though release production is automated.
