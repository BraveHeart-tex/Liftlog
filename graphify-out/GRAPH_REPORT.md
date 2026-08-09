# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 338 files · ~118,632 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1856 nodes · 5410 edges · 153 communities (89 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `443eca97`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useDrizzle
- health-connect.service.ts
- workout-log-calendar.tsx
- ExerciseListItem
- ui/bottom-sheet.tsx
- Text
- expo-router
- active-workout-content.tsx
- withDatabaseSpan
- rest-timer-sheet.tsx
- chip.tsx
- button.tsx
- workout.repository.ts
- step-goal-sheet.tsx
- workout-exercise-summary.tsx
- Set
- exercise-picker-sheet.tsx
- Log Screen Rendering Performance Plan
- use-exercises-screen.ts
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- set-duration-picker-sheet.tsx
- tracking.domain.ts
- use-exercise-history.ts
- app-theme-provider.tsx
- schema.ts
- scripts
- knip.json
- database-observability.ts
- useSettings
- icon.tsx
- common-providers.tsx
- Workout
- expo
- TrackingType
- workout-template.repository.ts
- package.json
- database-observability.test.ts
- date.utils.ts
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
- stopwatch-content.tsx
- nativewind-env.d.ts
- use-exercise-detail.ts
- tests/tsconfig.json
- text.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- rest-timer-preset-editor-sheet.tsx
- exercise.repository.ts
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
- workouts/[id].tsx
- extraction-spec.md
- android
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- (tabs)/_layout.tsx
- expo
- expo-asset
- clsx
- expo-build-properties
- use-workout-log.ts
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
- cn
- prettier-plugin-tailwindcss
- motion.constants.ts
- @types/react
- @commitlint/cli
- database-provider.tsx
- active-workout-header-with-actions.tsx
- log/index.tsx
- post-commit
- post-checkout
- eslint-plugin-unused-imports
- progression-suggestion.utils.ts
- prettier
- plugins
- @types/node
- @typescript-eslint/eslint-plugin
- workout-templates-section.tsx
- babel-preset-expo
- drizzle-orm

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

## Communities (153 total, 64 thin omitted)

### Community 0 - "useDrizzle"
Cohesion: 0.14
Nodes (16): Index(), OnboardingScreen(), useDrizzle(), useIndexRedirect(), useOnboardingActions(), UseOnboardingActionsParams, getDateKeyTimestamp(), WorkoutLogStartSheet() (+8 more)

### Community 1 - "health-connect.service.ts"
Cohesion: 0.07
Nodes (49): HealthStepDay, StepDayRow(), StepDayRowProps, StepsSummaryCardsProps, AndroidStepsSyncHost(), StepsSyncHost(), StepsUnavailableStateProps, BACKGROUND_PERMISSION (+41 more)

### Community 2 - "workout-log-calendar.tsx"
Cohesion: 0.12
Nodes (30): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+22 more)

### Community 3 - "ExerciseListItem"
Cohesion: 0.07
Nodes (47): WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem (+39 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (41): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+33 more)

### Community 5 - "Text"
Cohesion: 0.13
Nodes (20): BackButtonProps, Card, CardContent, CardProps, IconComponent, PulsatingDot(), Text, StepsConnectionBadge() (+12 more)

### Community 6 - "expo-router"
Cohesion: 0.18
Nodes (21): expo-router, EditExerciseScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen() (+13 more)

### Community 7 - "active-workout-content.tsx"
Cohesion: 0.13
Nodes (19): WorkoutTemplateDetailScreen(), EmptyState(), EmptyStateProps, ActiveWorkoutContent(), chromeEntering, chromeExiting, chromeLayout, headerEntering (+11 more)

### Community 8 - "withDatabaseSpan"
Cohesion: 0.16
Nodes (31): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSetting(), getSettingsQuery() (+23 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.12
Nodes (23): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerIdleContentProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent (+15 more)

### Community 10 - "chip.tsx"
Cohesion: 0.06
Nodes (47): ExerciseDetailScreen(), formatUsageBreakdown(), StyledGestureScrollView, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps (+39 more)

### Community 11 - "button.tsx"
Cohesion: 0.12
Nodes (16): weightUnitOptions, Props, State, StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants (+8 more)

### Community 12 - "workout.repository.ts"
Cohesion: 0.08
Nodes (52): ActiveWorkoutEditExercisesContent(), DrizzleDb, rebuildPersonalRecordsForExerciseInTransaction(), useActiveWorkoutActions(), useActiveWorkoutContent(), UseActiveWorkoutContentParams, DraftExerciseRow, SaveActiveWorkoutExerciseDraftResult (+44 more)

### Community 13 - "step-goal-sheet.tsx"
Cohesion: 0.31
Nodes (7): numberFormatter, StepGoalSheet(), StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, isValidStepGoal()

### Community 14 - "workout-exercise-summary.tsx"
Cohesion: 0.28
Nodes (11): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatDisplaySetPosition() (+3 more)

### Community 15 - "Set"
Cohesion: 0.15
Nodes (28): Set, SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState, DraftSetFormRow (+20 more)

### Community 16 - "exercise-picker-sheet.tsx"
Cohesion: 0.07
Nodes (25): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+17 more)

### Community 17 - "Log Screen Rendering Performance Plan"
Cohesion: 0.10
Nodes (19): Acceptance criteria, Checks after implementation, Cross-phase risks and decisions, Deferred-work fallback, Log Screen Rendering Performance Plan, Objective, Observed baseline, Phase 1 — Baseline and attribution (+11 more)

### Community 18 - "use-exercises-screen.ts"
Cohesion: 0.17
Nodes (16): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch() (+8 more)

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
Cohesion: 0.09
Nodes (24): SetDurationField(), SetDurationFieldProps, SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps (+16 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "set-duration-picker-sheet.tsx"
Cohesion: 0.12
Nodes (15): WheelPicker, WheelPickerBase, WheelPickerComponent, centisecondItems, DurationInputMode, DurationModeTabProps, DurationModeTabsProps, hourItems (+7 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.15
Nodes (21): PersonalRecord, getBestSetId(), assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot() (+13 more)

### Community 26 - "use-exercise-history.ts"
Cohesion: 0.17
Nodes (19): getExerciseByIdQuery(), useCustomExerciseEdit(), useExerciseDetail(), parseMuscleList(), buildExerciseHistory(), getExerciseHistoryQuery(), getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows() (+11 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "schema.ts"
Cohesion: 0.06
Nodes (53): ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData() (+45 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "database-observability.ts"
Cohesion: 0.15
Nodes (18): useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), chunkRows(), completeWorkout(), deleteWorkout(), saveHistoricalWorkoutDraft(), saveHistoricalWorkoutEditDraft() (+10 more)

### Community 32 - "useSettings"
Cohesion: 0.21
Nodes (10): AboutInfoSection(), minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, StepsSection(), ThemeSelectionSection(), WEIGHT_UNIT_OPTIONS (+2 more)

### Community 33 - "icon.tsx"
Cohesion: 0.11
Nodes (23): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone (+15 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.25
Nodes (3): CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary

### Community 35 - "Workout"
Cohesion: 0.12
Nodes (23): ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps, CompletedWorkoutLogRow (+15 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "TrackingType"
Cohesion: 0.16
Nodes (19): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseProgressPoint (+11 more)

### Community 38 - "workout-template.repository.ts"
Cohesion: 0.10
Nodes (40): WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, TemplateExerciseEditor(), useWorkoutStart(), activeWorkoutRoute (+32 more)

### Community 39 - "package.json"
Cohesion: 0.13
Nodes (14): engines, node, pnpm, lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, main, name (+6 more)

### Community 40 - "database-observability.test.ts"
Cohesion: 0.20
Nodes (7): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan, WithDomainFlowSpan

### Community 41 - "date.utils.ts"
Cohesion: 0.19
Nodes (15): WorkoutDetailLoaded(), ExerciseProgressChart(), WorkoutLogRow(), ActiveWorkoutHeaderDuration(), ActiveWorkoutHeaderDurationProps, RecentWorkoutCard(), WorkoutTemplateCard(), WorkoutTemplateCardProps (+7 more)

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

### Community 54 - "stopwatch-content.tsx"
Cohesion: 0.26
Nodes (7): StopwatchContent(), StopwatchContentProps, StopwatchStatus, playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "use-exercise-detail.ts"
Cohesion: 0.24
Nodes (11): getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem, ExerciseTopSetPerformance, buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getLatestAchievedAt() (+3 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "text.tsx"
Cohesion: 0.18
Nodes (11): nativeTextDefaults, NativeTextProps, TextProps, TextTone, TextVariant, textVariantConfig, TextVariants, variantFontFamilies (+3 more)

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "rest-timer-preset-editor-sheet.tsx"
Cohesion: 0.16
Nodes (16): SettingsContextValue, MAX_REST_TIMER_PRESETS, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems (+8 more)

### Community 62 - "exercise.repository.ts"
Cohesion: 0.21
Nodes (19): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, getExerciseUsageExistsQuery() (+11 more)

### Community 63 - "set-form.tsx"
Cohesion: 0.14
Nodes (14): unstable_settings, WorkoutLayout(), Switch(), darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, formEaseOut (+6 more)

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

### Community 78 - "workouts/[id].tsx"
Cohesion: 0.22
Nodes (7): WorkoutDetailScreen(), RenameSheet(), RenameTemplateSheet(), RenameTemplateSheetProps, SupersetIndicator(), SupersetIndicatorProps, WorkoutMetrics()

### Community 80 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 86 - "(tabs)/_layout.tsx"
Cohesion: 0.23
Nodes (10): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+2 more)

### Community 91 - "use-workout-log.ts"
Cohesion: 0.36
Nodes (7): formatSelectedDate(), WorkoutLogContent(), getWorkoutCalendarDateRange(), useWorkoutCalendarMarks(), useWorkoutRowsForDate(), getCompletedWorkoutCountRowsQuery(), WorkoutCalendarDateRange

### Community 129 - "cn"
Cohesion: 0.12
Nodes (20): StyledBottomSheetTextInput, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants, BottomSheetInputProps (+12 more)

### Community 131 - "motion.constants.ts"
Cohesion: 0.27
Nodes (6): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, SwitchProps, THEME_OPTIONS, MOTION_DURATION_MS

### Community 134 - "database-provider.tsx"
Cohesion: 0.09
Nodes (26): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+18 more)

### Community 139 - "active-workout-header-with-actions.tsx"
Cohesion: 0.33
Nodes (6): ActiveWorkoutActionsSheet(), ActiveWorkoutHeaderWithActions(), ActiveWorkoutHeaderWithActionsProps, SaveWorkoutTemplateSheet(), useWorkoutDelete(), useWorkoutRename()

### Community 140 - "log/index.tsx"
Cohesion: 0.32
Nodes (5): StepsContent(), getAvailabilityLabel(), LogHeader(), LogHeaderProps, LogView

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 144 - "progression-suggestion.utils.ts"
Cohesion: 0.48
Nodes (6): areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

### Community 146 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 149 - "workout-templates-section.tsx"
Cohesion: 0.38
Nodes (4): WorkoutStartScreen(), StyledScrollView, RecentWorkoutsSection(), WorkoutTemplatesSection()

## Knowledge Gaps
- **565 isolated node(s):** `MonthCalendarProps`, `AnimatedText`, `calendarMonthsCache`, `WorkoutLogCalendarProps`, `DEFAULT_WORKOUT_MARKS` (+560 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `app/_layout.tsx` to `database-observability.ts`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **What connects `MonthCalendarProps`, `AnimatedText`, `calendarMonthsCache` to the rest of the system?**
  _565 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useDrizzle` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `health-connect.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07199032062915911 - nodes in this community are weakly interconnected._
- **Should `workout-log-calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11587301587301588 - nodes in this community are weakly interconnected._
- **Should `ExerciseListItem` be split into smaller, more focused modules?**
  _Cohesion score 0.0701344243132671 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08200290275761973 - nodes in this community are weakly interconnected._