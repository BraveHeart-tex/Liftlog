import type { UpdateState } from './update.types';

const MAX_RELEASE_NOTES_LENGTH = 4_000;
const BYTES_PER_MEGABYTE = 1024 * 1024;

function meaningfulReleaseNotes(notes?: string) {
  if (!notes) {
    return undefined;
  }

  const filteredNotes = notes
    .split('\n')
    .filter(line => !/^\s*(?:\*\*)?full changelog(?:\*\*)?\s*:/i.test(line))
    .filter(line => !/^\s*https?:\/\/\S+\/compare\/\S+\s*$/i.test(line))
    .join('\n')
    .trim();

  if (
    !filteredNotes ||
    /^#{1,6}\s+what(?:'|’)s changed\s*$/i.test(filteredNotes)
  ) {
    return undefined;
  }

  return filteredNotes;
}

export function presentUpdateState(state: UpdateState) {
  const releaseNotes = meaningfulReleaseNotes(state.release?.releaseNotes);
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
      ? `${new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 2
        }).format(state.release.sizeBytes / BYTES_PER_MEGABYTE)} MB`
      : undefined,
    message:
      state.status === 'up_to_date'
        ? 'LiftLog is up to date.'
        : state.error
          ? errorMessages[state.error.code]
          : undefined
  };
}
