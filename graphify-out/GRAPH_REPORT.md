# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 335 files · ~116,224 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1825 nodes · 5292 edges · 145 communities (86 shown, 59 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e105aa5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workout.repository.ts
- use-steps-screen.ts
- workout-log-calendar.tsx
- database-provider.tsx
- ui/bottom-sheet.tsx
- rest-timer-setting-sheet.tsx
- active-workout-content.tsx
- icon.tsx
- settings.repository.ts
- rest-timer-sheet.tsx
- workout-template.repository.ts
- exercise-metadata-form.tsx
- exercise.repository.ts
- text.tsx
- TrackingType
- Set
- styled/bottom-sheet.tsx
- flash-list.tsx
- DrizzleDb
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- set-duration-picker-sheet.tsx
- tracking.domain.ts
- progress.repository.ts
- app-theme-provider.tsx
- useSettings
- scripts
- knip.json
- useDrizzle
- chip.tsx
- button.tsx
- common-providers.tsx
- schema.ts
- expo
- use-exercise-detail.ts
- ExerciseListItem
- package.json
- (tabs)/_layout.tsx
- onboarding.repository.ts
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- rest-timer-preset-editor-sheet.tsx
- motion.constants.ts
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- workouts/[id].tsx
- tests/tsconfig.json
- eslint
- graphify reference: query, path, explain
- .commitlintrc.json
- lint-staged
- useAppTheme
- android
- database-observability.ts
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- set-form.tsx
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- database.md
- clsx
- extraction-spec.md
- Sentry Database Observability Plan
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- drizzle-orm
- expo
- expo-asset
- step-goal-sheet.tsx
- expo-build-properties
- exercise-list-row.tsx
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
- @gorhom/bottom-sheet
- husky
- database-observability.test.ts
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
- exercise-muscle-selector.tsx
- progression-suggestion.utils.ts
- string.utils.ts
- @types/react
- use-rest-timer-notification-responses.ts
- exercise-picker-filters.tsx
- plugins
- post-commit
- post-checkout
- ScreenErrorBoundary
- exercise-tracking-style-selector.tsx
- rest-timer-trigger.tsx
- @dotenvx/dotenvx
- @types/node

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 105 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
5. `Icon()` - 72 edges
6. `Button()` - 62 edges
7. `Workout` - 52 edges
8. `expo-router` - 43 edges
9. `useLiveWithFallback()` - 41 edges
10. `ExerciseListItem` - 37 edges

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

## Communities (145 total, 59 thin omitted)

### Community 0 - "workout.repository.ts"
Cohesion: 0.06
Nodes (56): ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, WorkoutLogRowProps, ActiveWorkoutHeaderDurationProps, ActiveWorkoutHeaderWithActionsProps, ActiveWorkoutSummaryCardProps, HistoricalWorkoutHeaderProps (+48 more)

### Community 1 - "use-steps-screen.ts"
Cohesion: 0.07
Nodes (53): HealthStepDay, healthStepDays, NewHealthStepDay, StepDayRow(), StepDayRowProps, StepsContent(), StepsSummaryCards(), StepsSummaryCardsProps (+45 more)

### Community 2 - "workout-log-calendar.tsx"
Cohesion: 0.13
Nodes (29): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+21 more)

### Community 3 - "database-provider.tsx"
Cohesion: 0.11
Nodes (22): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+14 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (45): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+37 more)

### Community 5 - "rest-timer-setting-sheet.tsx"
Cohesion: 0.20
Nodes (9): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, SetDurationWheel() (+1 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.14
Nodes (29): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen(), WorkoutTemplateDetailScreen() (+21 more)

### Community 7 - "icon.tsx"
Cohesion: 0.08
Nodes (26): Props, State, AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames (+18 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.13
Nodes (32): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSetting(), getSettingsQuery() (+24 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.13
Nodes (21): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+13 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.11
Nodes (33): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, WorkoutTemplateCardProps, useSaveWorkoutTemplate() (+25 more)

### Community 11 - "exercise-metadata-form.tsx"
Cohesion: 0.19
Nodes (12): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataForm(), ExerciseMetadataFormProps, FocusableInput (+4 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.11
Nodes (35): NewExerciseScreen(), ActiveWorkoutEditExercisesContent(), ExerciseNameMigrationConflict, ExerciseNameMigrationRow, NewExercise, normalizeExerciseName(), archiveExercise(), createExercise() (+27 more)

### Community 13 - "text.tsx"
Cohesion: 0.08
Nodes (44): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+36 more)

### Community 14 - "TrackingType"
Cohesion: 0.13
Nodes (32): ExerciseProgressChartBodyProps, areSameTrackingValues(), formatTrackingValue(), getSetValues(), TrackingType, ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList() (+24 more)

### Community 15 - "Set"
Cohesion: 0.15
Nodes (28): Set, CompletedHistoryEntry, SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState (+20 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (31): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+23 more)

### Community 17 - "flash-list.tsx"
Cohesion: 0.50
Nodes (3): FlashListClassNameProps, StyledFlashList, StyledFlashListBase

### Community 18 - "DrizzleDb"
Cohesion: 0.12
Nodes (27): DrizzleDb, rebuildPersonalRecordsForExerciseInTransaction(), AddSetValues, getSetStorageValues(), useExerciseTrackActions(), ActiveWorkoutExerciseDraftConflictError, createCompletedSet(), deleteCompletedSet() (+19 more)

### Community 19 - "devDependencies"
Cohesion: 0.05
Nodes (39): babel-plugin-inline-import, babel-preset-expo, @commitlint/cli, @commitlint/config-conventional, eslint-config-expo, eslint-plugin-unused-imports, expo-atlas, @faker-js/faker (+31 more)

### Community 20 - "Components"
Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"
Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "set-form-row.tsx"
Cohesion: 0.10
Nodes (22): SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps, toneProgress, SetFormRowActions() (+14 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "set-duration-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.17
Nodes (16): assertNonNegativeNumber(), assertPositiveNumber(), formatNumber(), formatPersonalRecordValue(), getDurationMs(), isNonNegativeNumber(), isPositiveNumber(), TrackingTypeDefinition (+8 more)

### Community 26 - "progress.repository.ts"
Cohesion: 0.12
Nodes (24): buildExerciseHistory(), ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, getCompletedSetsForPersonalRecords(), getExerciseHistoryQuery(), getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows() (+16 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "useSettings"
Cohesion: 0.16
Nodes (17): Card, CardContent, CardProps, AboutInfoSection(), StepsSection(), WEIGHT_UNIT_OPTIONS, WorkoutPreferencesSection(), useSettings() (+9 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "useDrizzle"
Cohesion: 0.07
Nodes (48): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutDetailLoadedProps, useDrizzle(), useExercises(), UseExercisesOptions, getWorkoutCalendarDateRange(), useWorkoutCalendarMarks() (+40 more)

### Community 32 - "chip.tsx"
Cohesion: 0.19
Nodes (12): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+4 more)

### Community 33 - "button.tsx"
Cohesion: 0.10
Nodes (21): StyledActivityIndicator, FlatListClassNameProps, StyledFlatList, StyledFlatListBase, StyledScrollView, Button(), ButtonProps, ButtonSize (+13 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.22
Nodes (13): CommonProvidersProps, DatabaseProvider(), dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage, SnackbarOptions (+5 more)

### Community 35 - "schema.ts"
Cohesion: 0.10
Nodes (33): configureDatabase(), databaseName, databaseOptions, ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName() (+25 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "use-exercise-detail.ts"
Cohesion: 0.15
Nodes (24): EditExerciseScreen(), axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, getExerciseByIdQuery() (+16 more)

### Community 38 - "ExerciseListItem"
Cohesion: 0.05
Nodes (64): ExercisesScreen(), WorkoutDetailLoaded(), WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps (+56 more)

### Community 39 - "package.json"
Cohesion: 0.12
Nodes (16): engines, node, pnpm, expo, install, lint-staged, **/*.{md,json}, **/*.{ts,tsx,js} (+8 more)

### Community 40 - "(tabs)/_layout.tsx"
Cohesion: 0.26
Nodes (9): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+1 more)

### Community 41 - "onboarding.repository.ts"
Cohesion: 0.26
Nodes (8): Index(), AppMeta, useIndexRedirect(), useOnboardingActions(), UseOnboardingActionsParams, completeOnboardingWithPreferences(), CompleteOnboardingWithPreferencesParams, isOnboardingCompleted()

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

### Community 48 - "rest-timer-preset-editor-sheet.tsx"
Cohesion: 0.17
Nodes (14): SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, RestTimerIdleContentProps (+6 more)

### Community 49 - "motion.constants.ts"
Cohesion: 0.21
Nodes (8): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, Switch(), SwitchProps, THEME_OPTIONS, ThemeSelectionSection(), MOTION_DURATION_MS

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.36
Nodes (8): cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), isGranted(), requestRestTimerNotificationPermission(), RestTimerNotificationContext, RestTimerNotificationData, scheduleRestTimerNotification(), ScheduleRestTimerNotificationParams

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "workouts/[id].tsx"
Cohesion: 0.15
Nodes (11): WorkoutDetailScreen(), RenameSheet(), ActiveWorkoutHeaderWithActions(), RenameTemplateSheet(), RenameTemplateSheetProps, SaveWorkoutTemplateSheet(), SupersetIndicator(), SupersetIndicatorProps (+3 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 62 - "useAppTheme"
Cohesion: 0.21
Nodes (7): RootNavigator(), unstable_settings, WorkoutLayout(), CommonProviders(), DrizzleStudio(), SetForm(), useAppTheme()

### Community 63 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 64 - "database-observability.ts"
Cohesion: 0.31
Nodes (8): exclude, @sentry/react-native, DatabaseOperation, DatabaseSpanOptions, getSpanAttributes(), isPromiseLike(), setSpanStatus(), withDatabaseSpan()

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

### Community 73 - "set-form.tsx"
Cohesion: 0.20
Nodes (9): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, formEaseOut, formLayout, formStateEntering, formStateExiting (+1 more)

### Community 80 - "Sentry Database Observability Plan"
Cohesion: 0.20
Nodes (9): Context, Handoff checklist, Phase 0 — Span foundation, Phase 1 — Shared live-query reads, Phase 2 — Repository operations, Phase 3 — Startup and important user flows, Phase 4 — Baseline review and optimization, Rules (+1 more)

### Community 89 - "step-goal-sheet.tsx"
Cohesion: 0.27
Nodes (8): numberFormatter, StepGoalSheet(), StepGoalSheetContent, parseStepGoal(), MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, isValidStepGoal()

### Community 91 - "exercise-list-row.tsx"
Cohesion: 0.39
Nodes (7): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseListRowProps, formatMuscleList(), getPrimaryMuscleLabel(), toTitleCase()

### Community 105 - "database-observability.test.ts"
Cohesion: 0.22
Nodes (6): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan

### Community 128 - "exercise-muscle-selector.tsx"
Cohesion: 0.29
Nodes (6): ExerciseMuscleSelector, ExerciseMuscleSelectorProps, MUSCLE_OPTIONS, BaseCategoryFilter, CATEGORY_FILTERS, MUSCLE_GROUP

### Community 129 - "progression-suggestion.utils.ts"
Cohesion: 0.36
Nodes (8): computeEstimated1RM(), roundScore(), areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

### Community 130 - "string.utils.ts"
Cohesion: 0.53
Nodes (4): ActiveWorkoutStats(), ActiveWorkoutStatsProps, pluralize(), pluralizeUnit()

### Community 134 - "use-rest-timer-notification-responses.ts"
Cohesion: 0.53
Nodes (5): useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, getRestTimerNotificationData(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification()

### Community 139 - "exercise-picker-filters.tsx"
Cohesion: 0.22
Nodes (9): StyledGestureScrollView, BackButtonProps, IconComponent, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilter, ExercisePickerFilterOption, ExercisePickerFiltersProps (+1 more)

### Community 140 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 144 - "exercise-tracking-style-selector.tsx"
Cohesion: 0.40
Nodes (4): ExerciseTrackingStyleSelector(), ExerciseTrackingStyleSelectorProps, TRACKING_TYPE_ROWS, TRACKING_TYPES

### Community 145 - "rest-timer-trigger.tsx"
Cohesion: 0.60
Nodes (3): RestTimerTrigger(), RestTimerTriggerProps, useIsRestTimerRunning()

## Knowledge Gaps
- **552 isolated node(s):** `Context`, `Rules`, `Phase 0 — Span foundation`, `Phase 1 — Shared live-query reads`, `Phase 2 — Repository operations` (+547 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `database-observability.ts` to `useAppTheme`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **Why does `exclude` connect `database-observability.ts` to `package.json`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `install` connect `package.json` to `database-observability.ts`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **What connects `Context`, `Rules`, `Phase 0 — Span foundation` to the rest of the system?**
  _552 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `workout.repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06247086247086247 - nodes in this community are weakly interconnected._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06696428571428571 - nodes in this community are weakly interconnected._
- **Should `workout-log-calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1319073083778966 - nodes in this community are weakly interconnected._