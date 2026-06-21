#!/usr/bin/env bash
set -euo pipefail

ARCHITECTURE="${1:-arm64-v8a}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"

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
