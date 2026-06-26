# AGENTS.md

- Honor `.codexignore` before broad discovery.
- Keep changes small; no unapproved production dependencies, unrelated refactors, or needless abstractions.
- Mobile React Native only; no DOM, browser, or web-only assumptions.
- After logic changes, run relevant checks and report failures.
- Never hand-edit generated files, Drizzle migrations/snapshots, or generated SQL.
- Read `/docs` only for touched subsystems: `bottom-sheet`, `data-access`, `database`, `layout`, `styling`, `ux-display`.
