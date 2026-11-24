# Tickets

How to write GitHub issues so an agent can finish them without guessing. The
`/triage-issue` and `/implement-issue` skills follow these rules. Labels are defined in
[triage labels](triage-labels.md); proof rules in [verification](verification.md).
Durable behavior lives in [ADRs](adr/), [decisions](decisions/) and the subsystem docs
in [AGENTS.md](../AGENTS.md#documentation-routing); an issue cites and narrows them,
never restates or changes them. A behavior change lands as a doc edit in the same
change set. Name domain concepts with [glossary](glossary.md) terms.

Use `gh` from the repo root (it targets `BraveHeart-tex/Liftlog`). Issues live in the
**LiftLog** GitHub Project
([board](https://github.com/users/BraveHeart-tex/projects/4)), which holds `Status`
(Backlog, To Do, In progress, In review, Done, Canceled) and `Priority` (Urgent, High,
Medium, Low). Its views: **Next up** (open `ready-for-agent`), **Board** (by Status),
**Triage** (open `needs-triage`, `needs-info`, `ready-for-human`) and **Roadmap**.

## Selecting work

When asked for the next task, take the top row of the Project's **Next up** view: open,
`ready-for-agent`, no open blocker, highest Priority, then lowest number. Start the
selected issue with one command:

```sh
node scripts/start-issue.mjs <n|url>
```

It refuses a closed issue or one with an open blocker, naming the reason. Otherwise it
sets the issue's Project `Status` to In progress (adding the issue to the Project
first) and prints JSON: the issue with its body and comments, `parent`, `subIssues`,
`blockedBy`, and the review baseline commit `base`. It needs the `project` scope
(`gh auth refresh -s project`).

## Shape

Each ticket is a **tracer bullet**: one narrow, complete path through the layers it
touches, proven by a test or a device check. A data slice (schema, migration,
repository) proven by real-SQLite tests is a complete tracer bullet; its screens follow
in their own ticket. A native slice proven by module tests and a device check is
complete without the JavaScript UI that later uses it. A shared primitive ships with
the first screen that uses it. Each ticket fits one fresh context window: the
[size limits](#size) decide, not the length of the description.

## Template

```markdown
## What to build

The behaviour from the user's side in at most 150 words, linking the ADR, decision or
doc section it implements by its heading anchor.

## Rules

- [Sheet shape](docs/bottom-sheet.md#choose-the-sheet-shape) - only what this ticket narrows

## Ownership

- Owns: the commands, screens, sheets and native behavior this ticket delivers
- Uses: each existing item it builds on, with its owner (#100)
- Out of scope: each nearby item, with the issue that owns it (#123)

## Current state

- What the ticket depends on that does not exist yet

## Size

Migrations 0 · New screens 1 · Native modules 0 · Proofs 3

## Acceptance criteria

- [ ] One outcome - Evidence: one proof
```

- **What to build** describes behaviour, not file paths. Name the entry point by its
  glossary or screen term ("Active workout", "Exercise detail").
- **Rules** link ADRs, decisions and subsystem docs and add only the narrowing. They
  never restate a linked rule. Omit the section when nothing narrows.
- **Ownership** follows [Ownership](#ownership). Out of scope names an issue for each
  item, or reads "none".
- **Current state** lists missing infrastructure the triage agent verified in the code,
  such as "No backup scheduler exists". A ticket that moves, renames or removes
  controls also lists every test that drives them, found by searching `tests/`; each
  counts toward Proofs. Omit the section when nothing relevant is missing.
- The parent is a native sub-issue link and blockers are native blocked-by
  relationships, not body sections. Add a "Blocked by" line only when a blocker cannot
  be linked.

## Criteria

- One outcome per line, with its one proof after `- Evidence:`. An outcome joined to
  another with a semicolon or listing several proofs is two criteria.
- Criteria state product or technical outcomes. Validation checks, pushing, evidence and
  closing are the [done definition](../AGENTS.md#done), never criteria.
- There is no fixed criterion count; more than eight means the ticket holds two slices.
- Device criteria name the screen and what must be visible, never a device model or
  screen size, unless the behavior is specific to one.

## Evidence

- Each criterion names its evidence: an existing test, a new test where
  [one is required](verification.md#when-a-test-is-required), or a
  [device check](verification.md#device-checks). Never a test per criterion by default.
- Evidence is an assertion, not a record: "the repository test asserts the draft is
  discarded", not "check that drafts work".

## Size

The Size line counts what the ticket adds. Split it when a count passes its limit:

| Count          | Counts                                      | Limit                     |
| -------------- | ------------------------------------------- | ------------------------- |
| Migrations     | New Drizzle migrations                      | 1                         |
| New screens    | New routes and sheets                       | 3, and 0 with a migration |
| Native modules | Native modules or config plugins changed    | 1                         |
| Proofs         | Tests added or extended, plus device checks | 6                         |

Split by layer before feature: schema, migration, repository and real-SQLite tests
first; native module behavior and its module tests next; screens, sheets and wiring
after; visual polish last. An atomic invariant (one transaction, no partial state)
belongs whole to the data slice; it is not a reason to bundle the screens. A UI ticket
that waits on a later action leaves that control out rather than merging with that
action's ticket.

`node scripts/ticket-lint.mjs <body-file>` checks a body against the template, criteria
and size rules.

## Parents

A ticket with sub-issues is a parent. It holds the ownership list, the shared rules and
a breakdown of features by layer, and its only criterion is that the sub-issues are
closed. It has no Size line and no Priority.

## Ownership

Every item has exactly one owner ticket, named everywhere the item is mentioned. An
item listed under two tickets is effectively unowned and gets skipped.

## Creating

Use the repository command to create and configure one issue. Write the body to a file
with a quoted heredoc; its text is passed unchanged.

```sh
node scripts/create-issue.mjs --title "..." --body-file "$body_file" \
  --category enhancement --areas ui,data --priority High
```

- Category: `bug` or `enhancement`. Areas: one or more of `ui`, `data`, `native`,
  `tooling`, comma-separated.
- Non-parent tickets require `--priority Urgent|High|Medium|Low`. A parent ticket uses
  `--parent-ticket` instead, without Priority. This mode is separate from
  `--parent <n>`, which attaches the new issue as a native sub-issue.
- Optional `--blocked-by <n>,<n>` sets native blockers.
- `--triage-state` accepts a state label from [triage labels](triage-labels.md),
  defaulting to `needs-triage`. `ready-for-agent` requires `--approved-breakdown`, an
  explicit assertion that the user approved the breakdown.
- Before any GitHub write, the command lints a non-parent body. Check a body for
  `gh issue edit` with `node scripts/ticket-lint.mjs <file>`.
- The command adds the issue to the LiftLog Project, sets Backlog and applicable
  Priority, then reads back title, exact body, labels, relationships and Project
  fields. Success prints compact JSON with the number, URL, Status, Priority, labels
  and verified relationships.
- On partial failure, it exits non-zero with the existing issue URL, unfinished steps
  and diagnostics. Fix the reported cause and rerun the same inputs with
  `--resume <n>`. If creation itself fails without returning a URL, inspect GitHub for
  a possibly created issue before retrying; use `--resume <n>` if it exists.
- Add sibling references once numbers exist with a separate body-file edit, then read
  back the final text:

  ```sh
  gh issue edit <n> --body-file "$body_file"
  gh issue view <n> --json body
  ```

- Use `ready-for-agent` only for tickets from a breakdown the user approved. Every
  other new ticket gets `needs-triage`.
- Set Priority: Urgent for the head of the critical path, High for the rest of it,
  Medium for work that blocks nothing on it, Low for human checks. Blockers decide what
  is startable; Priority only orders startable work.
- Work that needs a human gets `ready-for-human` on the issue itself and is assigned to
  the maintainer; it blocks the issues that wait on it.

## Changing scope

Rewrite the description so it states the current scope as a whole, then add a comment
saying what changed and why. A handoff moves the item into the receiving ticket's
description in the same change, then comments on both tickets.

## Closing

Close a ticket once it is [done](../AGENTS.md#done). Post the
[evidence](verification.md#evidence) with `gh issue comment <n> --body-file <file>`,
read it back, then `gh issue close <n> --reason completed`. For any criterion that will
not be finished, create a follow-up ticket with a single owner, link it from this
ticket, and remove the item here.
