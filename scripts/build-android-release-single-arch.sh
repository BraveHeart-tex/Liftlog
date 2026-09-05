#!/usr/bin/env bash
set -euo pipefail

ARCHITECTURE="${1:-arm64-v8a}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
EXPO_BIN="$PROJECT_ROOT/node_modules/.bin/expo"
OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/apk/release"

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

    if [[ -d "$OUTPUT_DIR" ]]; then
      open "$OUTPUT_DIR"
    fi
  else
    notify "Release build failed with exit code $exit_code"
  fi
}

trap on_exit EXIT

if [[ ! -x "$EXPO_BIN" ]]; then
  echo "Expected executable Expo CLI at $EXPO_BIN" >&2
  exit 1
fi

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "SENTRY_AUTH_TOKEN is not set" >&2
  exit 1
fi

required_signing_vars=(
  LIFTLOG_ANDROID_KEYSTORE_PATH
  LIFTLOG_ANDROID_KEY_ALIAS
  LIFTLOG_ANDROID_STORE_PASSWORD
  LIFTLOG_ANDROID_KEY_PASSWORD
)

for variable_name in "${required_signing_vars[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "$variable_name is not set; refusing to build an unsigned/debug-signed release APK" >&2
    exit 1
  fi
done

if [[ ! -f "$LIFTLOG_ANDROID_KEYSTORE_PATH" ]]; then
  echo "Android release keystore does not exist at LIFTLOG_ANDROID_KEYSTORE_PATH" >&2
  exit 1
fi

if [[ -z "${LIFTLOG_ANDROID_VERSION_CODE:-}" ]] ||
  [[ ! "$LIFTLOG_ANDROID_VERSION_CODE" =~ ^[1-9][0-9]*$ ]]; then
  echo "LIFTLOG_ANDROID_VERSION_CODE must be a positive integer" >&2
  exit 1
fi

CONFIGURED_VERSION_CODE="$(
  cd "$PROJECT_ROOT"
  node -e "
    const config = require('./app.json');
    const versionCode = config?.expo?.android?.versionCode;

    if (!Number.isInteger(versionCode) || versionCode < 1) {
      console.error('app.json expo.android.versionCode must be a positive integer');
      process.exit(1);
    }

    process.stdout.write(String(versionCode));
  "
)"

if ((LIFTLOG_ANDROID_VERSION_CODE <= CONFIGURED_VERSION_CODE)); then
  echo "LIFTLOG_ANDROID_VERSION_CODE must be higher than app.json android.versionCode ($CONFIGURED_VERSION_CODE)" >&2
  exit 1
fi

case "$ARCHITECTURE" in
  arm64-v8a | armeabi-v7a | x86 | x86_64)
    ;;
  *)
    echo "Unsupported Android architecture: $ARCHITECTURE" >&2
    exit 1
    ;;
esac

echo "Building LiftLog Android release"
echo "Architecture: $ARCHITECTURE"
echo "Version code: $LIFTLOG_ANDROID_VERSION_CODE"

export LIFTLOG_ANDROID_RELEASE_BUILD=1
export NODE_ENV=production

cd "$PROJECT_ROOT"

"$EXPO_BIN" prebuild \
  --clean \
  --platform android

if [[ ! -x "$ANDROID_DIR/gradlew" ]]; then
  echo "Expected executable Gradle wrapper at $ANDROID_DIR/gradlew" >&2
  exit 1
fi

cd "$ANDROID_DIR"

./gradlew :app:assembleRelease \
  -PreactNativeArchitectures="$ARCHITECTURE" \
  -PandroidVersionCode="$LIFTLOG_ANDROID_VERSION_CODE" \
  -Pandroid.enableMinifyInReleaseBuilds=true \
  -Pandroid.enableShrinkResourcesInReleaseBuilds=true
