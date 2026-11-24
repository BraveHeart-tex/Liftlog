## Commits and pull requests

Use Conventional Commits:

`<type>(<scope>): <imperative summary>`

Examples:

- `feat(backup): add manual Google Drive backup`
- `fix(backup): reconcile interrupted upload`
- `refactor(database): expose shared initialization`

Reference the active issue in commit footers:

`Refs #87`

Work pushed directly to main closes its issue through the evidence comment in [tickets closing](docs/tickets.md#closing). When a pull request is used, close the implementation ticket from its body:

`Closes #87`
`Part of #86`

Do not close parent issues from implementation commits or pull requests.
