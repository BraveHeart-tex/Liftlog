# AGENTS.md

- Honor `.codexignore` before broad discovery.
- Keep changes small; no unapproved production dependencies, unrelated refactors, or needless abstractions.
- Mobile React Native only; no DOM, browser, or web-only assumptions.
- After logic changes, run relevant checks and report failures.
- Never hand-edit generated files, Drizzle migrations/snapshots, or generated SQL.
- Read `/docs` only for touched subsystems: `bottom-sheet`, `data-access`, `database`, `layout`, `styling`, `ux-display`, `expo-router`.
- Expo audio: configure app audio mode once at app level; no leaf `setAudioModeAsync`/`setIsAudioActiveAsync`.

## Validation

After modifying code, run the smallest relevant validation set before finishing.

- TypeScript changes: run `rtk tsc --noEmit --project ./tsconfig.json`.
- JS/TS/TSX changes: run `rtk lint`.
- Formatting-sensitive changes: run `rtk prettier --check .`.
- Logic or behavior changes: run the relevant tests with `rtk test <command>`. Use `rtk test pnpm run test` when the change is broad or no narrower test command is appropriate.
- Database/schema changes: run the applicable existing database checks, but never generate, edit, or rewrite migrations/snapshots unless explicitly requested.
- After code changes, run `graphify update .`.

Do not use `rtk timeout` or invent validation commands. Prefer RTK's native wrappers (`rtk tsc`, `rtk lint`, `rtk prettier`, `rtk test`) for compact output.

Validation failures:

- Fix failures caused by your changes.
- Do not fix unrelated pre-existing failures.
- If a check cannot run or fails for an unrelated reason, report the exact command and concise reason.
- Do not claim validation passed unless the command completed successfully.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
