# ADR-0005: Use a backward-compatible update discovery contract

- Status: Accepted
- Date: 2026-09-06

## Context

Direct-distribution clients query a public GitHub repository without embedded
credentials. Old installed clients must remain able to discover the release that
updates their own updater implementation, even if a later manifest format adds new
capabilities.

## Decision

- Query GitHub's public latest-stable-release endpoint without an embedded token.
  Use persisted ETags and conditional requests.
- Limit automatic checks to once every 24 hours. Manual checks bypass the time
  throttle but still use conditional HTTP caching. Do not loop on rate limits.
- Define `update.json` with `schemaVersion: 1`. Require its v1 fields, accept
  unknown additive fields, and reject an unknown schema version safely.
- Keep `update.json` compatible with v1 clients while any may remain installed. A
  future breaking contract uses a separately named manifest and retains a valid v1
  manifest through the transition.
- Capture unexpected updater failures with a stable error code, lifecycle stage,
  Android API level, manifest schema, and HTTP status class.
- Do not report expected Later, Cancel, permission refusal, or ordinary foreground
  interruption as errors.
- Never attach release notes, local paths, GitHub redirect URLs, signing material,
  workout data, or user-entered values to updater diagnostics.

## Consequences

- Check and dismissal metadata need persisted repository ownership, including the
  cached release identity and ETag.
- Manifest evolution is additive by default. Breaking changes require a deliberate
  compatibility window rather than silently abandoning installed clients.
- Public GitHub API rate limits remain a known operational constraint, but daily
  caching makes an authenticated token inappropriate for the personal-use client.
