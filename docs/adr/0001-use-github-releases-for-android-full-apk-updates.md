# ADR-0001: Use GitHub Releases for Android full APK updates

- Status: Accepted
- Date: 2026-09-06

## Context

LiftLog is directly distributed as an Android APK. Users need to discover,
download, and install new versions from inside the app while retaining Android's
native permission and installation prompts.

An earlier plan and the `feat/ota-updates` branch are non-authoritative design and
prototype inputs. Their contents must be validated against the decisions recorded
through the current design interview and the current main branch.

## Decision

- Implement a full APK updater for direct-distribution Android builds, backed by
  public GitHub Releases.
- Keep v1 outside Google Play. Isolate the updater so a future Play build can
  exclude the sideload installer permission and use a store-supported update flow.
- Deliberately use Android's user-confirmed package installation flow. Do not
  request installation without user action or promise silent installation.
- Make updates optional. Automatic checks run at most once every 24 hours, manual
  checks bypass that throttle, and Later suppresses automatic prompts for the
  dismissed version.
- Do not include an unenforced mandatory-update field in the v1 release contract.
- Prevent a full APK update and an active workout from executing concurrently.
  Historical workout drafts are outside this exclusion unless implementation
  discovery finds unrecoverable transient edits.
- Move release builds to a dedicated, backed-up signing key. Existing debug-signed
  installations require a one-time backup, uninstall, release-signed installation,
  and restore procedure. LiftLog must never automate that uninstall.
- Audit and selectively reuse the updater prototype. Do not merge its divergent
  branch wholesale.

## Consequences

- Android owns final APK validation, user consent, and installation status.
- The updater cannot be shipped unchanged through Google Play.
- Every future APK update must preserve the application ID and signing lineage and
  use a higher Android version code.
- Installation may replace the running process, so updater state must survive a
  restart and reconcile with the installed build.
- The personal-use distribution supports ARM64 devices only. Supporting another
  architecture requires an explicit future decision and additional validation.
