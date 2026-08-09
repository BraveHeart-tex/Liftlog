# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 337 files · ~117,314 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1836 nodes · 5391 edges · 149 communities (85 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9dce8eac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ExerciseListItem
- health-connect.service.ts
- workout-log-content.tsx
- icon.tsx
- ui/bottom-sheet.tsx
- Text
- expo-router
- exercise-picker-sheet.tsx
- settings.repository.ts
- rest-timer-sheet.tsx
- chip.tsx
- exercises/[id].tsx
- DrizzleDb
- use-workout-template-exercise-draft.ts
- TrackingType
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
- database.integration.test.ts
- scripts
- knip.json
- database-observability.ts
- useAppTheme
- button.tsx
- app/_layout.tsx
- workout.repository.ts
- expo
- exercise-progress-chart.tsx
- workout-template.repository.ts
- package.json
- database-observability.test.ts
- useLiveWithFallback
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
- useDrizzle
- tests/tsconfig.json
- rest-timer-idle-content.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- settings-provider.tsx
- exercise.repository.ts
- schema.ts
- common-providers.tsx
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- date.utils.ts
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- database.md
- active-workout-exercise-list.tsx
- extraction-spec.md
- lint-staged
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- segmented-control.tsx
- step-goal-sheet.tsx
- expo-asset
- clsx
- expo-build-properties
- use-exercise-history.ts
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
- templates/[id].tsx
- @types/react
- @commitlint/cli
- ScreenErrorBoundary
- database-error-boundary.tsx
- expo
- post-commit
- post-checkout
- @tailwindcss/postcss
- drizzle-orm
- postcss
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

## Communities (149 total, 64 thin omitted)

### Community 0 - "ExerciseListItem"
Cohesion: 0.12
Nodes (24): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), ExerciseListItem (+16 more)

### Community 1 - "health-connect.service.ts"
Cohesion: 0.08
Nodes (48): HealthStepDay, StepDayRow(), StepDayRowProps, StepsContent(), StepsSummaryCardsProps, AndroidStepsSyncHost(), StepsUnavailableStateProps, BACKGROUND_PERMISSION (+40 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.07
Nodes (48): StyledActivityIndicator, SwitchProps, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS (+40 more)

### Community 3 - "icon.tsx"
Cohesion: 0.08
Nodes (35): AppIconProps, IconTone, iconToneClassNames, NativeWindIconStyle, NativeWindStylableIcon, styledIconCache, StyledIconComponent, ReorderableHandle() (+27 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (41): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+33 more)

### Community 5 - "Text"
Cohesion: 0.14
Nodes (17): Card, CardContent, CardProps, PulsatingDot(), SegmentedControl(), Switch(), Text, AboutInfoSection() (+9 more)

### Community 6 - "expo-router"
Cohesion: 0.17
Nodes (23): expo-router, EditExerciseScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen() (+15 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.11
Nodes (15): Input, SearchInputIcon(), ExerciseListDataItem, ExercisePickerFilters(), ExercisePickerSearchInput, ExercisePickerSearchInputProps, ExercisePickerSheet(), ExercisePickerSheetBodyProps (+7 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.14
Nodes (23): addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSetting(), getWeightUnit(), MAX_REST_TIMER_PRESETS, normalizeRestTimerPreset() (+15 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.13
Nodes (22): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+14 more)

### Community 10 - "chip.tsx"
Cohesion: 0.07
Nodes (34): StyledGestureScrollView, BackButtonProps, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants (+26 more)

### Community 11 - "exercises/[id].tsx"
Cohesion: 0.36
Nodes (8): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseDetailActionsSheet(), ExerciseListRow(), ExerciseListRowProps, formatMuscleList(), getPrimaryMuscleLabel(), toTitleCase()

### Community 12 - "DrizzleDb"
Cohesion: 0.18
Nodes (23): DrizzleDb, createSeedExercises(), runSeedIfNeeded(), runSeedUpgrades(), upsertAppMeta(), getCompletedSetsForPersonalRecords(), rebuildPersonalRecordsForExercise(), rebuildPersonalRecordsForExercises() (+15 more)

### Community 13 - "use-workout-template-exercise-draft.ts"
Cohesion: 0.19
Nodes (14): TemplateExerciseEditor(), DraftExerciseRow, reconcileDraftRows(), SaveWorkoutTemplateExerciseDraftResult, useWorkoutTemplateExerciseDraft(), createSupersetId(), linkAdjacentSupersetRows(), normalizeSupersetRows() (+6 more)

### Community 14 - "TrackingType"
Cohesion: 0.15
Nodes (25): ExerciseTrackingStyleSelectorProps, areSameTrackingValues(), formatPersonalRecordValue(), formatTrackingValue(), getDurationMs(), getSetValues(), resolveTrackingType(), TrackingType (+17 more)

### Community 15 - "Set"
Cohesion: 0.14
Nodes (29): Set, SetValues, TrackingFieldDefinition, SetFormRowProps, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState (+21 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 17 - "set-duration-picker-sheet.tsx"
Cohesion: 0.12
Nodes (14): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+6 more)

### Community 18 - "active-workout-content.tsx"
Cohesion: 0.18
Nodes (13): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), ActiveWorkoutContent(), chromeEntering, chromeExiting, chromeLayout, headerEntering, headerExiting (+5 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): babel-plugin-inline-import, babel-preset-expo, @commitlint/config-conventional, @dotenvx/dotenvx, eslint, eslint-config-expo, eslint-plugin-unused-imports, expo-atlas (+21 more)

### Community 20 - "Components"
Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"
Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "set-form-row.tsx"
Cohesion: 0.07
Nodes (29): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone (+21 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "rest-timer-setting-sheet.tsx"
Cohesion: 0.15
Nodes (12): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheetContent, secondItems, minuteItems, RestTimerDurationPicker() (+4 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.14
Nodes (18): PersonalRecord, assertNonNegativeNumber(), assertPositiveNumber(), formatNumber(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), isNonNegativeNumber(), isPositiveNumber() (+10 more)

### Community 26 - "use-exercise-detail.ts"
Cohesion: 0.12
Nodes (28): getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId(), getLatestAchievedAt(), getSetAchievedAt() (+20 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "database.integration.test.ts"
Cohesion: 0.07
Nodes (43): Index(), DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync(), migrationsThroughExerciseNameBackfill, withStartupDatabaseSpan() (+35 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "database-observability.ts"
Cohesion: 0.14
Nodes (19): useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), useWorkoutDelete(), chunkRows(), completeWorkout(), deleteWorkout(), saveHistoricalWorkoutDraft() (+11 more)

### Community 32 - "useAppTheme"
Cohesion: 0.28
Nodes (7): RootNavigator(), unstable_settings, WorkoutLayout(), THEME_OPTIONS, ThemeSelectionSection(), SetForm(), useAppTheme()

### Community 33 - "button.tsx"
Cohesion: 0.09
Nodes (28): Props, State, FlatListClassNameProps, StyledFlatList, StyledFlatListBase, StyledScrollView, Button(), ButtonProps (+20 more)

### Community 34 - "app/_layout.tsx"
Cohesion: 0.28
Nodes (4): DrizzleStudio(), appFontAssets, AppFontFace, appFonts

### Community 35 - "workout.repository.ts"
Cohesion: 0.09
Nodes (44): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps (+36 more)

### Community 36 - "expo"
Cohesion: 0.08
Nodes (25): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, reactCompiler (+17 more)

### Community 37 - "exercise-progress-chart.tsx"
Cohesion: 0.23
Nodes (11): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExercisePersonalRecordSummaryItem (+3 more)

### Community 38 - "workout-template.repository.ts"
Cohesion: 0.13
Nodes (30): WorkoutStartScreen(), Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, WorkoutTemplateCardProps, useSaveWorkoutTemplate(), useWorkoutStart() (+22 more)

### Community 39 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, pnpm, expo, install, exclude, main, name (+5 more)

### Community 40 - "database-observability.test.ts"
Cohesion: 0.20
Nodes (7): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan, WithDomainFlowSpan

### Community 41 - "useLiveWithFallback"
Cohesion: 0.18
Nodes (14): useCustomExerciseEdit(), parseMuscleList(), useHistoricalWorkoutDraftScreen(), useHistoricalWorkoutEditScreen(), getHistoricalWorkoutDraftQuery(), getHistoricalWorkoutEditDraftQuery(), getWorkoutByIdQuery(), activeDebugSubscriptions (+6 more)

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

### Community 48 - "workouts/[id].tsx"
Cohesion: 0.26
Nodes (10): WorkoutDetailLoadedProps, WorkoutDetailScreen(), EmptyState(), WorkoutDetailActionsSheet(), WorkoutHistoryExerciseCard(), WorkoutMetrics(), useWorkoutHistoryDetail(), getWorkoutHistoryDetailRowsQuery() (+2 more)

### Community 49 - "exercise-history-list.tsx"
Cohesion: 0.17
Nodes (16): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets(), formatWorkoutDate() (+8 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.15
Nodes (19): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect, useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification() (+11 more)

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.39
Nodes (4): playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "useDrizzle"
Cohesion: 0.12
Nodes (23): useDrizzle(), getDateKeyTimestamp(), WorkoutLogStartSheet(), ActiveWorkoutHeaderWithActions(), useHistoricalWorkoutEditStart(), useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, useRecentWorkouts() (+15 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "rest-timer-idle-content.tsx"
Cohesion: 0.32
Nodes (7): setRestTimerDuration(), getDurationDraft(), RestTimerIdleContent(), RestTimerIdleContentProps, RestTimerPresetEditorSheet(), RestTimerSheetProps, RestTimerContext

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "settings-provider.tsx"
Cohesion: 0.19
Nodes (15): SettingsContext, SettingsContextValue, SettingsProvider(), getSettingsQuery(), getSettingsSnapshot(), mapSettingsRows(), parseRestTimerDuration(), RestTimerPreset (+7 more)

### Community 62 - "exercise.repository.ts"
Cohesion: 0.19
Nodes (23): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, getExerciseUsageExistsQuery() (+15 more)

### Community 63 - "schema.ts"
Cohesion: 0.13
Nodes (25): buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData(), LOAD_PROFILES, LoadProfile, maybeCreatePr() (+17 more)

### Community 64 - "common-providers.tsx"
Cohesion: 0.21
Nodes (13): CommonProviders(), CommonProvidersProps, DatabaseProvider(), dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage (+5 more)

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

### Community 73 - "date.utils.ts"
Cohesion: 0.13
Nodes (18): RenameSheet(), ExerciseProgressChart(), ExerciseRow(), ExerciseRowProps, WorkoutLogRow(), ActiveWorkoutExerciseCard(), ActiveWorkoutHeaderDuration(), ActiveWorkoutHeaderDurationProps (+10 more)

### Community 78 - "active-workout-exercise-list.tsx"
Cohesion: 0.14
Nodes (18): WorkoutDetailLoaded(), WorkoutTemplateDetailLoaded(), ActiveWorkoutExerciseEditList, ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRowProps, ActiveWorkoutExerciseList(), ActiveWorkoutExerciseListProps, DisplayWorkoutExerciseRow (+10 more)

### Community 80 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 86 - "segmented-control.tsx"
Cohesion: 0.18
Nodes (12): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), SegmentedControlOption, SegmentedControlProps, triggerBottomTabNavigationHaptics() (+4 more)

### Community 87 - "step-goal-sheet.tsx"
Cohesion: 0.24
Nodes (9): numberFormatter, StepGoalSheet(), StepGoalSheetContent, parseStepGoal(), setStepGoal(), MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS (+1 more)

### Community 91 - "use-exercise-history.ts"
Cohesion: 0.40
Nodes (8): getExerciseByIdQuery(), getPersonalRecordsByExerciseQuery(), canLoadExerciseHistoryPage(), CanLoadExerciseHistoryPageOptions, didExerciseHistoryPageFinish(), getNextExerciseHistoryLimit(), getBestScore(), useExerciseHistory()

### Community 129 - "text.tsx"
Cohesion: 0.07
Nodes (40): OnboardingScreen(), weightUnitOptions, StyledBottomSheetTextInput, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig (+32 more)

### Community 131 - "templates/[id].tsx"
Cohesion: 0.29
Nodes (6): WorkoutTemplateDetailLoadedProps, WorkoutTemplateDetailScreen(), DiscardWorkoutSheet(), RenameTemplateSheet(), RenameTemplateSheetProps, WorkoutTemplateActionsSheet()

### Community 139 - "database-error-boundary.tsx"
Cohesion: 0.22
Nodes (4): DatabaseErrorBoundary, Props, State, ExerciseNameMigrationConflictError

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

## Knowledge Gaps
- **552 isolated node(s):** `TodayStepRadialCardProps`, `SyncState`, `StepStats`, `EMPTY_PERMISSION_STATE`, `@commitlint/config-conventional` (+547 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `package.json` to `app/_layout.tsx`, `database-observability.ts`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **What connects `TodayStepRadialCardProps`, `SyncState`, `StepStats` to the rest of the system?**
  _552 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ExerciseListItem` be split into smaller, more focused modules?**
  _Cohesion score 0.11954022988505747 - nodes in this community are weakly interconnected._
- **Should `health-connect.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07597402597402597 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06758832565284179 - nodes in this community are weakly interconnected._
- **Should `icon.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08325624421831637 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08245981830887492 - nodes in this community are weakly interconnected._