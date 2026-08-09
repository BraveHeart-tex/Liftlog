# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 338 files · ~118,548 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1854 nodes · 5405 edges · 141 communities (77 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89f566a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- use-historical-workout-start.ts
- steps-content.tsx
- dev-seed.ts
- active-workout-exercise-edit-list.tsx
- ui/bottom-sheet.tsx
- schema.ts
- active-workout-content.tsx
- exercise-picker-sheet.tsx
- settings.repository.ts
- rest-timer-sheet.tsx
- onboarding.repository.ts
- chip.tsx
- DrizzleDb
- step-goal-sheet.tsx
- TrackingType
- Set
- styled/bottom-sheet.tsx
- Log Screen Rendering Performance Plan
- set-duration-picker-sheet.tsx
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- text.tsx
- tracking.domain.ts
- progress.repository.ts
- app-theme-provider.tsx
- database-provider.tsx
- scripts
- knip.json
- use-finish-workout.ts
- active-workout-header-with-actions.tsx
- icon.tsx
- common-providers.tsx
- workout.repository.ts
- expo
- exercise-progress-chart.tsx
- workout-template.repository.ts
- package.json
- database-observability.test.ts
- Text
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- useDrizzle
- exercise-history-list.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- weight.utils.ts
- tests/tsconfig.json
- useAppTheme
- graphify reference: query, path, explain
- .commitlintrc.json
- withDatabaseSpan
- exercise.repository.ts
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- app/_layout.tsx
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- database.md
- database-observability.ts
- extraction-spec.md
- babel-preset-expo
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- drizzle-orm
- expo
- expo-asset
- clsx
- expo-build-properties
- expo-dev-client
- expo-font
- @expo-google-fonts/instrument-sans
- expo-haptics
- expo-linking
- expo-notifications
- expo-splash-screen
- expo-sqlite
- expo-status-bar
- expo-system-ui
- @faker-js/faker
- @gorhom/bottom-sheet
- husky
- lint-staged
- lucide-react-native
- nativewind
- react
- react-native
- react-native-css
- react-native-drum-picker
- react-native-gesture-handler
- react-native-health-connect
- react-native-mmkv
- react-native-nitro-modules
- react-native-reanimated
- react-native-reorderable-list
- react-native-screens
- react-native-svg
- react-native-worklets
- @react-navigation/bottom-tabs
- @sentry/react-native
- @shopify/flash-list
- @shopify/react-native-skia
- tailwind-merge
- victory-native
- zustand
- knip
- prettier-plugin-tailwindcss
- @types/react
- @commitlint/cli
- post-commit
- post-checkout
- eslint-plugin-unused-imports
- progression-suggestion.utils.ts
- prettier
- @types/node
- @typescript-eslint/eslint-plugin

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 107 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
5. `Icon()` - 72 edges
6. `Button()` - 62 edges
7. `withDatabaseSpan()` - 59 edges
8. `Workout` - 52 edges
9. `expo-router` - 43 edges
10. `useLiveWithFallback()` - 42 edges

## Surprising Connections (you probably didn't know these)
- `WorkoutDetailLoaded()` --indirect_call--> `DumbbellIcon()`  [INFERRED]
  src/app/workouts/[id].tsx → tests/mocks/lucide-react-native.ts
- `getHistoricalPersonalRecordRows()` --references--> `DrizzleDb`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/db/client.ts
- `getPersonalRecordSetIds()` --references--> `DrizzleDb`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/db/client.ts
- `insertHistoricalWorkout()` --references--> `DrizzleDb`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/db/client.ts
- `seedHistoricalExercises()` --references--> `DrizzleDb`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/db/client.ts

## Import Cycles
- None detected.

## Communities (141 total, 64 thin omitted)

### Community 0 - "use-historical-workout-start.ts"
Cohesion: 0.23
Nodes (12): useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, useWorkoutTemplates(), UseWorkoutTemplatesOptions, cleanupStaleHistoricalWorkoutDrafts(), createHistoricalWorkoutDraft(), createHistoricalWorkoutDraftFromTemplate(), getLocalNoonTimestamp() (+4 more)

### Community 1 - "steps-content.tsx"
Cohesion: 0.05
Nodes (66): Card, CardContent, CardProps, HealthStepDay, AboutInfoSection(), RestTimerSettingSheet(), StepsSection(), WEIGHT_UNIT_OPTIONS (+58 more)

### Community 2 - "dev-seed.ts"
Cohesion: 0.05
Nodes (67): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData() (+59 more)

### Community 3 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.08
Nodes (41): WorkoutDetailLoaded(), WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps (+33 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (45): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+37 more)

### Community 5 - "schema.ts"
Cohesion: 0.22
Nodes (9): healthStepDays, NewAppMeta, NewHealthStepDay, NewWorkout, NewWorkoutExercise, NewWorkoutTemplate, NewWorkoutTemplateExercise, PersonalRecord (+1 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.12
Nodes (34): expo-router, EditExerciseScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen(), WorkoutDetailScreen() (+26 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.10
Nodes (29): ExercisesScreen(), ExerciseRowProps, buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel() (+21 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.17
Nodes (22): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSettingsQuery(), getSettingsSnapshot() (+14 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.06
Nodes (46): WheelPicker, WheelPickerBase, WheelPickerComponent, SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, getSafeProgress(), RestTimerCountdown() (+38 more)

### Community 10 - "onboarding.repository.ts"
Cohesion: 0.23
Nodes (9): Index(), OnboardingScreen(), AppMeta, useIndexRedirect(), useOnboardingActions(), UseOnboardingActionsParams, completeOnboardingWithPreferences(), CompleteOnboardingWithPreferencesParams (+1 more)

### Community 11 - "chip.tsx"
Cohesion: 0.05
Nodes (48): ExerciseDetailScreen(), formatUsageBreakdown(), StyledGestureScrollView, BackButtonProps, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants (+40 more)

### Community 12 - "DrizzleDb"
Cohesion: 0.14
Nodes (26): DrizzleDb, rebuildPersonalRecordsForExerciseInTransaction(), AddSetValues, getSetStorageValues(), useExerciseTrackActions(), cleanupLegacyHistoricalWorkoutEditDrafts(), createCompletedSet(), deleteCompletedSet() (+18 more)

### Community 13 - "step-goal-sheet.tsx"
Cohesion: 0.27
Nodes (8): numberFormatter, StepGoalSheet(), StepGoalSheetContent, parseStepGoal(), MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, isValidStepGoal()

### Community 14 - "TrackingType"
Cohesion: 0.20
Nodes (18): areSameTrackingValues(), formatTrackingValue(), getSetValues(), TrackingType, ActiveWorkoutExerciseCardProps, ExerciseHistoryListProps, WorkoutExerciseSummary(), WorkoutExerciseSummaryProps (+10 more)

### Community 15 - "Set"
Cohesion: 0.14
Nodes (30): Set, SetValues, TrackingFieldDefinition, SetFormRowProps, SetForm(), SetFormProps, ActiveDurationPickerState, BaseRowView (+22 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (26): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+18 more)

### Community 17 - "Log Screen Rendering Performance Plan"
Cohesion: 0.10
Nodes (19): Acceptance criteria, Checks after implementation, Cross-phase risks and decisions, Deferred-work fallback, Log Screen Rendering Performance Plan, Objective, Observed baseline, Phase 1 — Baseline and attribution (+11 more)

### Community 18 - "set-duration-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (27): babel-plugin-inline-import, @commitlint/config-conventional, @dotenvx/dotenvx, eslint, eslint-config-expo, expo-atlas, devDependencies, babel-plugin-inline-import (+19 more)

### Community 20 - "Components"
Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"
Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "set-form-row.tsx"
Cohesion: 0.07
Nodes (31): SwitchProps, darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps (+23 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "text.tsx"
Cohesion: 0.09
Nodes (31): weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants, InputFieldLayout() (+23 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.18
Nodes (16): assertNonNegativeNumber(), assertPositiveNumber(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), isNonNegativeNumber(), isPositiveNumber(), TrackingTypeDefinition (+8 more)

### Community 26 - "progress.repository.ts"
Cohesion: 0.15
Nodes (29): getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId(), getLatestAchievedAt() (+21 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "database-provider.tsx"
Cohesion: 0.09
Nodes (30): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+22 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "use-finish-workout.ts"
Cohesion: 0.30
Nodes (9): useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), chunkRows(), completeWorkout(), deleteWorkout(), saveHistoricalWorkoutDraft(), saveHistoricalWorkoutEditDraft() (+1 more)

### Community 32 - "active-workout-header-with-actions.tsx"
Cohesion: 0.27
Nodes (7): RenameSheet(), RenameSheetContent, RenameSheetProps, ActiveWorkoutHeaderWithActions(), RenameTemplateSheet(), RenameTemplateSheetProps, useWorkoutDelete()

### Community 33 - "icon.tsx"
Cohesion: 0.08
Nodes (31): Props, State, StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle (+23 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.14
Nodes (11): CommonProviders(), CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary, notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions (+3 more)

### Community 35 - "workout.repository.ts"
Cohesion: 0.06
Nodes (60): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps (+52 more)

### Community 36 - "expo"
Cohesion: 0.08
Nodes (25): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, reactCompiler (+17 more)

### Community 37 - "exercise-progress-chart.tsx"
Cohesion: 0.23
Nodes (11): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExercisePersonalRecordSummaryItem (+3 more)

### Community 38 - "workout-template.repository.ts"
Cohesion: 0.09
Nodes (40): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, showSnackbar(), Exercise, WorkoutTemplate, WorkoutTemplateExercise, validateStagedCustomExerciseNames(), NewTemplateContent() (+32 more)

### Community 39 - "package.json"
Cohesion: 0.13
Nodes (14): engines, node, pnpm, lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, main, name (+6 more)

### Community 40 - "database-observability.test.ts"
Cohesion: 0.20
Nodes (7): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan, WithDomainFlowSpan

### Community 41 - "Text"
Cohesion: 0.12
Nodes (23): StyledScrollView, PulsatingDot(), Text, ExerciseProgressChart(), MAX_REST_TIMER_PRESETS, WorkoutLogRow(), ActiveWorkoutDuration(), ActiveWorkoutExerciseCard() (+15 more)

### Community 43 - "overrides"
Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 44 - "include"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 46 - "dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo-drizzle-studio-plugin, expo-router, react-native-safe-area-context (+3 more)

### Community 47 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 48 - "useDrizzle"
Cohesion: 0.10
Nodes (33): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), HistoricalWorkoutDraftScreen(), WorkoutDetailLoadedProps, useDrizzle(), getExercisesQuery(), useCustomExerciseEdit(), useExercises() (+25 more)

### Community 49 - "exercise-history-list.tsx"
Cohesion: 0.18
Nodes (15): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatNumber(), formatPersonalRecordValue(), formatScore(), ExerciseHistoryData, ExerciseHistoryEntry (+7 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.21
Nodes (16): dismissSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), getRestTimerNotificationData() (+8 more)

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "weight.utils.ts"
Cohesion: 0.23
Nodes (10): ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRow(), ActiveWorkoutExerciseEditRowProps, ExerciseTrackTabProps, WorkoutExerciseWithSets, UseExerciseTrackActionsParams, convertWeightFromKg(), formatWeight() (+2 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "useAppTheme"
Cohesion: 0.13
Nodes (18): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), unstable_settings, WorkoutLayout(), SegmentedControl() (+10 more)

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "withDatabaseSpan"
Cohesion: 0.33
Nodes (9): getSetting(), getWeightUnit(), readSetting(), setHealthConnectStepsEnabled(), setRestTimerDuration(), setSetting(), setStepGoal(), setWeightUnit() (+1 more)

### Community 62 - "exercise.repository.ts"
Cohesion: 0.18
Nodes (21): NewExerciseScreen(), NewExercise, workoutTemplateExercises, normalizeExerciseName(), archiveExercise(), createExercise(), CustomExerciseDetailsUpdate, deleteExercise() (+13 more)

### Community 66 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 67 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 68 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 69 - "styling.md"
Cohesion: 0.50
Nodes (3): NativeWind, Styling, Third-Party Components

### Community 70 - "ux-display.md"
Cohesion: 0.50
Nodes (3): Audio Feedback, Data Display, Workout UX

### Community 71 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getSentryExpoConfig }, { withNativewind }

### Community 72 - "build-android-release-single-arch.sh"
Cohesion: 0.67
Nodes (3): notify(), on_exit(), build-android-release-single-arch.sh script

### Community 73 - "app/_layout.tsx"
Cohesion: 0.15
Nodes (10): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect, RootNavigator(), DrizzleStudio(), appFontAssets (+2 more)

### Community 78 - "database-observability.ts"
Cohesion: 0.16
Nodes (13): expo, install, exclude, @sentry/react-native, DatabaseOperation, DatabaseSpanOptions, getSpanAttributes(), DomainFlowSpanOptions (+5 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 144 - "progression-suggestion.utils.ts"
Cohesion: 0.36
Nodes (8): computeEstimated1RM(), roundScore(), areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

## Knowledge Gaps
- **564 isolated node(s):** `Objective`, `Scope`, `Observed baseline`, `Phase-gating decision`, `Steps data read` (+559 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `database-observability.ts` to `app/_layout.tsx`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **What connects `Objective`, `Scope`, `Observed baseline` to the rest of the system?**
  _564 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `steps-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0533515731874145 - nodes in this community are weakly interconnected._
- **Should `dev-seed.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05063291139240506 - nodes in this community are weakly interconnected._
- **Should `active-workout-exercise-edit-list.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07199032062915911 - nodes in this community are weakly interconnected._
- **Should `active-workout-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12030075187969924 - nodes in this community are weakly interconnected._