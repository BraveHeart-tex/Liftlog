## Validation Commands

After code changes, run:

```sh
pnpm run ts-check
pnpm run lint
```

These checks are the default validation baseline for the project.

Prefer validating only the affected area when possible, while still ensuring project-wide consistency.

## Missing Test Harness Behavior

This project may not always have a dedicated test harness for every feature area.

For logic changes:

- add or update tests when a test harness exists
- avoid inventing unnecessary testing infrastructure

If no test harness exists for the touched area:

- state that explicitly
- rely on:
  - type checking
  - linting
  - prettier validation
  - focused manual verification

Do not falsely imply automated coverage exists.

## Knip Behavior

When performing:

- broad cleanup
- export deletion
- file deletion
- dependency cleanup
- architectural refactors

also run:

```sh
pnpm run knip
```

Use Knip to identify:

- unused exports
- dead files
- stale dependencies
- orphaned code

Avoid leaving dead exports or stale references behind after cleanup work.

## Completion Rules

Never claim completion while checks are failing.

If validation fails:

- surface the failure clearly
- explain what failed
- avoid misleading success statements

Do not:

- ignore failing checks
- silently skip validation
- claim code is production-ready without validation

Validation should remain:

- explicit
- reproducible
- honest
- project-consistent
