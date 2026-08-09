# Sentry Database Observability Plan

## Context

Liftlog is a single-user mobile React Native/Expo app using Sentry, Drizzle, and Expo SQLite. Sentry is initialized in `src/app/_layout.tsx` with navigation tracing, native frame/stall tracking, and 100% trace sampling for the bounded Phase 0 baseline.

Most database reads flow through `useLiveWithFallback` (`src/lib/db/use-live-with-fallback.hook.ts`). It can execute an initial synchronous `query.all()` and later reactive `query.then()` refreshes. Repositories own query construction and also contain direct reads, writes, and transactions.

Goal: collect enough release telemetry to identify expensive database operations and user flows using p95/p99 duration and cumulative time, without leaking SQL, IDs, or user values.

## Rules

- Work one phase at a time; update this file as phases are completed.
- Keep instrumentation non-blocking. Sentry failures or unsampled spans must never affect database behavior.
- Use stable logical repository operation names, for example `workout.getActiveWorkout`.
- Use safe metadata only: feature, read/write, phase, live-refresh status, success/error, and optional row count.
- Do not add a production dependency or hand-edit generated database files/migrations.
- Validate each phase with relevant tests/type checks and a development Spotlight smoke check.
- Run `graphify update .` after source changes.

## Phase 0 — Span foundation

- [x] Confirm the Sentry 8.17.2 manual span API used by the project.
- [x] Add one small internal helper for sync and async database spans.
- [x] Make the helper set duration/status and rethrow database errors unchanged.
- [x] Make the helper safe when Sentry is disabled, unsampled, unavailable, or has no active parent.
- [x] Add explicit environment/release metadata while keeping `sendDefaultPii: false`.
- [x] Temporarily set release trace sampling to 100% for the bounded baseline.
- [x] Add tests for sync success, async success, and failures.
- [x] Run type checks/tests.
- [ ] Run a development Spotlight smoke check.

Verification: `pnpm test` (71 passed), TypeScript check, ESLint, and Prettier pass. Development Spotlight smoke check remains pending because it requires running the app in a development client.

## Phase 1 — Shared live-query reads

- [ ] Add stable repository operation names to the `useLiveWithFallback` call sites.
- [ ] Instrument the initial `query.all()` as `phase: initial_read`.
- [ ] Instrument reactive `query.then()` executions as `phase: live_refresh`.
- [ ] Record both executions when both occur; do not suppress the second query.
- [ ] Preserve an active route/interaction parent and record background refreshes without forcing a transaction.
- [ ] Record query errors without changing existing error handling.
- [ ] Verify representative screens in development and inspect spans in Spotlight/Sentry.
- [ ] Run type checks/tests and `graphify update .`.

## Phase 2 — Repository operations

- [ ] Instrument direct repository reads outside `useLiveWithFallback`.
- [ ] Instrument repository writes and transaction boundaries across workouts, exercises, progress, settings, and steps.
- [ ] Start with one logical span per operation/transaction; avoid wrapping every internal statement by default.
- [ ] Add finer-grained nested spans only when a baseline transaction hides the actual bottleneck.
- [ ] Keep operation names stable and parameter-free.
- [ ] Test success/error behavior for representative reads, writes, and transactions.
- [ ] Run type checks/tests and `graphify update .`.

## Phase 3 — Startup and important user flows

- [ ] Add separate spans for production-relevant migrations, backfills, and seeds in `src/components/database-provider.tsx`.
- [ ] Use development seed spans only to validate instrumentation, not as baseline data.
- [ ] Add a small number of domain-flow spans around high-value actions such as starting, saving, and finishing workouts.
- [ ] Confirm database child spans appear under route or flow spans where a parent exists.
- [ ] Run type checks/tests and `graphify update .`.

## Phase 4 — Baseline review and optimization

- [ ] Collect data for two weeks or 20 meaningful sessions, whichever comes later.
- [ ] Review p95 and p99 duration by operation.
- [ ] Review cumulative time, call count, and error rate by operation.
- [ ] Compare route/flow transactions with their database child spans.
- [ ] Check whether repeated live refreshes create unexpected volume or cost.
- [ ] Choose slow-operation thresholds from observed distributions.
- [ ] Optimize only evidence-backed bottlenecks.
- [ ] Reassess trace sampling after the baseline.
- [ ] Add alerts only for recurring, actionable regressions.

## Handoff checklist

Before ending a session, record the active phase, check off completed items, note tests run and failures, and state the next smallest task. Do not start a later phase until the current phase is verified.

Current handoff: Phase 0 code is implemented; its development Spotlight smoke check is pending. Next smallest task is that smoke check, followed by Phase 1 call-site instrumentation.
