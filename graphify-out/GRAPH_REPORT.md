# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 338 files · ~118,632 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1856 nodes · 5413 edges · 152 communities (88 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `52a12134`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useDrizzle
- health-connect.service.ts
- workout-log-calendar.tsx
- active-workout-exercise-edit-list.tsx
- ui/bottom-sheet.tsx
- text.tsx
- active-workout-content.tsx
- exercise-picker-sheet.tsx
- withDatabaseSpan
- button.tsx
- exercise-metadata-form.tsx
- exercise-tracking-style-selector.tsx
- workout.repository.ts
- step-goal-sheet.tsx
- workout-exercise-summary.tsx
- Set
- styled/bottom-sheet.tsx
- Log Screen Rendering Performance Plan
- use-exercises-screen.ts
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- cn
- tracking.domain.ts
- use-exercise-history.ts
- app-theme-provider.tsx
- schema.ts
- scripts
- knip.json
- observability-span.ts
- useSettings
- icon.tsx
- common-providers.tsx
- Workout
- expo
- TrackingType
- workout-template.repository.ts
- package.json
- database-observability.test.ts
- workout-log-content.tsx
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- useLiveWithFallback
- exercise-history-list.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- use-exercise-detail.ts
- tests/tsconfig.json
- useAppTheme
- graphify reference: query, path, explain
- .commitlintrc.json
- rest-timer-preset-editor-sheet.tsx
- database.integration.test.ts
- set-form.tsx
- snackbar.tsx
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
- rest-timer.store.ts
- extraction-spec.md
- android
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- segmented-control.tsx
- expo
- expo-asset
- clsx
- expo-build-properties
- toLocalDateKey
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
- bottom-sheet-input.tsx
- prettier-plugin-tailwindcss
- input.tsx
- @types/react
- @commitlint/cli
- database-error-boundary.tsx
- exercise-picker-filters.tsx
- wheel-picker.tsx
- post-commit
- post-checkout
- eslint-plugin-unused-imports
- progression-suggestion.utils.ts
- prettier
- plugins
- @types/node
- @typescript-eslint/eslint-plugin
- @react-navigation/native
- typescript

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

## Communities (152 total, 64 thin omitted)

### Community 0 - "useDrizzle"
Cohesion: 0.09
Nodes (33): Index(), WorkoutDetailLoaded(), DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync(), migrationsThroughExerciseNameBackfill (+25 more)

### Community 1 - "health-connect.service.ts"
Cohesion: 0.06
Nodes (54): HealthStepDay, StepDayRow(), StepDayRowProps, StepsContent(), StepsSummaryCardsProps, AndroidStepsSyncHost(), StepsSyncHost(), StepsUnavailableStateProps (+46 more)

### Community 2 - "workout-log-calendar.tsx"
Cohesion: 0.12
Nodes (30): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+22 more)

### Community 3 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.09
Nodes (38): WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem (+30 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.09
Nodes (37): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+29 more)

### Community 5 - "text.tsx"
Cohesion: 0.09
Nodes (30): Props, State, BackButtonProps, Card, CardContent, CardProps, IconComponent, PulsatingDot() (+22 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.09
Nodes (42): expo-router, EditExerciseScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen() (+34 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.12
Nodes (20): ExerciseRow(), ExerciseRowProps, categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch() (+12 more)

### Community 8 - "withDatabaseSpan"
Cohesion: 0.10
Nodes (41): OnboardingScreen(), useOnboardingActions(), UseOnboardingActionsParams, completeOnboardingWithPreferences(), SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset() (+33 more)

### Community 9 - "button.tsx"
Cohesion: 0.11
Nodes (29): StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants, ButtonVariant (+21 more)

### Community 10 - "exercise-metadata-form.tsx"
Cohesion: 0.14
Nodes (17): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataFormProps, FocusableInput, ExerciseMuscleSelector (+9 more)

### Community 11 - "exercise-tracking-style-selector.tsx"
Cohesion: 0.17
Nodes (15): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseListRowProps, ExerciseTrackingStyleSelector(), ExerciseTrackingStyleSelectorProps, TRACKING_TYPE_ROWS, formatMuscleList() (+7 more)

### Community 12 - "workout.repository.ts"
Cohesion: 0.11
Nodes (41): ActiveWorkoutEditExercisesContent(), DrizzleDb, archiveExercise(), deleteExercise(), removeCustomExercise(), rebuildPersonalRecordsForExerciseInTransaction(), useActiveWorkoutActions(), UseActiveWorkoutActionsParams (+33 more)

### Community 13 - "step-goal-sheet.tsx"
Cohesion: 0.15
Nodes (16): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+8 more)

### Community 14 - "workout-exercise-summary.tsx"
Cohesion: 0.28
Nodes (11): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatDisplaySetPosition() (+3 more)

### Community 15 - "Set"
Cohesion: 0.14
Nodes (29): Set, CompletedHistoryEntry, SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState (+21 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.14
Nodes (13): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+5 more)

### Community 17 - "Log Screen Rendering Performance Plan"
Cohesion: 0.10
Nodes (19): Acceptance criteria, Checks after implementation, Cross-phase risks and decisions, Deferred-work fallback, Log Screen Rendering Performance Plan, Objective, Observed baseline, Phase 1 — Baseline and attribution (+11 more)

### Community 18 - "use-exercises-screen.ts"
Cohesion: 0.18
Nodes (14): ExercisesScreen(), buildAlphabetizedExerciseListItems(), getExercisesQuery(), matchesExerciseFilter(), useExercisesScreen(), useExercises(), UseExercisesOptions, ActiveWorkoutExercisePickerSheetCommonProps (+6 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (27): babel-plugin-inline-import, babel-preset-expo, @commitlint/config-conventional, @dotenvx/dotenvx, eslint, eslint-config-expo, expo-atlas, devDependencies (+19 more)

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

### Community 24 - "cn"
Cohesion: 0.08
Nodes (31): weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants, StepsConnectionBadge() (+23 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.15
Nodes (18): PersonalRecord, assertNonNegativeNumber(), assertPositiveNumber(), formatNumber(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), isNonNegativeNumber() (+10 more)

### Community 26 - "use-exercise-history.ts"
Cohesion: 0.19
Nodes (15): buildExerciseHistory(), getExerciseHistoryQuery(), getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows(), resolveTrackingType(), canLoadExerciseHistoryPage(), CanLoadExerciseHistoryPageOptions, didExerciseHistoryPageFinish() (+7 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "schema.ts"
Cohesion: 0.09
Nodes (42): configureDatabase(), ForeignKeysPragma, ForeignKeyViolation, runDatabaseMigrations(), schema, buildSetRows(), getExerciseRowsByName(), getStartedAt() (+34 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "observability-span.ts"
Cohesion: 0.19
Nodes (15): useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), chunkRows(), completeWorkout(), deleteWorkout(), saveHistoricalWorkoutDraft(), saveHistoricalWorkoutEditDraft() (+7 more)

### Community 32 - "useSettings"
Cohesion: 0.17
Nodes (12): SegmentedControl(), AboutInfoSection(), minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, StepsSection(), THEME_OPTIONS (+4 more)

### Community 33 - "icon.tsx"
Cohesion: 0.08
Nodes (35): WorkoutStartScreen(), FlatListClassNameProps, StyledFlatList, StyledFlatListBase, StyledScrollView, EmptyState(), EmptyStateProps, AppIconProps (+27 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.25
Nodes (3): CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary

### Community 35 - "Workout"
Cohesion: 0.11
Nodes (28): ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, validateStagedCustomExerciseNames(), ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, CompletedWorkoutLogRow (+20 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "TrackingType"
Cohesion: 0.16
Nodes (19): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseProgressPoint (+11 more)

### Community 38 - "workout-template.repository.ts"
Cohesion: 0.10
Nodes (38): WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, TemplateExerciseEditor(), useWorkoutStart(), activeWorkoutRoute, useWorkoutTemplateDetail() (+30 more)

### Community 39 - "package.json"
Cohesion: 0.13
Nodes (14): engines, node, pnpm, lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, main, name (+6 more)

### Community 40 - "database-observability.test.ts"
Cohesion: 0.20
Nodes (7): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan, WithDomainFlowSpan

### Community 41 - "workout-log-content.tsx"
Cohesion: 0.13
Nodes (21): ExerciseProgressChart(), selectedDayEntering, selectedDayExiting, WorkoutLogRow(), WorkoutLogRowProps, getDateKeyTimestamp(), WorkoutLogStartSheet(), ActiveWorkoutHeaderDuration() (+13 more)

### Community 43 - "overrides"
Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 44 - "include"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 46 - "dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, drizzle-orm, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, drizzle-orm, expo-drizzle-studio-plugin (+3 more)

### Community 47 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 48 - "useLiveWithFallback"
Cohesion: 0.12
Nodes (23): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutDetailLoadedProps, useActiveWorkoutScreen(), useHistoricalWorkoutDraftScreen(), useHistoricalWorkoutEditScreen(), useRecentWorkouts(), useWorkoutHistoryDetail() (+15 more)

### Community 49 - "exercise-history-list.tsx"
Cohesion: 0.16
Nodes (17): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatPersonalRecordValue(), ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets() (+9 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.24
Nodes (14): dismissSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), getRestTimerNotificationData() (+6 more)

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.39
Nodes (4): playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "use-exercise-detail.ts"
Cohesion: 0.24
Nodes (15): getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem, ExerciseTopSetPerformance, useCustomExerciseEdit(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances() (+7 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "useAppTheme"
Cohesion: 0.27
Nodes (8): ExercisesLayout(), TabLayout(), LogLayout(), unstable_settings, WorkoutLayout(), SetForm(), useAppTheme(), useTabBarTheme()

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "rest-timer-preset-editor-sheet.tsx"
Cohesion: 0.18
Nodes (14): SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, getDurationDraft() (+6 more)

### Community 62 - "database.integration.test.ts"
Cohesion: 0.09
Nodes (35): NewExerciseScreen(), assertNoExerciseNameMigrationConflicts(), backfillNormalizedExerciseNames(), ExerciseNameMigrationConflict, ExerciseNameMigrationConflictError, ExerciseNameMigrationRow, NewExercise, workoutTemplateExercises (+27 more)

### Community 63 - "set-form.tsx"
Cohesion: 0.15
Nodes (12): Switch(), SwitchProps, darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, formEaseOut, formLayout (+4 more)

### Community 64 - "snackbar.tsx"
Cohesion: 0.21
Nodes (9): notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore, NewTemplateContent() (+1 more)

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
Nodes (10): expo, install, exclude, @sentry/react-native, RootNavigator(), CommonProviders(), DrizzleStudio(), appFontAssets (+2 more)

### Community 78 - "rest-timer.store.ts"
Cohesion: 0.20
Nodes (7): RestTimerIdleContentProps, RestTimerSheetProps, MAX_REST_TIMER_SECONDS, MIN_REST_TIMER_SECONDS, RestTimerContext, RestTimerState, RestTimerStatus

### Community 80 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 86 - "segmented-control.tsx"
Cohesion: 0.27
Nodes (8): AnimatedTabBar(), styles, SegmentedControlOption, SegmentedControlProps, triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics(), nativeFontSizes

### Community 91 - "toLocalDateKey"
Cohesion: 0.35
Nodes (9): formatSelectedDate(), WorkoutLogContent(), getWorkoutCalendarDateRange(), useWorkoutCalendarMarks(), useWorkoutRowsForDate(), getCompletedWorkoutCountRowsQuery(), getCompletedWorkoutLogRowsForDateKeyQuery(), WorkoutCalendarDateRange (+1 more)

### Community 129 - "bottom-sheet-input.tsx"
Cohesion: 0.25
Nodes (7): StyledBottomSheetTextInput, BottomSheetInputProps, BottomSheetTextInputRef, InputAccessibilityState, NativeTextInputProps, InputFieldLayout(), InputFieldLayoutProps

### Community 131 - "input.tsx"
Cohesion: 0.25
Nodes (7): getStyleColor(), StyledTextInput, TextInputColorBridge, TextInputColorBridgeProps, InputAccessibilityState, InputProps, NativeTextInputProps

### Community 134 - "database-error-boundary.tsx"
Cohesion: 0.29
Nodes (3): DatabaseErrorBoundary, Props, State

### Community 139 - "exercise-picker-filters.tsx"
Cohesion: 0.29
Nodes (6): StyledGestureScrollView, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilter, ExercisePickerFilters(), ExercisePickerFiltersProps

### Community 140 - "wheel-picker.tsx"
Cohesion: 0.33
Nodes (5): WheelPicker, WheelPickerBase, WheelPickerComponent, SetDurationWheel(), SetDurationWheelProps

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
- **564 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+559 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `app/_layout.tsx` to `observability-span.ts`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _564 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useDrizzle` be split into smaller, more focused modules?**
  _Cohesion score 0.0859465737514518 - nodes in this community are weakly interconnected._
- **Should `health-connect.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `workout-log-calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12063492063492064 - nodes in this community are weakly interconnected._
- **Should `active-workout-exercise-edit-list.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08687943262411348 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09268707482993198 - nodes in this community are weakly interconnected._