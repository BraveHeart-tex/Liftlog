# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues in the LiftLog GitHub Project. Use the `gh` CLI for all operations. Ticket shape, sizing, labels and closing follow [tickets](../tickets.md).

## Conventions

- **Create an issue**: `node scripts/create-issue.mjs ...` per [tickets creating](../tickets.md#creating).
- **Publish a breakdown** (a parent with sub-issues): `node scripts/publish-tickets.mjs <manifest>` per [publishing a breakdown](../tickets.md#publishing-a-breakdown).
- **Start an issue**: `node scripts/start-issue.mjs <n>` per [selecting work](../tickets.md#selecting-work).
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments --jq '{number,title,body,labels:[.labels[].name],comments:[.comments[].body]}'`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`, with labels from [triage labels](../triage-labels.md).
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

One ticket: `scripts/create-issue.mjs` per [tickets creating](../tickets.md#creating). A parent with sub-issues: `scripts/publish-tickets.mjs` per [publishing a breakdown](../tickets.md#publishing-a-breakdown).

## When a skill says "fetch the relevant ticket"

Use the structured `gh issue view` command under Conventions. Do not combine
`--comments` with `--json`; the installed CLI treats them as mutually exclusive.

## Wayfinding operations

Used only by `/wayfinder`: see [wayfinding](wayfinding.md).
