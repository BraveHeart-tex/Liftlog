#!/usr/bin/env bash
set -euo pipefail

ARCHITECTURE="${1:-arm64-v8a}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
EXPO_BIN="$PROJECT_ROOT/node_modules/.bin/expo"
OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/apk/release"
ENV_FILE="$PROJECT_ROOT/.env.local"

notify() {
  local message="$1"

  osascript \
    -e "display notification \"$message\" with title \"LiftLog Android Build\" sound name \"Glass\"" \
    >/dev/null 2>&1 || true
}

on_exit() {
  local exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    notify "Release build finished successfully"
    open "$OUTPUT_DIR"
  else
    notify "Release build failed with exit code $exit_code"
  fi
}

trap on_exit EXIT

if [[ ! -x "$EXPO_BIN" ]]; then
  echo "Expected executable Expo CLI at $EXPO_BIN" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "SENTRY_AUTH_TOKEN is not set" >&2
  exit 1
fi

"$EXPO_BIN" prebuild --clean --platform android

if [[ ! -x "$ANDROID_DIR/gradlew" ]]; then
  echo "Expected executable Gradle wrapper at $ANDROID_DIR/gradlew" >&2
  exit 1
fi

cd "$ANDROID_DIR"

./gradlew clean
./gradlew :app:assembleRelease \
  -PreactNativeArchitectures="$ARCHITECTURE" \
  -Pandroid.enableMinifyInReleaseBuilds=true \
  -Pandroid.enableShrinkResourcesInReleaseBuilds=true