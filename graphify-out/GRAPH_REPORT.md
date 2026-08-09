# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 337 files · ~117,314 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1836 nodes · 5394 edges · 159 communities (85 shown, 74 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04517527`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- onboarding.repository.ts
- health-connect.service.ts
- workout-log-content.tsx
- active-workout-exercise-edit-list.tsx
- ui/bottom-sheet.tsx
- Text
- expo-router
- exercise-picker-sheet.tsx
- settings.repository.ts
- rest-timer-sheet.tsx
- chip.tsx
- exercises/[id].tsx
- workout.repository.ts
- use-workout-template-exercise-draft.ts
- weight.utils.ts
- Set
- styled/bottom-sheet.tsx
- set-duration-picker-sheet.tsx
- active-workout-content.tsx
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- rest-timer-setting-sheet.tsx
- tracking.domain.ts
- use-exercise-detail.ts
- app-theme-provider.tsx
- DrizzleDb
- scripts
- knip.json
- useDrizzle
- useAppTheme
- icon.tsx
- common-providers.tsx
- Workout
- expo
- TrackingType
- workout-template.repository.ts
- package.json
- database-observability.test.ts
- use-live-with-fallback.hook.ts
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- workouts/[id].tsx
- exercise-history-list.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- addRestTimerPreset
- tests/tsconfig.json
- rest-timer-idle-content.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- settings-provider.tsx
- exercise.repository.ts
- screen.tsx
- snackbar.tsx
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- @sentry/react-native
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- database.md
- workouts/edit/[id].tsx
- extraction-spec.md
- lint-staged
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- segmented-control.tsx
- backfill/[id].tsx
- expo-asset
- clsx
- expo-build-properties
- @commitlint/config-conventional
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
- text.tsx
- prettier-plugin-tailwindcss
- @dotenvx/dotenvx
- @types/react
- @commitlint/cli
- eslint
- database-error-boundary.tsx
- eslint-config-expo
- post-commit
- post-checkout
- eslint-plugin-unused-imports
- progression-suggestion.utils.ts
- prettier
- plugins
- @types/node
- @typescript-eslint/eslint-plugin
- expo-atlas
- @react-navigation/native
- drizzle-orm
- postcss
- @stylistic/eslint-plugin
- tailwindcss
- tsx
- typescript
- @typescript-eslint/parser

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

## Communities (159 total, 74 thin omitted)

### Community 0 - "onboarding.repository.ts"
Cohesion: 0.39
Nodes (5): Index(), useIndexRedirect(), useOnboardingActions(), completeOnboardingWithPreferences(), isOnboardingCompleted()

### Community 1 - "health-connect.service.ts"
Cohesion: 0.08
Nodes (45): HealthStepDay, StepDayRow(), StepDayRowProps, StepsContent(), StepsSummaryCardsProps, StepsUnavailableStateProps, BACKGROUND_PERMISSION, getGrantedStepPermissionState() (+37 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.06
Nodes (57): StyledActivityIndicator, ExerciseProgressChart(), AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS (+49 more)

### Community 3 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.10
Nodes (26): ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem, ReorderableListRenderItemInfo (+18 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (41): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+33 more)

### Community 5 - "Text"
Cohesion: 0.15
Nodes (17): Card, CardContent, CardProps, PulsatingDot(), Text, WEIGHT_UNIT_OPTIONS, StepsEmptyState(), StepsEmptyStateProps (+9 more)

### Community 6 - "expo-router"
Cohesion: 0.20
Nodes (18): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), BackButton(), BackButtonVariant, LoadingState() (+10 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.07
Nodes (24): StyledBottomSheetTextInput, FlatListClassNameProps, StyledFlatList, StyledFlatListBase, BottomSheetInputProps, BottomSheetTextInputRef, InputAccessibilityState, NativeTextInputProps (+16 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.12
Nodes (23): numberFormatter, StepGoalSheet(), StepGoalSheetContent, getSetting(), getWeightUnit(), MAX_REST_TIMER_PRESETS, parseStepGoal(), readSetting() (+15 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.13
Nodes (22): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+14 more)

### Community 10 - "chip.tsx"
Cohesion: 0.05
Nodes (50): ExercisesScreen(), StyledGestureScrollView, BackButtonProps, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps (+42 more)

### Community 11 - "exercises/[id].tsx"
Cohesion: 0.36
Nodes (8): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseDetailActionsSheet(), ExerciseListRow(), ExerciseListRowProps, formatMuscleList(), getPrimaryMuscleLabel(), toTitleCase()

### Community 12 - "workout.repository.ts"
Cohesion: 0.11
Nodes (30): getDateKeyTimestamp(), WorkoutLogStartSheet(), AddSetValues, getSetStorageValues(), useExerciseTrackActions(), useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, ActiveWorkoutExerciseDraftConflictError (+22 more)

### Community 13 - "use-workout-template-exercise-draft.ts"
Cohesion: 0.17
Nodes (18): WorkoutTemplateDetailLoaded(), TemplateExerciseEditor(), DraftExerciseRow, reconcileDraftRows(), SaveWorkoutTemplateExerciseDraftResult, useWorkoutTemplateExerciseDraft(), createSupersetId(), getSupersetLabelByRowId() (+10 more)

### Community 14 - "weight.utils.ts"
Cohesion: 0.20
Nodes (16): areSameTrackingValues(), formatTrackingValue(), getSetValues(), ProgressionSuggestion(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary() (+8 more)

### Community 15 - "Set"
Cohesion: 0.15
Nodes (28): Set, SetValues, TrackingFieldDefinition, useSettings(), SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState (+20 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 17 - "set-duration-picker-sheet.tsx"
Cohesion: 0.12
Nodes (14): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+6 more)

### Community 18 - "active-workout-content.tsx"
Cohesion: 0.12
Nodes (21): ActiveWorkoutEditExercisesScreen(), WorkoutTemplateDetailScreen(), EmptyState(), ActiveWorkoutContent(), chromeEntering, chromeExiting, chromeLayout, headerEntering (+13 more)

### Community 19 - "devDependencies"
Cohesion: 0.29
Nodes (7): babel-plugin-inline-import, babel-preset-expo, devDependencies, babel-plugin-inline-import, babel-preset-expo, @tailwindcss/postcss, @tailwindcss/postcss

### Community 20 - "Components"
Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"
Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "set-form-row.tsx"
Cohesion: 0.07
Nodes (31): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone (+23 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "rest-timer-setting-sheet.tsx"
Cohesion: 0.14
Nodes (13): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, minuteItems (+5 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.16
Nodes (17): PersonalRecord, assertNonNegativeNumber(), assertPositiveNumber(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), isNonNegativeNumber(), isPositiveNumber() (+9 more)

### Community 26 - "use-exercise-detail.ts"
Cohesion: 0.15
Nodes (27): getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId(), getLatestAchievedAt() (+19 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "DrizzleDb"
Cohesion: 0.07
Nodes (64): migrateAsync(), configureDatabase(), createDrizzleDb(), DrizzleDb, ForeignKeysPragma, ForeignKeyViolation, runDatabaseMigrations(), schema (+56 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "useDrizzle"
Cohesion: 0.07
Nodes (40): WorkoutDetailLoaded(), DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrationsThroughExerciseNameBackfill, useDrizzle(), withStartupDatabaseSpan() (+32 more)

### Community 32 - "useAppTheme"
Cohesion: 0.18
Nodes (10): RootNavigator(), unstable_settings, WorkoutLayout(), AboutInfoSection(), StepsSection(), THEME_OPTIONS, ThemeSelectionSection(), WorkoutPreferencesSection() (+2 more)

### Community 33 - "icon.tsx"
Cohesion: 0.10
Nodes (27): Props, State, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants (+19 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.15
Nodes (6): CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost()

### Community 35 - "Workout"
Cohesion: 0.08
Nodes (41): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseListItem, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows (+33 more)

### Community 36 - "expo"
Cohesion: 0.08
Nodes (25): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, reactCompiler (+17 more)

### Community 37 - "TrackingType"
Cohesion: 0.10
Nodes (28): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps (+20 more)

### Community 38 - "workout-template.repository.ts"
Cohesion: 0.11
Nodes (36): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, showSnackbar(), Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, WorkoutTemplateCardProps (+28 more)

### Community 39 - "package.json"
Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 40 - "database-observability.test.ts"
Cohesion: 0.20
Nodes (7): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan, WithDomainFlowSpan

### Community 41 - "use-live-with-fallback.hook.ts"
Cohesion: 0.24
Nodes (8): AndroidStepsSyncHost(), activeDebugSubscriptions, debugQueryRuns, LiveRowsQuery, QueryRows, UseLiveWithFallbackOptions, UseLiveWithFallbackResult, scheduleIdleTask()

### Community 43 - "overrides"
Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 44 - "include"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 46 - "dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, expo, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo, expo-drizzle-studio-plugin (+3 more)

### Community 47 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 48 - "workouts/[id].tsx"
Cohesion: 0.21
Nodes (13): ActiveWorkoutScreen(), WorkoutDetailLoadedProps, WorkoutDetailScreen(), WorkoutDetailActionsSheet(), WorkoutHistoryExerciseCard(), WorkoutMetrics(), useActiveWorkoutScreen(), useWorkoutHistoryDetail() (+5 more)

### Community 49 - "exercise-history-list.tsx"
Cohesion: 0.20
Nodes (13): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatPersonalRecordValue(), ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets() (+5 more)

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
Cohesion: 0.39
Nodes (4): playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "addRestTimerPreset"
Cohesion: 0.31
Nodes (9): addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), normalizeRestTimerPreset(), parseRestTimerPresets(), serializeRestTimerPresets(), setRestTimerPresets() (+1 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "rest-timer-idle-content.tsx"
Cohesion: 0.36
Nodes (7): getDurationDraft(), RestTimerIdleContent(), RestTimerIdleContentProps, RestTimerPresetEditorSheet(), RestTimerSheetProps, RestTimerContext, getTimerParts()

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "settings-provider.tsx"
Cohesion: 0.18
Nodes (15): SettingsContext, SettingsContextValue, SettingsProvider(), getSettingsQuery(), getSettingsSnapshot(), mapSettingsRows(), parseBooleanSetting(), parseRestTimerDuration() (+7 more)

### Community 62 - "exercise.repository.ts"
Cohesion: 0.14
Nodes (28): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+20 more)

### Community 63 - "screen.tsx"
Cohesion: 0.36
Nodes (5): EditExerciseScreen(), ScreenEdge, ScreenProps, useCustomExerciseEdit(), parseMuscleList()

### Community 64 - "snackbar.tsx"
Cohesion: 0.20
Nodes (10): notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore, SwitchProps, MOTION_DURATION_MS (+2 more)

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

### Community 73 - "@sentry/react-native"
Cohesion: 0.50
Nodes (4): expo, install, exclude, @sentry/react-native

### Community 78 - "workouts/edit/[id].tsx"
Cohesion: 0.60
Nodes (4): HistoricalWorkoutEditScreen(), useHistoricalWorkoutEditScreen(), getHistoricalWorkoutEditDraftQuery(), getWorkoutByIdQuery()

### Community 80 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 86 - "segmented-control.tsx"
Cohesion: 0.14
Nodes (15): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), SegmentedControlOption, SegmentedControlProps, triggerBottomTabNavigationHaptics() (+7 more)

### Community 87 - "backfill/[id].tsx"
Cohesion: 0.70
Nodes (3): HistoricalWorkoutDraftScreen(), useHistoricalWorkoutDraftScreen(), getHistoricalWorkoutDraftQuery()

### Community 129 - "text.tsx"
Cohesion: 0.07
Nodes (44): OnboardingScreen(), weightUnitOptions, StyledScrollView, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig (+36 more)

### Community 139 - "database-error-boundary.tsx"
Cohesion: 0.22
Nodes (4): DatabaseErrorBoundary, Props, State, ExerciseNameMigrationConflictError

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 144 - "progression-suggestion.utils.ts"
Cohesion: 0.36
Nodes (8): computeEstimated1RM(), roundScore(), areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

### Community 146 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

## Knowledge Gaps
- **551 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+546 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `@sentry/react-native` to `common-providers.tsx`, `useDrizzle`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _551 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `health-connect.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08392156862745098 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05738615327656423 - nodes in this community are weakly interconnected._
- **Should `active-workout-exercise-edit-list.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10084033613445378 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08350168350168351 - nodes in this community are weakly interconnected._
- **Should `Text` be split into smaller, more focused modules?**
  _Cohesion score 0.14838709677419354 - nodes in this community are weakly interconnected._