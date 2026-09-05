# ADR-0004: Publish Android updates from protected CI

- Status: Accepted
- Date: 2026-09-06

## Context

Manual APK building, signing, metadata generation, and GitHub uploading undermine
the purpose of an in-app update channel. Release automation also introduces access
to the production signing key, so an accidental tag must not be sufficient to use
that key or publish an update.

## Decision

- Add a dedicated Android release workflow triggered only by a semantic `v*` tag.
  Require the tag to equal `v<versionName>` and its commit to belong to `main`.
- Commit the version name and explicit positive Android version code before
  tagging. CI must not derive production versions from run numbers or modify and
  push source code.
- Protect an `android-release` GitHub environment with required manual approval.
  The environment gate separates tag creation from access to production secrets
  and publication.
- Run an unprivileged preflight before requesting approval. Validate the tag,
  source configuration, release history, and ordinary quality checks without
  production secrets. Only the approved job may reconstruct the signing key,
  build the production APK, or publish.
- Run the build on a pinned Ubuntu image with JDK 17. Clean-prebuild Android and
  build only the ARM64 release artifact. Keep desktop notifications and macOS file
  opening outside the headless CI build path.
- Store the encoded release JKS, passwords, alias, and least-privilege Sentry token
  as environment secrets. Decode the JKS only into temporary runner storage,
  restrict its permissions, never print secret-backed values, and delete it in an
  unconditional cleanup step.
- Before publication, inspect the APK package, ARM64 architecture, version name,
  version code, and signing certificate; compare its version code with the maximum
  code from all previously published update manifests; and generate the new update
  manifest from inspected values.
- Upload the APK and manifest to a draft, download and verify the draft assets, and
  publish only after every check passes. Never alter an existing published APK or
  manifest.
- Serialize release jobs. Give the workflow only the repository permissions it
  needs to create the release and provenance. Keep ordinary CI read-only.
- Populate the release body with GitHub-generated release notes. Release text may
  be corrected later, but binary and manifest assets are immutable.
- Pin third-party and GitHub-authored workflow actions to reviewed full commit
  SHAs. Keep ordinary CI read-only and disable OIDC unless signing later moves to
  an external key service.

## Consequences

- A release requires an intentional tag and one environment approval, but no local
  Android build, checksum generation, manifest authoring, asset upload, or USB
  installation after the initial signing migration.
- A failed workflow can leave an unpublished draft for inspection. It cannot
  partially publish an update.
- GitHub becomes a custodian of encrypted production signing credentials in
  addition to the independently backed-up offline copies.
- The initial debug-signed to release-signed migration still requires backup,
  uninstall, first installation, and restore because Android cannot update across
  unrelated signing identities.
