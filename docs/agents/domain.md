# Domain docs

How engineering skills should consume this repo's domain documentation when exploring the codebase.

## Configured layout

This is a single-context repo:

- [`docs/glossary.md`](../glossary.md): the only source for domain terms
- System-wide ADRs under `docs/adr/`, product decisions under `docs/decisions/`

There is no root `GLOSSARY.md` or `CONTEXT.md`. When a skill such as `/domain-modeling` refers to `GLOSSARY.md`, use `docs/glossary.md` and its format: terms as `**Term**:` entries under topic subheadings, with `_Avoid_:` lines for rejected synonyms.

## Before exploring, read these

- The relevant sections of `docs/glossary.md` (list them with `rg -n '^#' docs/glossary.md`)
- Relevant ADRs under `docs/adr/` and decisions under `docs/decisions/`

## Use the glossary's vocabulary

When output names a domain concept, such as in an issue title, refactor proposal, hypothesis, or test name, use the term defined in `docs/glossary.md`. Don't drift to synonyms the glossary explicitly avoids.

If the needed concept isn't in the glossary, reconsider whether the language belongs to the project or note the gap for `/domain-modeling`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly instead of silently overriding it:

> _Contradicts ADR-0007, but worth reopening because..._
