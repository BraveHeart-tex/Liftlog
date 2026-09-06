import type { UpdateState } from './update.types';

const MAX_RELEASE_NOTES_LENGTH = 4_000;

export function presentUpdateState(state: UpdateState) {
  const releaseNotes = state.release?.releaseNotes;
  const cappedNotes = releaseNotes
    ? releaseNotes.length > MAX_RELEASE_NOTES_LENGTH
      ? `${releaseNotes.slice(0, MAX_RELEASE_NOTES_LENGTH)}\u2026`
      : releaseNotes
    : undefined;

  const errorMessages = {
    offline: 'Check your connection and try again.',
    rate_limited: 'GitHub rate limit reached. Try again later.',
    malformed_release: 'The latest release is malformed. Try again later.',
    check_failed: 'Could not check for updates. Try again.'
  } as const;

  return {
    installedVersion: state.installedVersion,
    availableVersion: state.release?.versionName,
    releaseNotes: cappedNotes,
    size: state.release
      ? `${new Intl.NumberFormat('en-US').format(state.release.sizeBytes)} bytes`
      : undefined,
    message:
      state.status === 'up_to_date'
        ? 'LiftLog is up to date.'
        : state.error
          ? errorMessages[state.error.code]
          : undefined
  };
}
