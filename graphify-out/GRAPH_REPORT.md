# Graph Report - liftlog  (2026-08-08)

## Corpus Check
- 330 files · ~112,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1803 nodes · 5291 edges · 156 communities (82 shown, 74 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `194376b2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- text.tsx
- Button
- icon.tsx
- schema.ts
- Workout
- button.tsx
- tracking.domain.ts
- use-exercise-detail.ts
- useLiveWithFallback
- workout-log-calendar.tsx
- DrizzleDb
- settings.repository.ts
- set-form-row.tsx
- rest-timer-sheet.tsx
- workout.repository.ts
- set-form.utils.ts
- NodeSQLiteDatabase
- set-display.utils.ts
- database-provider.tsx
- expo
- Components
- migrations.js
- devDependencies
- exercise-metadata-form.tsx
- exercise-picker-filters.tsx
- exercise-picker-sheet.tsx
- What You Must Do When Invoked
- exercise.repository.ts
- workout-log-content.tsx
- app-theme-provider.tsx
- template-exercise-editor.tsx
- toLocalDateKey
- styled/bottom-sheet.tsx
- exercise-history-list.tsx
- Set
- active-workout-exercise-edit-list.tsx
- workout-template.repository.ts
- common-providers.tsx
- scripts
- useSettings
- chip.tsx
- rest-timer-notifications.service.ts
- set-duration-picker-sheet.tsx
- @expo-google-fonts/instrument-sans
- ExerciseListItem
- steps-content.tsx
- tests/tsconfig.json
- knip.json
- bottom-sheet-input.tsx
- snackbar.tsx
- exercise-progress-chart-body.tsx
- NodeSQLiteStatement
- step-goal-sheet.tsx
- plugins
- TrackingType
- overrides
- useAppTheme
- include
- exercise-list-row.tsx
- dependencies
- Product
- husky
- lint-staged
- package.json
- Liftlog
- graphify reference: extra exports and benchmark
- knip
- nativewind-env.d.ts
- expo
- prettier
- WeightUnit
- replaySoundEffect
- progression-suggestion.utils.ts
- graphify reference: query, path, explain
- .commitlintrc.json
- flash-list.tsx
- RestTimerPreset
- clsx
- @commitlint/cli
- @commitlint/config-conventional
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- database.md
- @dotenvx/dotenvx
- extraction-spec.md
- eslint
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- drizzle-orm
- eslint-config-expo
- eslint-plugin-unused-imports
- expo
- expo-audio
- expo-asset
- expo-build-properties
- expo-constants
- expo-dev-client
- expo-font
- expo-atlas
- expo-haptics
- expo-linking
- expo-notifications
- expo-splash-screen
- expo-sqlite
- expo-status-bar
- expo-system-ui
- @faker-js/faker
- @gorhom/bottom-sheet
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
- @react-navigation/bottom-tabs
- react-native-worklets
- @sentry/react-native
- @shopify/flash-list
- @shopify/react-native-skia
- tailwind-merge
- victory-native
- zustand
- postcss
- prettier-plugin-tailwindcss
- @types/node
- @stylistic/eslint-plugin
- tailwindcss
- @typescript-eslint/eslint-plugin
- tsx
- @types/react
- typescript
- @typescript-eslint/parser

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 107 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 81 edges
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

## Communities (156 total, 74 thin omitted)

### Community 0 - "text.tsx"
Cohesion: 0.06
Nodes (52): OnboardingScreen(), weightUnitOptions, StyledScrollView, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig (+44 more)

### Community 1 - "Button"
Cohesion: 0.12
Nodes (35): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutDetailScreen(), WorkoutTemplateDetailLoaded(), WorkoutTemplateDetailScreen() (+27 more)

### Community 2 - "icon.tsx"
Cohesion: 0.06
Nodes (57): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+49 more)

### Community 3 - "schema.ts"
Cohesion: 0.08
Nodes (46): configureDatabase(), ForeignKeysPragma, ForeignKeyViolation, runDatabaseMigrations(), schema, buildSetRows(), getExerciseRowsByName(), getStartedAt() (+38 more)

### Community 4 - "Workout"
Cohesion: 0.07
Nodes (44): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps (+36 more)

### Community 5 - "button.tsx"
Cohesion: 0.14
Nodes (12): Props, State, StyledActivityIndicator, ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants (+4 more)

### Community 6 - "tracking.domain.ts"
Cohesion: 0.15
Nodes (21): assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), formatPersonalRecordValue(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), getSetScore() (+13 more)

### Community 7 - "use-exercise-detail.ts"
Cohesion: 0.12
Nodes (29): EditExerciseScreen(), getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem, ExerciseTopSetPerformance, useCustomExerciseEdit(), buildPersonalRecordSummary(), CompletedHistoryEntry (+21 more)

### Community 8 - "useLiveWithFallback"
Cohesion: 0.09
Nodes (34): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutStartScreen(), WorkoutDetailLoadedProps, WorkoutTemplateDetailLoadedProps, useActiveWorkoutScreen(), useRecentWorkouts(), useWorkoutHistoryDetail() (+26 more)

### Community 9 - "workout-log-calendar.tsx"
Cohesion: 0.13
Nodes (29): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+21 more)

### Community 10 - "DrizzleDb"
Cohesion: 0.16
Nodes (24): DrizzleDb, getCompletedSetsForPersonalRecords(), rebuildPersonalRecordsForExercises(), rebuildPersonalRecordsForExercisesInTransaction(), useActiveWorkoutActions(), AddSetValues, getSetStorageValues(), useExerciseTrackActions() (+16 more)

### Community 11 - "settings.repository.ts"
Cohesion: 0.13
Nodes (35): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getHealthConnectStepsEnabled(), getRestTimerDuration(), getRestTimerPresets() (+27 more)

### Community 12 - "set-form-row.tsx"
Cohesion: 0.07
Nodes (36): Switch(), SwitchProps, TRACKING_TYPE_DEFINITIONS, darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors (+28 more)

### Community 13 - "rest-timer-sheet.tsx"
Cohesion: 0.07
Nodes (41): WheelPicker, WheelPickerBase, WheelPickerComponent, REST_TIMER_PRESET_NAME_MAX_LENGTH, getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, minuteItems (+33 more)

### Community 14 - "workout.repository.ts"
Cohesion: 0.10
Nodes (37): HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditScreen(), WorkoutDetailLoaded(), useDrizzle(), NewWorkout, ActiveWorkoutHeaderWithActions(), useFinishWorkout(), useHistoricalWorkoutDraftActions() (+29 more)

### Community 15 - "set-form.utils.ts"
Cohesion: 0.16
Nodes (25): SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState, DraftSetFormRow, PersistedEditState (+17 more)

### Community 17 - "set-display.utils.ts"
Cohesion: 0.14
Nodes (23): buildProgressPoints(), buildTopSetPerformances(), areSameTrackingValues(), formatNumber(), formatScore(), formatTrackingValue(), getSetValues(), ActiveWorkoutExerciseEditRow() (+15 more)

### Community 18 - "database-provider.tsx"
Cohesion: 0.10
Nodes (23): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+15 more)

### Community 19 - "expo"
Cohesion: 0.08
Nodes (25): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, reactCompiler (+17 more)

### Community 20 - "Components"
Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"
Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "devDependencies"
Cohesion: 0.29
Nodes (7): babel-plugin-inline-import, babel-preset-expo, devDependencies, babel-plugin-inline-import, babel-preset-expo, @tailwindcss/postcss, @tailwindcss/postcss

### Community 23 - "exercise-metadata-form.tsx"
Cohesion: 0.15
Nodes (16): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataForm(), ExerciseMetadataFormProps, FocusableInput (+8 more)

### Community 24 - "exercise-picker-filters.tsx"
Cohesion: 0.22
Nodes (9): StyledGestureScrollView, BackButtonProps, IconComponent, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilterOption, ExercisePickerFilters(), ExercisePickerFiltersProps (+1 more)

### Community 25 - "exercise-picker-sheet.tsx"
Cohesion: 0.10
Nodes (24): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch() (+16 more)

### Community 26 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 27 - "exercise.repository.ts"
Cohesion: 0.18
Nodes (21): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+13 more)

### Community 28 - "workout-log-content.tsx"
Cohesion: 0.12
Nodes (21): PulsatingDot(), ExerciseProgressChart(), selectedDayEntering, selectedDayExiting, WorkoutLogRow(), getDateKeyTimestamp(), WorkoutLogStartSheet(), ActiveWorkoutDuration() (+13 more)

### Community 29 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 30 - "template-exercise-editor.tsx"
Cohesion: 0.29
Nodes (9): useExercises(), UseExercisesOptions, TemplateExerciseEditor(), TemplateExerciseEditorProps, reconcileDraftRows(), SaveWorkoutTemplateExerciseDraftResult, useWorkoutTemplateExerciseDraft(), normalizeSupersetRows() (+1 more)

### Community 31 - "toLocalDateKey"
Cohesion: 0.18
Nodes (13): LogHeader(), LogHeaderProps, LogView, formatSelectedDate(), WorkoutLogContent(), getWorkoutCalendarDateRange(), useWorkoutCalendarMarks(), useWorkoutRowsForDate() (+5 more)

### Community 32 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 33 - "exercise-history-list.tsx"
Cohesion: 0.38
Nodes (6): ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets(), formatWorkoutDate(), getProgressionToneClassName()

### Community 34 - "Set"
Cohesion: 0.16
Nodes (17): Set, ActiveWorkoutExerciseCardProps, ActiveWorkoutExerciseEditList, ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRowProps, ActiveWorkoutExerciseList(), ActiveWorkoutExerciseListProps, DisplayWorkoutExerciseRow (+9 more)

### Community 35 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.11
Nodes (29): ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem, ReorderableListRenderItemInfo (+21 more)

### Community 36 - "workout-template.repository.ts"
Cohesion: 0.11
Nodes (27): showSnackbar(), Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, validateStagedCustomExerciseNames(), NewTemplateContent(), WorkoutTemplateCardProps (+19 more)

### Community 37 - "common-providers.tsx"
Cohesion: 0.15
Nodes (6): CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost()

### Community 38 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 39 - "useSettings"
Cohesion: 0.08
Nodes (44): HealthStepDay, useSettings(), StepDayRowProps, StepsContent(), StepsSummaryCardsProps, AndroidStepsSyncHost(), StepsUnavailableStateProps, BACKGROUND_PERMISSION (+36 more)

### Community 40 - "chip.tsx"
Cohesion: 0.21
Nodes (11): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+3 more)

### Community 41 - "rest-timer-notifications.service.ts"
Cohesion: 0.21
Nodes (16): dismissSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), getRestTimerNotificationData() (+8 more)

### Community 42 - "set-duration-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

### Community 44 - "ExerciseListItem"
Cohesion: 0.18
Nodes (12): ExerciseListRowProps, ExerciseRow(), ExerciseRowProps, ExerciseListItem, ActiveWorkoutContentProps, ExercisePickerRow, ExercisePickerRowProps, ExercisePickerSheetCommonProps (+4 more)

### Community 45 - "steps-content.tsx"
Cohesion: 0.17
Nodes (13): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, StepDayRow(), StepsActionsSheet(), StepsEmptyState(), StepsEmptyStateProps, StepsSummaryCards() (+5 more)

### Community 46 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 47 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 48 - "bottom-sheet-input.tsx"
Cohesion: 0.20
Nodes (9): StyledBottomSheetTextInput, BottomSheetInput, BottomSheetInputProps, BottomSheetTextInputRef, InputAccessibilityState, NativeTextInputProps, ExerciseNameField(), ExerciseNameFieldProps (+1 more)

### Community 49 - "snackbar.tsx"
Cohesion: 0.38
Nodes (6): notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore

### Community 50 - "exercise-progress-chart-body.tsx"
Cohesion: 0.16
Nodes (15): AnimatedTabBar(), styles, TabLayout(), axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), formatAxisDate(), getChartDomain() (+7 more)

### Community 52 - "step-goal-sheet.tsx"
Cohesion: 0.33
Nodes (6): numberFormatter, StepGoalSheet(), StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS

### Community 53 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 54 - "TrackingType"
Cohesion: 0.25
Nodes (9): ExerciseProgressChartBodyProps, ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps, ExerciseProgressPoint, TrackingType, ExerciseHistoryListProps, WorkoutExerciseSummaryProps, WorkoutHistoryExerciseCardProps (+1 more)

### Community 55 - "overrides"
Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 56 - "useAppTheme"
Cohesion: 0.23
Nodes (9): RootNavigator(), ExercisesLayout(), LogLayout(), unstable_settings, WorkoutLayout(), THEME_OPTIONS, ThemeSelectionSection(), useAppTheme() (+1 more)

### Community 57 - "include"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 58 - "exercise-list-row.tsx"
Cohesion: 0.26
Nodes (10): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), formatMuscleList(), getPrimaryMuscleLabel(), ActiveWorkoutStats(), ActiveWorkoutStatsProps, pluralize() (+2 more)

### Community 59 - "dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo-drizzle-studio-plugin, expo-router, react-native-safe-area-context (+3 more)

### Community 60 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 62 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 63 - "package.json"
Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 64 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 65 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 67 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 68 - "expo"
Cohesion: 0.50
Nodes (4): expo, install, exclude, @sentry/react-native

### Community 70 - "WeightUnit"
Cohesion: 0.27
Nodes (9): Index(), useIndexRedirect(), useOnboardingActions(), UseOnboardingActionsParams, completeOnboardingWithPreferences(), CompleteOnboardingWithPreferencesParams, isOnboardingCompleted(), Settings (+1 more)

### Community 71 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 72 - "progression-suggestion.utils.ts"
Cohesion: 0.33
Nodes (8): ProgressionSuggestionProps, areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry, ProgressionSuggestionData

### Community 73 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 74 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 75 - "flash-list.tsx"
Cohesion: 0.50
Nodes (3): FlashListClassNameProps, StyledFlashList, StyledFlashListBase

### Community 76 - "RestTimerPreset"
Cohesion: 0.50
Nodes (4): SettingsContextValue, RestTimerPreset, RestTimerPresetEditorSheetProps, RestTimerPresetListProps

### Community 80 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 81 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 82 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 83 - "styling.md"
Cohesion: 0.50
Nodes (3): NativeWind, Styling, Third-Party Components

### Community 84 - "ux-display.md"
Cohesion: 0.50
Nodes (3): Audio Feedback, Data Display, Workout UX

### Community 85 - "metro.config.js"
Cohesion: 0.50
Nodes (3): config, { getSentryExpoConfig }, { withNativewind }

### Community 86 - "build-android-release-single-arch.sh"
Cohesion: 0.67
Nodes (3): notify(), on_exit(), build-android-release-single-arch.sh script

## Knowledge Gaps
- **541 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+536 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `expo` to `common-providers.tsx`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _541 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `text.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06229797237731413 - nodes in this community are weakly interconnected._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.12038717483363581 - nodes in this community are weakly interconnected._
- **Should `icon.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.062342342342342344 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07826694619147449 - nodes in this community are weakly interconnected._
- **Should `Workout` be split into smaller, more focused modules?**
  _Cohesion score 0.06802721088435375 - nodes in this community are weakly interconnected._