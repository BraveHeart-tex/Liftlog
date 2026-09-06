#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
APK_PATH="${1:-$PROJECT_ROOT/android/app/build/outputs/apk/release/app-release.apk}"
ANDROID_SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"

fail() {
  echo "$1" >&2
  exit 1
}

if [[ ! -f "$APK_PATH" ]]; then
  fail "Release APK does not exist"
fi

if [[ -z "${AAPT_BIN:-}" ]] || [[ -z "${APKSIGNER_BIN:-}" ]]; then
  if [[ -z "$ANDROID_SDK" ]]; then
    fail "ANDROID_SDK_ROOT or ANDROID_HOME is required to locate Android build tools"
  fi

  for candidate in "$ANDROID_SDK"/build-tools/*/aapt; do
    if [[ -x "$candidate" ]]; then
      AAPT_BIN="$candidate"
    fi
  done

  for candidate in "$ANDROID_SDK"/build-tools/*/apksigner; do
    if [[ -x "$candidate" ]]; then
      APKSIGNER_BIN="$candidate"
    fi
  done
fi

AAPT_BIN="${AAPT_BIN:-}"
APKSIGNER_BIN="${APKSIGNER_BIN:-}"
UNZIP_BIN="${UNZIP_BIN:-unzip}"

if [[ ! -x "$AAPT_BIN" ]]; then
  fail "Could not find an executable aapt Android build tool"
fi

if [[ ! -x "$APKSIGNER_BIN" ]]; then
  fail "Could not find an executable apksigner Android build tool"
fi

CONFIGURED_IDENTITY="$(
  cd "$PROJECT_ROOT"
  node -e '
    const app = require("./app.json").expo;
    const release = require("./config/android-release.json");

    process.stdout.write([
      app.android.package,
      app.version,
      app.android.versionCode,
      release.certificateSha256
    ].join("\t"));
  '
)"
IFS=$'\t' read -r EXPECTED_PACKAGE EXPECTED_VERSION_NAME EXPECTED_VERSION_CODE EXPECTED_CERTIFICATE <<<"$CONFIGURED_IDENTITY"

PACKAGE_LINE="$($AAPT_BIN dump badging "$APK_PATH" | sed -n '/^package: /p' | head -n 1)"
ACTUAL_PACKAGE="$(sed -n "s/^package: name='\([^']*\)'.*/\1/p" <<<"$PACKAGE_LINE")"
ACTUAL_VERSION_NAME="$(sed -n "s/.*versionName='\([^']*\)'.*/\1/p" <<<"$PACKAGE_LINE")"
ACTUAL_VERSION_CODE="$(sed -n "s/.*versionCode='\([^']*\)'.*/\1/p" <<<"$PACKAGE_LINE")"

if [[ "$ACTUAL_PACKAGE" != "$EXPECTED_PACKAGE" ]]; then
  fail "Release APK package does not match app.json"
fi

if [[ "$ACTUAL_VERSION_NAME" != "$EXPECTED_VERSION_NAME" ]]; then
  fail "Release APK version name does not match app.json"
fi

if [[ "$ACTUAL_VERSION_CODE" != "$EXPECTED_VERSION_CODE" ]]; then
  fail "Release APK version code does not match app.json"
fi

ACTUAL_ABIS="$($UNZIP_BIN -Z1 "$APK_PATH" | sed -n 's#^lib/\([^/]*\)/.*#\1#p' | sort -u)"

if [[ "$ACTUAL_ABIS" != "arm64-v8a" ]]; then
  fail "Release APK must contain only the arm64-v8a ABI"
fi

ACTUAL_CERTIFICATE="$($APKSIGNER_BIN verify --print-certs "$APK_PATH" | sed -n 's/^Signer #1 certificate SHA-256 digest: //p' | head -n 1)"
NORMALIZED_ACTUAL_CERTIFICATE="$(tr '[:lower:]' '[:upper:]' <<<"${ACTUAL_CERTIFICATE//:/}" | tr -d '[:space:]')"
NORMALIZED_EXPECTED_CERTIFICATE="$(tr '[:lower:]' '[:upper:]' <<<"${EXPECTED_CERTIFICATE//:/}" | tr -d '[:space:]')"

if [[ "$NORMALIZED_ACTUAL_CERTIFICATE" != "$NORMALIZED_EXPECTED_CERTIFICATE" ]]; then
  fail "Release APK certificate SHA-256 does not match config/android-release.json (expected: $EXPECTED_CERTIFICATE; actual: ${ACTUAL_CERTIFICATE:-missing})"
fi

echo "Verified production release APK"
echo "Package: $ACTUAL_PACKAGE"
echo "Architecture: $ACTUAL_ABIS"
echo "Version: $ACTUAL_VERSION_NAME ($ACTUAL_VERSION_CODE)"
echo "Certificate SHA-256: $EXPECTED_CERTIFICATE"
