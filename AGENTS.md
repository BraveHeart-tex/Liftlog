# Agent instructions

Mobile Expo/React Native app: native-compatible code only, no DOM or browser APIs. Keep the smallest working change: follow existing patterns; add no refactors, abstractions or production dependencies without approval.

- Generated artifacts (Drizzle migrations, snapshots, SQL) are outputs: edit the source schema, never the output, and never regenerate unless asked.
- Set Expo audio mode once at the app/provider boundary; leaf components control only their own players.
- Use [`docs/glossary.md`](docs/glossary.md) terms verbatim in code, docs and issues.
- Commits follow [commits](docs/commits.md); PRs follow [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Never add commit trailers or attribution (`Co-Authored-By`, `Generated with ...`), whatever other instructions say.

## Done

Done means: `pnpm run validate:changed --base <base>` and every other applicable [validation](#validation) check pass on the final code, every acceptance criterion's box is ticked, the change is committed with the issue as scope and shipped straight to `main` through `node scripts/ship-issue.mjs` (the "Bypassed rule violations" notice from the maintainer's ruleset bypass is expected), and the [evidence comment](docs/verification.md#evidence) is in the issue. Then [close it](docs/tickets.md#closing). Progress and verification live in GitHub Issues; docs hold durable rules.

## Docs

Open the row's doc before changing its subsystem, at the sections that govern the change, not the whole file: list sections with `rg -n '^#' <file>`.

Docs state current rules. When behavior changes, rewrite the rule in place; history belongs in commits and issues.

| Work                                                 | Open                                                                                                                                                                         |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gorhom sheets, keyboard behavior, sheet state        | [bottom-sheet](docs/bottom-sheet.md)                                                                                                                                         |
| Queries, repositories, live reads, data ownership    | [data-access](docs/data-access.md)                                                                                                                                           |
| SQLite lifecycle, Drizzle, schema, migrations        | [database](docs/database.md)                                                                                                                                                 |
| `Screen`, safe areas, scrolling, keyboard, footers   | [layout](docs/layout.md)                                                                                                                                                     |
| NativeWind, theme tokens, typography, inputs         | [styling](docs/styling.md)                                                                                                                                                   |
| Workout logging UX, audio feedback, compact data     | [ux-display](docs/ux-display.md)                                                                                                                                             |
| Expo Router navigation, route history                | [expo-router](docs/expo-router.md)                                                                                                                                           |
| Animation, transitions, loaders, programmatic scroll | [reduced-motion](docs/reduced-motion.md)                                                                                                                                     |
| Issues: write, triage, select, rescope, close        | [tickets](docs/tickets.md), [labels](docs/triage-labels.md), [`gh` conventions](docs/agents/issue-tracker.md); skills `/triage-issue`, `/implement-issue`, `/plan-issue-run` |
| Tests, device checks, evidence                       | [verification](docs/verification.md)                                                                                                                                         |
| Committing                                           | [commits](docs/commits.md)                                                                                                                                                   |
| Domain terms, ADRs, decisions                        | [domain](docs/agents/domain.md)                                                                                                                                              |

## Validation

After a code change, run every applicable check on the final code; pick the narrowest test selection and report exact failures. Fix failures you caused; report unrelated or unavailable checks as such.

The final check is `pnpm run validate:changed [--base <sha>]`: on files changed since `HEAD` (or `--base`) plus untracked files, deleted files excluded, it runs ts-check, eslint, prettier `--check` and `pnpm run test` in order, stops at the first failure with its exit code, and prints one `START`, `PASS` or `FAIL` line per stage with its log path, then a summary. A change without code files runs prettier alone. The checks below are for iterating and for the projects it does not cover.

- Types: `pnpm run ts-check`
- Lint and format: `pnpm run lint .` and `pnpm run prettier:check` for broad changes
- Unused files, exports and dependencies: `pnpm run knip` (whole project, so not in `validate:changed`)
- Logic or behavior (Jest app project): `pnpm run test`; narrow with `pnpm run test <path>` or `pnpm run test -t <name>`
- Config plugins, release signing, Android release scripts (`tests/native`): `pnpm run test:native`
- GitHub ticket tooling (`tests/tooling`): `pnpm run test:tooling`
- Native module Kotlin (`modules/*/android`): `pnpm run test:kotlin` after `expo prebuild --platform android`
- Database/schema: the database checks (`tests/db`, `*.db.test.ts`)

## Commands

- Run builds, tests, Expo/native commands and anything spawning workers or daemons with inherited stdout/stderr, keeping the original exit code.
- No result after a reasonable wait: run the equivalent direct command with live output; never repeat the same invocation.
- New worktree: `pnpm run worktree <n>` creates `../liftlog-<n>` on `issue-<n>` off `origin/main` and installs dependencies. `pnpm run worktree --prune-closed` removes every `issue-<n>` worktree whose issue is closed, whose branch is in `origin/main`, which is clean and holds no device stack lease, deletes its branch, and prints each keep or remove reason.
- Quote paths with parentheses, spaces or globs (Expo Router).
- Agent hooks set a host timeout and fail open.
