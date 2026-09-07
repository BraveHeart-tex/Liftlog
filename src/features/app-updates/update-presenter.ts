import type { UpdateState } from './update.types';
import type { UpdateAttemptState } from './update-attempt-coordinator';

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
        }).format(
          state.release.sizeBytes / BYTES_PER_MEGABYTE
        )} MB (${new Intl.NumberFormat('en-US').format(state.release.sizeBytes)} bytes)`
      : undefined,
    message:
      state.status === 'up_to_date'
        ? 'LiftLog is up to date.'
        : state.error
          ? errorMessages[state.error.code]
          : undefined
  };
}

export function presentUpdateAttempt(state: UpdateAttemptState): {
  message?: string;
  action?: 'cancel' | 'retry' | 'permission';
} {
  if (state.status === 'downloading') {
    const written = new Intl.NumberFormat('en-US').format(
      state.bytesDownloaded ?? 0
    );
    const total = new Intl.NumberFormat('en-US').format(state.totalBytes ?? 0);

    return {
      message: `Downloading update - ${Math.round((state.progress ?? 0) * 100)}% (${written} of ${total} bytes)`,
      action: 'cancel'
    };
  }

  if (state.status === 'verifying') {
    return { message: 'Verifying update...', action: 'cancel' };
  }

  if (state.status === 'staging') {
    return { message: 'Preparing installer...', action: 'cancel' };
  }

  if (state.status === 'installer') {
    return {
      message: 'Continue in Android to install the update.',
      action: undefined
    };
  }

  if (state.status === 'permission') {
    return {
      message: 'Allow LiftLog to install updates, then return here.',
      action: 'permission'
    };
  }

  if (state.status === 'interrupted') {
    return {
      message: 'Update interrupted. Retry starts from the beginning.',
      action: 'retry'
    };
  }

  if (state.status === 'succeeded') {
    return { message: 'Update installed successfully.', action: undefined };
  }

  if (state.status === 'cancelled') {
    return { message: 'Update cancelled.', action: 'retry' };
  }

  if (state.status === 'failed') {
    const blocked = {
      active_workout: 'Finish or discard your active workout before updating.',
      transient_workout_edit:
        'Save or discard your workout edits before updating.',
      update_in_progress: 'Another update attempt is already active.',
      not_ready: 'Update status is still loading. Try again shortly.',
      permission_required: 'Allow LiftLog to install updates, then try again.',
      stale_attempt: 'The update attempt changed. Start again.',
      version_changed: 'The installed version changed. Check for updates again.'
    } as const;

    return {
      message:
        (state.blockReason && blocked[state.blockReason]) ||
        failureMessage(state.errorCode),
      action: 'retry'
    };
  }

  return {};
}

function failureMessage(code?: string) {
  const messages: Record<string, string> = {
    UPDATER_STORAGE_FAILURE: 'Not enough storage to prepare the update.',
    UPDATER_SIZE_MISMATCH: 'The downloaded update has the wrong size.',
    UPDATER_HASH_MISMATCH: 'The downloaded update could not be verified.',
    UPDATER_PACKAGE_MISMATCH: 'The downloaded package is not LiftLog.',
    UPDATER_VERSION_MISMATCH: 'The downloaded update has the wrong version.',
    UPDATER_CERTIFICATE_MISMATCH:
      'The downloaded update has an invalid signature.',
    UPDATER_INSTALL_BLOCKED: 'Android blocked the installation.'
  };

  return (code && messages[code]) || 'Could not install the update. Try again.';
}
