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
