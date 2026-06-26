3. Type-Safety Cleanup
   Targets: src/components/ui/icon.tsx:22, src/components/ui/wheel-picker.tsx:24

Phase 1: inspect upstream types

- Check nativewind styled typings.
- Check @quidone/react-native-wheel-picker PickerItem<T> default constraints.

- Replace as any with narrow local cast/type bridge if possible.
- Replace PickerItem<any> with PickerItem<unknown> or generic value alias.
- Avoid behavior changes.

Phase 3: verify

- pnpm run ts-check
- pnpm run lint
- Smoke compile affected imports.

4. Knip Dead Code/Tooling
   Targets: package.json, knip.json, modules/expo-step-counter/src/index.ts, UI primitives.

Phase 1: classify findings

- expo-atlas: remove dependency or add ignore if CLI used indirectly.
- unlisted binary: configure knip entry/project or ignore script.
- unused UI exports: remove only if public API not intentionally reserved.
- duplicate StepCounter|default: choose named or default export.

Phase 2: apply one category per commit

- Commit A: tooling/dependency.
- Commit B: UI export cleanup.
- Commit C: step-counter export cleanup.

Phase 3: verify

- pnpm run knip
- pnpm run ts-check
- pnpm run lint
- Ensure lockfile updated if dependency removed.

6. No Test Harness
   Target: package.json

Phase 1: choose harness

- Prefer existing ecosystem: Vitest for pure TS logic/repositories if RN-compatible.
- Avoid E2E first unless needed.
- Confirm with user before adding dev dependency.

Phase 2: add minimal harness

- Add test script.
- Add one repository/data-transform test first.
- Mock DB or use in-memory SQLite if practical.

Phase 3: verify

- pnpm run test
- pnpm run ts-check
- pnpm run lint
- Document test command in README only if existing docs expect it.
