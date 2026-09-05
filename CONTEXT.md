# Domain context

## Application updates

- **Full APK update**: An Android application-binary update. LiftLog downloads a
  signed APK and asks Android's package installer to replace the installed app.
  This is distinct from an Expo or JavaScript OTA update.
- **Direct-distribution build**: An Android build installed outside an app store
  and updated from LiftLog's public GitHub Releases channel.
- **Update release**: A published, stable GitHub Release containing the APK and
  its machine-readable release metadata. Drafts and prereleases are not update
  releases.
- **Update manifest**: The `update.json` asset in an update release. It identifies
  the exact APK and describes its version, byte size, and checksum. It never
  supplies an arbitrary download URL.
- **Update exclusion**: The mutual-exclusion rule preventing an application
  update and an active workout from starting or executing at the same time.
- **Active workout**: A persisted workout whose status is `in_progress`. A
  historical workout draft is not an active workout.
- **Update attempt**: The user-initiated permission, download, verification, and
  installer-commit lifecycle protected by update exclusion.
- **Installer request**: A committed Android package-installer session. It is not
  proof that the update succeeded; success requires reconciliation against the
  installed native version.
- **Transient workout edit**: Workout input currently held only by a mounted editor
  and not yet committed to SQLite. Unlike a persisted historical draft, it must be
  resolved before an update attempt can begin.
