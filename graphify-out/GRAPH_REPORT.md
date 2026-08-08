# Graph Report - liftlog  (2026-08-08)

## Corpus Check
- 330 files · ~112,798 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1799 nodes · 5286 edges · 142 communities (80 shown, 62 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fffb5aa4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- text.tsx
- loading-state.tsx
- ui/bottom-sheet.tsx
- schema.ts
- Workout
- icon.tsx
- tracking.domain.ts
- progress.repository.ts
- workout-template.repository.ts
- workout-log-calendar.tsx
- workout.repository.ts
- settings.repository.ts
- set-form-row.tsx
- rest-timer-sheet.tsx
- useDrizzle
- useSettings
- NodeSQLiteDatabase
- set-display.utils.ts
- database.integration.test.ts
- expo
- Components
- migrations.js
- devDependencies
- exercise-metadata-form.tsx
- exercise-picker-filters.tsx
- exercise-picker-sheet.tsx
- What You Must Do When Invoked
- DrizzleDb
- date.utils.ts
- app-theme-provider.tsx
- useLiveWithFallback
- screen.tsx
- styled/bottom-sheet.tsx
- exercise-history-list.tsx
- Set
- active-workout-exercise-edit-list.tsx
- use-historical-workout-start.ts
- common-providers.tsx
- scripts
- steps-content.tsx
- chip.tsx
- rest-timer-notifications.service.ts
- set-duration-picker-sheet.tsx
- @expo-google-fonts/instrument-sans
- exercise.repository.ts
- active-workout-content.tsx
- tests/tsconfig.json
- knip.json
- input.tsx
- snackbar.tsx
- (tabs)/_layout.tsx
- NodeSQLiteStatement
- workouts/[id].tsx
- babel-preset-expo
- TrackingType
- overrides
- useAppTheme
- include
- exercises/[id].tsx
- dependencies
- Product
- husky
- @react-navigation/native
- package.json
- Liftlog
- graphify reference: extra exports and benchmark
- knip
- nativewind-env.d.ts
- Text
- prettier
- expo-router
- replaySoundEffect
- progression-suggestion.utils.ts
- graphify reference: query, path, explain
- .commitlintrc.json
- use-active-workout-content.ts
- active/index.tsx
- clsx
- expo-drizzle-studio-plugin
- expo-router
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
- extraction-spec.md
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- drizzle-orm
- eslint-plugin-unused-imports
- expo
- expo-audio
- expo-build-properties
- expo-constants
- expo-dev-client
- expo-font
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
- @react-navigation/bottom-tabs
- @react-navigation/elements
- @sentry/react-native
- @shopify/flash-list
- @shopify/react-native-skia
- tailwind-merge
- victory-native
- zustand
- postcss
- @tailwindcss/postcss
- @types/node
- @typescript-eslint/eslint-plugin

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

## Communities (142 total, 62 thin omitted)

### Community 0 - "text.tsx"
Cohesion: 0.08
Nodes (41): WorkoutDetailLoaded(), Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants, EmptyState() (+33 more)

### Community 1 - "loading-state.tsx"
Cohesion: 0.19
Nodes (15): WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutTemplateDetailScreen(), StyledActivityIndicator, LoadingState(), LoadingStateProps (+7 more)

### Community 2 - "ui/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (44): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+36 more)

### Community 3 - "schema.ts"
Cohesion: 0.09
Nodes (34): databaseName, databaseOptions, ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName(), getStartedAt() (+26 more)

### Community 4 - "Workout"
Cohesion: 0.11
Nodes (29): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ActiveWorkoutHeaderWithActionsProps, ActiveWorkoutSummaryCardProps, HistoricalWorkoutHeaderProps, SaveWorkoutTemplateSheetProps (+21 more)

### Community 5 - "icon.tsx"
Cohesion: 0.09
Nodes (32): Props, State, BackButton(), BackButtonVariant, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants (+24 more)

### Community 6 - "tracking.domain.ts"
Cohesion: 0.16
Nodes (18): assertNonNegativeNumber(), assertPositiveNumber(), formatPersonalRecordValue(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), isNonNegativeNumber(), isPositiveNumber() (+10 more)

### Community 7 - "progress.repository.ts"
Cohesion: 0.15
Nodes (28): getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), getBestSetId(), getLatestAchievedAt(), getSetAchievedAt(), useExerciseDetail() (+20 more)

### Community 8 - "workout-template.repository.ts"
Cohesion: 0.14
Nodes (28): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, WorkoutTemplateCardProps, useWorkoutStart() (+20 more)

### Community 9 - "workout-log-calendar.tsx"
Cohesion: 0.13
Nodes (29): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+21 more)

### Community 10 - "workout.repository.ts"
Cohesion: 0.15
Nodes (24): rebuildPersonalRecordsForExerciseInTransaction(), AddSetValues, getSetStorageValues(), useExerciseTrackActions(), useHistoricalWorkoutEditStart(), buildHistoricalWorkoutSourceSnapshot(), chunkRows(), CompletedSetCommandOptions (+16 more)

### Community 11 - "settings.repository.ts"
Cohesion: 0.06
Nodes (57): OnboardingScreen(), weightUnitOptions, AppMeta, numberFormatter, StepGoalSheet(), StepGoalSheetContent, useOnboardingActions(), UseOnboardingActionsParams (+49 more)

### Community 12 - "set-form-row.tsx"
Cohesion: 0.07
Nodes (32): SwitchProps, SetDurationPickerSheet(), darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface() (+24 more)

### Community 13 - "rest-timer-sheet.tsx"
Cohesion: 0.11
Nodes (25): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerIdleContentProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent (+17 more)

### Community 14 - "useDrizzle"
Cohesion: 0.12
Nodes (23): HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditScreen(), useDrizzle(), ActiveWorkoutContent(), ActiveWorkoutHeaderWithActions(), useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutDraftScreen() (+15 more)

### Community 15 - "useSettings"
Cohesion: 0.15
Nodes (28): SetValues, TrackingFieldDefinition, useSettings(), ActiveWorkoutExerciseEditRow(), ProgressionSuggestion(), SetFormRowProps, SetForm(), SetFormProps (+20 more)

### Community 17 - "set-display.utils.ts"
Cohesion: 0.25
Nodes (11): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatDisplaySetPosition() (+3 more)

### Community 18 - "database.integration.test.ts"
Cohesion: 0.07
Nodes (30): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+22 more)

### Community 19 - "expo"
Cohesion: 0.07
Nodes (27): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, package, permissions, predictiveBackGestureEnabled (+19 more)

### Community 20 - "Components"
Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"
Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "devDependencies"
Cohesion: 0.07
Nodes (29): babel-plugin-inline-import, @commitlint/cli, @commitlint/config-conventional, @dotenvx/dotenvx, eslint, eslint-config-expo, expo-atlas, devDependencies (+21 more)

### Community 23 - "exercise-metadata-form.tsx"
Cohesion: 0.18
Nodes (14): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataFormProps, FocusableInput, ExerciseMuscleSelector (+6 more)

### Community 24 - "exercise-picker-filters.tsx"
Cohesion: 0.24
Nodes (8): StyledGestureScrollView, StyledScrollView, BackButtonProps, IconComponent, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilterOption, ExercisePickerFiltersProps

### Community 25 - "exercise-picker-sheet.tsx"
Cohesion: 0.13
Nodes (16): SearchInputIcon(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), ExercisePickerFilters() (+8 more)

### Community 26 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 27 - "DrizzleDb"
Cohesion: 0.13
Nodes (32): NewExerciseScreen(), DrizzleDb, NewExercise, createSeedExercises(), runSeedIfNeeded(), runSeedUpgrades(), upsertAppMeta(), normalizeExerciseName() (+24 more)

### Community 28 - "date.utils.ts"
Cohesion: 0.09
Nodes (25): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, ActiveWorkoutDuration() (+17 more)

### Community 29 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 30 - "useLiveWithFallback"
Cohesion: 0.15
Nodes (19): ExercisesScreen(), buildAlphabetizedExerciseListItems(), getExercisesQuery(), matchesExerciseFilter(), useExercisesScreen(), useExercises(), UseExercisesOptions, ExercisePickerFilter (+11 more)

### Community 31 - "screen.tsx"
Cohesion: 0.19
Nodes (10): EditExerciseScreen(), Screen(), ScreenEdge, ScreenProps, getExerciseByIdQuery(), useCustomExerciseEdit(), parseMuscleList(), AboutInfoSection() (+2 more)

### Community 32 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (18): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+10 more)

### Community 33 - "exercise-history-list.tsx"
Cohesion: 0.15
Nodes (18): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatNumber(), formatScore(), ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList() (+10 more)

### Community 34 - "Set"
Cohesion: 0.15
Nodes (16): Set, ExerciseMetadataForm(), CompletedHistoryEntry, ExerciseHistoryQueryRow, ExerciseHistoryRows, ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseCardProps, ActiveWorkoutExerciseEditListProps (+8 more)

### Community 35 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.07
Nodes (48): WorkoutTemplateDetailLoaded(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem, ReorderableListRenderItemInfo (+40 more)

### Community 36 - "use-historical-workout-start.ts"
Cohesion: 0.23
Nodes (12): useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, useWorkoutTemplates(), UseWorkoutTemplatesOptions, cleanupStaleHistoricalWorkoutDrafts(), createHistoricalWorkoutDraft(), createHistoricalWorkoutDraftFromTemplate(), getLocalNoonTimestamp() (+4 more)

### Community 37 - "common-providers.tsx"
Cohesion: 0.14
Nodes (7): CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost(), appFontAssets

### Community 38 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, knip (+12 more)

### Community 39 - "steps-content.tsx"
Cohesion: 0.05
Nodes (70): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, HealthStepDay, healthStepDays, NewHealthStepDay, StepDayRow(), StepDayRowProps (+62 more)

### Community 40 - "chip.tsx"
Cohesion: 0.27
Nodes (9): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+1 more)

### Community 41 - "rest-timer-notifications.service.ts"
Cohesion: 0.20
Nodes (17): expo-notifications, showSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel() (+9 more)

### Community 42 - "set-duration-picker-sheet.tsx"
Cohesion: 0.12
Nodes (16): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheetContent (+8 more)

### Community 44 - "exercise.repository.ts"
Cohesion: 0.25
Nodes (11): ExerciseListRow(), ExerciseListRowProps, ExerciseRow(), ExerciseRowProps, exerciseListFields, ExerciseListItem, getExerciseUsageExistsQuery(), isExerciseUsed() (+3 more)

### Community 45 - "active-workout-content.tsx"
Cohesion: 0.15
Nodes (12): ActiveWorkoutContentProps, chromeEntering, chromeExiting, chromeLayout, headerEntering, headerExiting, ActiveWorkoutExercisePickerSheet(), ActiveWorkoutExercisePickerSheetCommonProps (+4 more)

### Community 46 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 47 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 48 - "input.tsx"
Cohesion: 0.16
Nodes (11): getStyleColor(), StyledTextInput, TextInputColorBridge, TextInputColorBridgeProps, Input, InputAccessibilityState, InputProps, NativeTextInputProps (+3 more)

### Community 49 - "snackbar.tsx"
Cohesion: 0.36
Nodes (7): dismissSnackbar(), notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore

### Community 50 - "(tabs)/_layout.tsx"
Cohesion: 0.27
Nodes (8): AnimatedTabBar(), styles, triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics(), AppFontFace, appFonts, nativeFontSizes

### Community 52 - "workouts/[id].tsx"
Cohesion: 0.33
Nodes (8): WorkoutDetailLoadedProps, WorkoutDetailScreen(), WorkoutDetailActionsSheet(), WorkoutHistoryExerciseCard(), useWorkoutHistoryDetail(), getWorkoutHistoryDetailRowsQuery(), mapWorkoutHistoryDetailRows(), getWorkoutTemplateBySourceWorkoutIdQuery()

### Community 54 - "TrackingType"
Cohesion: 0.18
Nodes (18): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps (+10 more)

### Community 55 - "overrides"
Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 56 - "useAppTheme"
Cohesion: 0.24
Nodes (9): RootNavigator(), ExercisesLayout(), TabLayout(), LogLayout(), unstable_settings, WorkoutLayout(), ThemeSelectionSection(), useAppTheme() (+1 more)

### Community 57 - "include"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 58 - "exercises/[id].tsx"
Cohesion: 0.46
Nodes (6): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseDetailActionsSheet(), ExerciseProgressChart(), formatMuscleList(), toTitleCase()

### Community 59 - "dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, expo-haptics, expo-linking, dependencies, class-variance-authority, expo-haptics, expo-linking, react-native-safe-area-context (+3 more)

### Community 60 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 63 - "package.json"
Cohesion: 0.13
Nodes (14): engines, node, pnpm, lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, main, name (+6 more)

### Community 64 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 65 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 67 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 68 - "Text"
Cohesion: 0.11
Nodes (22): Card, CardContent, CardProps, PulsatingDot(), ReorderableHandle(), SegmentedControl(), SegmentedControlOption, SegmentedControlProps (+14 more)

### Community 70 - "expo-router"
Cohesion: 0.33
Nodes (7): plugins, expo-font, expo-router, react-native-health-connect, Index(), useIndexRedirect(), isOnboardingCompleted()

### Community 71 - "replaySoundEffect"
Cohesion: 0.39
Nodes (4): playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 72 - "progression-suggestion.utils.ts"
Cohesion: 0.36
Nodes (8): computeEstimated1RM(), roundScore(), areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

### Community 73 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 74 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 75 - "use-active-workout-content.ts"
Cohesion: 0.53
Nodes (5): useActiveWorkoutContent(), UseActiveWorkoutContentParams, getSetsForWorkoutQuery(), getWorkoutExercisesQuery(), getWorkoutExercisesWithExercisesQuery()

### Community 76 - "active/index.tsx"
Cohesion: 0.60
Nodes (3): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), useActiveWorkoutScreen()

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
- **542 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+537 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `text.tsx` to `loading-state.tsx`, `ui/bottom-sheet.tsx`, `icon.tsx`, `workout-log-calendar.tsx`, `settings.repository.ts`, `set-form-row.tsx`, `rest-timer-sheet.tsx`, `useSettings`, `set-display.utils.ts`, `date.utils.ts`, `app-theme-provider.tsx`, `screen.tsx`, `styled/bottom-sheet.tsx`, `exercise-history-list.tsx`, `Set`, `active-workout-exercise-edit-list.tsx`, `steps-content.tsx`, `chip.tsx`, `set-duration-picker-sheet.tsx`, `exercise.repository.ts`, `input.tsx`, `workouts/[id].tsx`, `exercises/[id].tsx`, `Text`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `expo-router` connect `expo-router` to `text.tsx`, `loading-state.tsx`, `ui/bottom-sheet.tsx`, `Workout`, `icon.tsx`, `workout-template.repository.ts`, `workout.repository.ts`, `settings.repository.ts`, `rest-timer-sheet.tsx`, `useDrizzle`, `exercise-picker-sheet.tsx`, `DrizzleDb`, `date.utils.ts`, `screen.tsx`, `Set`, `active-workout-exercise-edit-list.tsx`, `use-historical-workout-start.ts`, `common-providers.tsx`, `steps-content.tsx`, `rest-timer-notifications.service.ts`, `active-workout-content.tsx`, `(tabs)/_layout.tsx`, `workouts/[id].tsx`, `useAppTheme`, `exercises/[id].tsx`, `Text`, `active/index.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Text` connect `Text` to `text.tsx`, `loading-state.tsx`, `ui/bottom-sheet.tsx`, `icon.tsx`, `workout-log-calendar.tsx`, `settings.repository.ts`, `set-form-row.tsx`, `rest-timer-sheet.tsx`, `set-display.utils.ts`, `exercise-metadata-form.tsx`, `exercise-picker-sheet.tsx`, `DrizzleDb`, `date.utils.ts`, `screen.tsx`, `exercise-history-list.tsx`, `active-workout-exercise-edit-list.tsx`, `steps-content.tsx`, `chip.tsx`, `set-duration-picker-sheet.tsx`, `exercise.repository.ts`, `snackbar.tsx`, `workouts/[id].tsx`, `TrackingType`, `exercises/[id].tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _542 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `text.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07922077922077922 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07259528130671507 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09446693657219973 - nodes in this community are weakly interconnected._