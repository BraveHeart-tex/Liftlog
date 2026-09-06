#!/usr/bin/env bash
set -euo pipefail

ARCHITECTURE="${1:-arm64-v8a}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"
EXPO_BIN="$PROJECT_ROOT/node_modules/.bin/expo"
OUTPUT_DIR="$ANDROID_DIR/app/build/outputs/apk/release"
VERIFY_SCRIPT="$SCRIPT_DIR/verify-android-release.sh"

notify() {
  local message="$1"

  if [[ "$(uname -s)" != "Darwin" ]] ||
    [[ -n "${CI:-}" ]] ||
    [[ ! -t 1 ]] ||
    ! command -v osascript >/dev/null 2>&1; then
    return
  fi

  osascript \
    -e "display notification \"$message\" with title \"LiftLog Android Build\" sound name \"Glass\"" \
    >/dev/null 2>&1 || true
}

on_exit() {
  local exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    notify "Release build finished successfully"

    if [[ "$(uname -s)" == "Darwin" ]] &&
      [[ -z "${CI:-}" ]] &&
      [[ -t 1 ]] &&
      [[ -d "$OUTPUT_DIR" ]] &&
      command -v open >/dev/null 2>&1; then
      open "$OUTPUT_DIR" >/dev/null 2>&1 || true
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

required_signing_variables=(
  LIFTLOG_ANDROID_KEYSTORE_PATH
  LIFTLOG_ANDROID_KEY_ALIAS
  LIFTLOG_ANDROID_STORE_PASSWORD
  LIFTLOG_ANDROID_KEY_PASSWORD
)

for variable_name in "${required_signing_variables[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "$variable_name is not set; refusing to build a release APK" >&2
    exit 1
  fi
done

if [[ ! -f "$LIFTLOG_ANDROID_KEYSTORE_PATH" ]]; then
  echo "Android release keystore does not exist at LIFTLOG_ANDROID_KEYSTORE_PATH" >&2
  exit 1
fi

if [[ "$ARCHITECTURE" != "arm64-v8a" ]]; then
  echo "LiftLog release APKs support only arm64-v8a" >&2
  exit 1
fi

CONFIGURED_IDENTITY="$(
  cd "$PROJECT_ROOT"
  node -e '
    const config = require("./app.json").expo;
    const versionName = config?.version;
    const versionCode = config?.android?.versionCode;

    if (typeof versionName !== "string" || versionName.length === 0) {
      console.error("app.json expo.version must be a non-empty version name");
      process.exit(1);
    }

    if (!Number.isInteger(versionCode) || versionCode < 1) {
      console.error("app.json expo.android.versionCode must be a positive integer");
      process.exit(1);
    }

    if (config?.android?.package !== "com.borakaraca94.liftlog") {
      console.error("app.json expo.android.package must remain com.borakaraca94.liftlog");
      process.exit(1);
    }

    process.stdout.write(`${versionName}\t${versionCode}`);
  '
)"
IFS=$'\t' read -r CONFIGURED_VERSION_NAME CONFIGURED_VERSION_CODE <<<"$CONFIGURED_IDENTITY"

echo "Building LiftLog Android release"
echo "Package: com.borakaraca94.liftlog"
echo "Architecture: $ARCHITECTURE"
echo "Version: $CONFIGURED_VERSION_NAME ($CONFIGURED_VERSION_CODE)"

export LIFTLOG_ANDROID_RELEASE_BUILD=1
export NODE_ENV=production

cd "$PROJECT_ROOT"

"$EXPO_BIN" prebuild --clean --platform android

if [[ ! -x "$ANDROID_DIR/gradlew" ]]; then
  echo "Expected executable Gradle wrapper at $ANDROID_DIR/gradlew" >&2
  exit 1
fi

cd "$ANDROID_DIR"

./gradlew :app:assembleRelease \
  -PreactNativeArchitectures="$ARCHITECTURE" \
  -Pandroid.enableMinifyInReleaseBuilds=true \
  -Pandroid.enableShrinkResourcesInReleaseBuilds=true

"$VERIFY_SCRIPT" "$OUTPUT_DIR/app-release.apk"
