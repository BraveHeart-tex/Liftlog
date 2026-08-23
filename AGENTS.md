# Agent instructions

## Scope and working rules

- Treat this as a mobile Expo/React Native app. Keep changes compatible with native platforms; use no DOM or browser-only APIs.
- Honor `.codexignore` before broad discovery. Keep the smallest working change: preserve existing patterns and avoid unrelated refactors, new abstractions, or production dependencies unless explicitly approved.
- Generated artifacts are outputs, not edit targets. Change source schema and tooling inputs; never hand-edit Drizzle migrations, snapshots, generated SQL, or other generated files.
- Configure Expo audio mode once at the app/provider boundary. Leaf components only control their own players; they do not call `setAudioModeAsync` or `setIsAudioActiveAsync`.

## Agent problem log

When a tool, script, command, or other agent-facing operation causes a non-trivial retry, workaround, escalation, or blocker, read and follow [`docs/agent-problems.md`](docs/agent-problems.md). Append a sanitized entry as soon as the problem is understood and before the final handoff.

## Documentation routing

Read the applicable document before changing its subsystem. These documents are reference rules; this file owns the shared workflow and validation.

| Change                                                                                  | Read                                               |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Gorhom sheets, sheet keyboard behavior, sheet state, or sheet-safe content              | [`docs/bottom-sheet.md`](docs/bottom-sheet.md)     |
| Queries, repositories, live reads, database observability, or data ownership            | [`docs/data-access.md`](docs/data-access.md)       |
| SQLite lifecycle, Drizzle setup, schema, or migrations                                  | [`docs/database.md`](docs/database.md)             |
| `Screen`, safe areas, scrolling, keyboard handling, or fixed footers                    | [`docs/layout.md`](docs/layout.md)                 |
| NativeWind, theme tokens, typography, inputs, or styled third-party controls            | [`docs/styling.md`](docs/styling.md)               |
| Workout logging UX, audio feedback, or compact data display                             | [`docs/ux-display.md`](docs/ux-display.md)         |
| Expo Router navigation or route history                                                 | [`docs/expo-router.md`](docs/expo-router.md)       |
| Any animation, transition, loading indicator, gesture animation, or programmatic scroll | [`docs/reduced-motion.md`](docs/reduced-motion.md) |

## Validation

After a code change, run every applicable check below; choose the narrowest relevant test command and report exact failures.

- TypeScript: `./node_modules/.bin/tsc --noEmit --project ./tsconfig.json`
- JavaScript/TypeScript/TSX: `./node_modules/.bin/eslint <changed-files>`; use `./node_modules/.bin/eslint .` for broad changes.
- Formatting-sensitive changes: `./node_modules/.bin/prettier --check <changed-files>`; use `./node_modules/.bin/prettier --check .` for broad changes.
- Logic or behavior: `pnpm run test`; use the repository's documented test script and its supported test selection options.
- Database/schema changes: run the existing database checks; never generate or rewrite migrations or snapshots unless explicitly requested.
- Any source change: `graphify update .`

Use direct project-local commands for validation. Commands that can run longer than a normal tool wait, need live progress, use a TTY, create IPC, or spawn child/daemon processes should run with inherited stdout/stderr and their original exit code. Fix failures caused by the change. Report unrelated or unavailable checks without claiming they passed.

## Agent-safe command execution

- Use direct project-local binaries for short, bounded checks and package scripts for project workflows.
- Run long-running builds/tests, Graphify, Expo/native commands, quiet commands, and anything that starts workers or daemons with inherited stdout/stderr and the original exit code.
- If a command produces no result after a reasonable wait, do not repeat the same invocation. Retry the equivalent direct command with live output, then inspect the raw failure.
- `EPERM` from TSX IPC or Graphify AST/cache work is a sandbox capability issue, not a JavaScript diagnosis. Retry with the approved elevated execution path and record the workaround in `docs/agent-problems.md`.
- Quote Expo Router paths and other shell paths containing parentheses, spaces, or glob characters.
- For any programmatic agent hook, configure the host hook timeout and keep the hook fail-open. A hook must never be allowed to block the underlying tool indefinitely.

## Graphify

When the user invokes `/graphify`, follow the installed graphify skill first. For codebase questions, query the existing `graphify-out/graph.json` before browsing broadly:

- `graphify query "<question>"` for scoped context
- `graphify path "<A>" "<B>"` for relationships
- `graphify explain "<concept>"` for one concept

Dirty `graphify-out/` files are expected during updates. Use `graphify-out/wiki/index.md` for broad navigation when present; read `GRAPH_REPORT.md` only when the query does not provide enough context. After source changes, keep the graph current with `graphify update .`.
