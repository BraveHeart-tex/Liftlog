# Agent problem log

Use this log when a tool, script, command, or other agent-facing operation causes a non-trivial retry, workaround, escalation, or blocker.

## Logging procedure

1. Understand the symptom well enough to describe what happened.
2. Append a sanitized entry immediately, before the task's final handoff. Keep the newest entry first.
3. Record the smallest reproducible tool invocation. Redact secrets, credentials, private paths, private user data, and sensitive arguments.
4. Include the problem whether it is resolved or unresolved. Keep the entry in the same working branch and include it in the same commit or merge request when one is being prepared.
5. If the append itself fails, make a best-effort attempt, complete the requested task when possible, and report the logging failure in the final handoff.

Log incidents that require a retry, changed invocation, workaround, escalation, or leave work blocked. Include failures from any materially involved agent-facing tool, not only shell commands. Routine expected test failures and trivial one-off typos do not need entries.

## Entry format

Use a date-based heading with the local date in `YYYY-MM-DD`. Use `N/A` when a required field does not apply.

```md
## YYYY-MM-DD — Short problem title

- Context:
- Tool/command:
- Symptom:
- Cause:
- Workaround:
- Status:
- Validation impact:
```

Use one of these status values:

- `resolved`: the root cause was fixed during the task.
- `workaround`: progress continued, but the underlying issue remains.
- `blocked`: no safe path forward was available.

## Example

## 2026-08-22 — Full formatting check timed out

- Context: Documentation-only change validation.
- Tool/command: `rtk prettier --check .`
- Symptom: The full-repository check exceeded the available command wait and produced no completion result.
- Cause: The root cause was not confirmed.
- Workaround: Ran `rtk prettier --check AGENTS.md docs/index.md docs/agent-problems.md` to validate the changed Markdown files.
- Status: `workaround`
- Validation impact: Targeted Markdown validation completed; the full-repository check remained incomplete.

## Entries

## 2026-08-23 — Graph refresh sandbox restriction during header action move

- Context: Refreshing Graphify after moving Steps actions into the native header.
- Tool/command: `rtk graphify update .`
- Symptom: The in-sandbox refresh failed with `Operation not permitted` during AST rebuild.
- Cause: Graphify required filesystem access restricted by the sandbox.
- Workaround: Re-ran the same update with approved elevated filesystem access; it rebuilt the code graph successfully.
- Status: workaround
- Validation impact: Graphify completed with existing warnings for source files producing zero nodes and a changed community set.

## 2026-08-23 — Graph refresh sandbox restriction during Steps redesign

- Context: Refreshing Graphify after the Steps dashboard source changes.
- Tool/command: `rtk graphify update .`
- Symptom: The in-sandbox refresh failed with `Operation not permitted` during AST rebuild.
- Cause: Graphify required filesystem access restricted by the sandbox.
- Workaround: Re-ran the same update with approved elevated filesystem access; it rebuilt the code graph successfully.
- Status: workaround
- Validation impact: Graphify completed with existing warnings for source files producing zero nodes and a changed community set.

## 2026-08-23 — Broad test wrapper stalled during Steps redesign validation

- Context: Running the required behavior check after the connected Steps dashboard redesign.
- Tool/command: `rtk test pnpm run test`
- Symptom: The wrapper produced no output after about 90 seconds and was interrupted.
- Cause: The wrapper execution path did not expose a diagnostic or completion.
- Workaround: None; targeted TypeScript, ESLint, and Prettier checks passed.
- Status: workaround
- Validation impact: Broad tests remain unverified.

## 2026-08-23 — Lint wrapper stalled during Steps redesign validation

- Context: Validating the connected Steps dashboard redesign.
- Tool/command: `rtk lint`
- Symptom: The wrapper produced no output after about 60 seconds and was interrupted.
- Cause: The wrapper execution path did not expose a diagnostic or completion.
- Workaround: Ran repository-local ESLint against the changed Steps files.
- Status: workaround
- Validation impact: Full `rtk lint` remains unavailable; targeted local lint passed.

## 2026-08-23 — Graph refresh sandbox restriction

- Context: Refreshing Graphify after the Log route and calendar source changes.
- Tool/command: `rtk graphify update .`
- Symptom: The in-sandbox refresh failed with `Operation not permitted` during AST rebuild.
- Cause: Graphify required filesystem access restricted by the sandbox.
- Workaround: Re-ran the same update with approved elevated filesystem access; it rebuilt the code graph successfully.
- Status: workaround
- Validation impact: Graphify completed with existing warnings for source files producing zero nodes and a changed community set.

## 2026-08-23 — Test wrapper stalled during Log redesign validation

- Context: Running the required broad test command after route and calendar behavior changes.
- Tool/command: `rtk test pnpm run test`
- Symptom: The wrapper produced no output and did not complete after four 30-second waits; it was interrupted.
- Cause: The test wrapper exposed no diagnostic or completion.
- Workaround: None; no focused tests cover the changed screen/calendar surface.
- Status: workaround
- Validation impact: Broad tests remain unverified; TypeScript and targeted local lint/format checks passed.

## 2026-08-23 — Lint wrapper stalled during Log redesign validation

- Context: Validating the new Log route and calendar controls.
- Tool/command: `rtk lint`
- Symptom: The wrapper produced no output and did not complete after two 30-second waits; it was interrupted.
- Cause: The wrapper execution path did not expose a diagnostic or completion.
- Workaround: Run repository-local ESLint against the changed TypeScript/TSX files.
- Status: workaround
- Validation impact: Full `rtk lint` remains unavailable; targeted local lint is used below.

## 2026-08-23 — Impeccable skill path lookup

- Context: Loading frontend redesign guidance before planning the Log surface.
- Tool/command: `node .agents/skills/impeccable/scripts/context.mjs ...`
- Symptom: Node reported that the project-relative skill script did not exist.
- Cause: The installed skill is hosted at `/Users/bora/.agents/skills/impeccable`, not inside the repository.
- Workaround: Retried using the absolute installed skill path from the session skill catalog.
- Status: resolved
- Validation impact: No source files changed; design guidance loading was delayed until the corrected invocation.

## 2026-08-23 — Router path inspection shell quoting

- Context: Inspecting Expo Router tab files during Log screen redesign discovery.
- Tool/command: `rg --files src/app/(tabs) | xargs ... sh -c '... path ...'`
- Symptom: The inspection command failed before reading files because paths containing parentheses were parsed by the shell.
- Cause: The generated `sh -c` invocation did not quote Expo Router path arguments safely.
- Workaround: Switched to direct, explicitly quoted file reads and targeted `rg` queries.
- Status: resolved
- Validation impact: No source files changed; route inspection continued with targeted commands.

## 2026-08-23 — Project validation wrappers stalled

- Context: Validating a small NativeWind styling change.
- Tool/command: `rtk lint`, `rtk prettier --check <changed-file>`, and `rtk pnpm exec prettier --check <changed-file>`.
- Symptom: Lint and both wrapper/package-manager checks produced no completion after about 90/30 seconds and had to be interrupted.
- Cause: The wrapper/package-manager execution path did not complete; no diagnostic output identified the root cause.
- Workaround: Ran the repository-local `./node_modules/.bin/eslint <changed-file>` and `./node_modules/.bin/prettier --check <changed-file>` directly through `rtk`.
- Status: workaround
- Validation impact: Changed-file lint and formatting checks passed; the full `rtk lint` check remains unavailable.

## 2026-08-22 — Graph refresh required elevated filesystem access

- Context: Refreshing the repository knowledge graph after documentation changes.
- Tool/command: `rtk graphify update .`
- Symptom: The rebuild failed with `Operation not permitted`.
- Cause: The sandbox prevented a graphify filesystem operation; the exact operation was not exposed.
- Workaround: Re-ran the same update with approved elevated filesystem access; the graph rebuilt successfully.
- Status: `workaround`
- Validation impact: The initial graph refresh failed; the elevated rerun completed with warnings about source files producing zero graph nodes.

## 2026-08-22 — Global Prettier wrapper referenced a missing installation

- Context: Targeted Markdown formatting validation.
- Tool/command: `rtk prettier --check AGENTS.md docs/index.md docs/agent-problems.md`
- Symptom: The command exited with failure and the wrapper reported a missing global Prettier module.
- Cause: The global wrapper pointed to a missing `<global-prettier-path>` installation.
- Workaround: Ran the repository-local `rtk pnpm exec prettier --check AGENTS.md docs/index.md docs/agent-problems.md`.
- Status: `workaround`
- Validation impact: The repository-local formatting check passed; the global wrapper remained unusable.

## Maintenance

Normal work appends entries and preserves historical facts. A deliberate maintenance task may consolidate recurring entries while preserving the original facts and recording what was consolidated.
