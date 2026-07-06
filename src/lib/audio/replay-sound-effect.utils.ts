interface ReplayableSoundEffectPlayer {
  pause(): void;
  seekTo(position: number): Promise<void>;
  play(): void;
}

interface ReplaySoundEffectOptions {
  shouldPlay?: () => boolean;
}

const playersWithReplayInFlight = new WeakSet<ReplayableSoundEffectPlayer>();

export async function replaySoundEffect(
  player: ReplayableSoundEffectPlayer,
  options: ReplaySoundEffectOptions = {}
) {
  if (playersWithReplayInFlight.has(player)) {
    return;
  }

  playersWithReplayInFlight.add(player);

  try {
    player.pause();
    await player.seekTo(0);

    if (options.shouldPlay && !options.shouldPlay()) {
      return;
    }

    player.play();
  } finally {
    playersWithReplayInFlight.delete(player);
  }
}
