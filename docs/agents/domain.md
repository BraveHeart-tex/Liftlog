# Domain docs

How engineering skills should consume this repo's domain documentation when exploring the codebase.

## Configured layout

This is a single-context repo:

- `CONTEXT.md` at the repo root
- System-wide ADRs under `docs/adr/`

These files are created lazily when domain terms or decisions are resolved.

## Before exploring, read these

- `CONTEXT.md` at the repo root
- Relevant ADRs under `docs/adr/`

If these files don't exist, proceed silently. Don't flag their absence or suggest creating them upfront. The `/domain-modeling` skill, reached through `/grill-with-docs` and `/improve-codebase-architecture`, creates them lazily when terms or decisions are resolved.

## File structure

```text
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-example-decision.md
│   └── 0002-another-decision.md
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept, such as in an issue title, refactor proposal, hypothesis, or test name, use the term defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the needed concept isn't in the glossary, reconsider whether the language belongs to the project or note the gap for `/domain-modeling`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly instead of silently overriding it:

> _Contradicts ADR-0007, but worth reopening because..._
