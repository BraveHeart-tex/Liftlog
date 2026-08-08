# Graph Report - liftlog (2026-08-08)

## Corpus Check

- 330 files · ~115,420 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1783 nodes · 5276 edges · 140 communities (77 shown, 63 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `e3db753d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- cn
- active-workout-content.tsx
- workouts/[id].tsx
- schema.ts
- Workout
- Text
- use-active-workout-exercise-draft.ts
- useDrizzle
- workout-template.repository.ts
- workout-log-content.tsx
- workout.repository.ts
- settings.repository.ts
- set-form-row.tsx
- rest-timer-sheet.tsx
- use-exercise-detail.ts
- Set
- active-workout-exercise-edit-list.tsx
- set-display.utils.ts
- database-provider.tsx
- expo
- Components
- migrations.js
- devDependencies
- chip.tsx
- workout-preferences-section.tsx
- exercise-picker-sheet.tsx
- What You Must Do When Invoked
- DrizzleDb
- rest-timer-preset-editor-sheet.tsx
- app-theme-provider.tsx
- android
- use-exercise-history.ts
- styled/bottom-sheet.tsx
- exercise-history-list.tsx
- tracking.domain.ts
- template-exercise-editor.tsx
- onboarding.repository.ts
- use-rest-timer-notification-responses.ts
- scripts
- use-steps-screen.ts
- plugins
- rest-timer-notifications.service.ts
- set-duration-picker-sheet.tsx
- @expo-google-fonts/instrument-sans
- ExerciseListItem
- set-form.tsx
- ignoreDependencies
- snackbar.tsx
- common-providers.tsx
- NodeSQLiteDatabase
- TrackingType
- overrides
- useAppTheme
- include
- date.utils.ts
- dependencies
- Product
- step-goal-sheet.tsx
- package.json
- Liftlog
- graphify reference: extra exports and benchmark
- nativewind-env.d.ts
- segmented-control.tsx
- replaySoundEffect
- wheel-picker.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- lint-staged
- NodeSQLiteStatement
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
- clsx
- extraction-spec.md
- @commitlint/cli
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- drizzle-orm
- eslint
- eslint-plugin-unused-imports
- expo
- expo-audio
- expo-blur
- expo-build-properties
- expo-constants
- expo-dev-client
- expo-font
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
- react-native-worklets
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
- @types/react
- typescript
- @typescript-eslint/eslint-plugin

## God Nodes (most connected - your core abstractions)

1. `DrizzleDb` - 107 edges
2. `cn()` - 102 edges
3. `Text` - 88 edges
4. `useDrizzle()` - 81 edges
5. `Icon()` - 73 edges
6. `Button()` - 62 edges
7. `Workout` - 52 edges
8. `expo-router` - 43 edges
9. `useLiveWithFallback()` - 41 edges
10. `ExerciseListItem` - 37 edges

## Surprising Connections (you probably didn't know these)

- `TabLayout()` --calls--> `useTabBarTheme()` [EXTRACTED]
  src/app/(tabs)/\_layout.tsx → src/theme/app-theme-provider.tsx
- `RootNavigator()` --calls--> `useAppTheme()` [EXTRACTED]
  src/app/\_layout.tsx → src/theme/app-theme-provider.tsx
- `getWorkoutExerciseByIdQuery()` --references--> `DrizzleDb` [EXTRACTED]
  src/features/workouts/workout.repository.ts → src/db/client.ts
- `ActiveWorkoutHeaderDurationProps` --references--> `Workout` [EXTRACTED]
  src/features/workouts/components/active-workout-header-duration.tsx → src/db/schema.ts
- `CompletedSetMutationResult` --references--> `Set` [EXTRACTED]
  src/features/workouts/workout.repository.ts → src/db/schema.ts

## Import Cycles

- None detected.

## Communities (140 total, 63 thin omitted)

### Community 0 - "cn"

Cohesion: 0.07
Nodes (41): OnboardingScreen(), weightUnitOptions, StyledBottomSheetTextInput, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig (+33 more)

### Community 1 - "active-workout-content.tsx"

Cohesion: 0.10
Nodes (38): expo-router, EditExerciseScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen() (+30 more)

### Community 2 - "workouts/[id].tsx"

Cohesion: 0.07
Nodes (48): WorkoutDetailScreen(), StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader() (+40 more)

### Community 3 - "schema.ts"

Cohesion: 0.10
Nodes (31): buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData(), LOAD_PROFILES, LoadProfile, maybeCreatePr() (+23 more)

### Community 4 - "Workout"

Cohesion: 0.11
Nodes (25): ActiveWorkoutEditExercisesContentProps, PulsatingDot(), Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps (+17 more)

### Community 5 - "Text"

Cohesion: 0.07
Nodes (41): Props, State, StyledActivityIndicator, FlatListClassNameProps, StyledFlatList, StyledFlatListBase, StyledScrollView, Button() (+33 more)

### Community 6 - "use-active-workout-exercise-draft.ts"

Cohesion: 0.18
Nodes (15): ActiveWorkoutEditExercisesContent(), DraftExerciseRow, SaveActiveWorkoutExerciseDraftResult, useActiveWorkoutExerciseDraft(), UseActiveWorkoutExerciseDraftParams, useReorderWorkoutExercises(), useSaveActiveWorkoutExerciseDraft(), useSaveWorkoutExerciseEdits() (+7 more)

### Community 7 - "useDrizzle"

Cohesion: 0.08
Nodes (42): ExercisesScreen(), useDrizzle(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel() (+34 more)

### Community 8 - "workout-template.repository.ts"

Cohesion: 0.11
Nodes (34): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, showSnackbar(), Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, useSaveWorkoutTemplate() (+26 more)

### Community 9 - "workout-log-content.tsx"

Cohesion: 0.09
Nodes (44): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+36 more)

### Community 10 - "workout.repository.ts"

Cohesion: 0.08
Nodes (38): WorkoutDetailLoadedProps, useActiveWorkoutActions(), UseActiveWorkoutActionsParams, useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), useHistoricalWorkoutEditStart(), useHistoricalWorkoutStart() (+30 more)

### Community 11 - "settings.repository.ts"

Cohesion: 0.12
Nodes (36): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getHealthConnectStepsEnabled(), getRestTimerDuration(), getRestTimerPresets() (+28 more)

### Community 12 - "set-form-row.tsx"

Cohesion: 0.10
Nodes (23): SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps, toneProgress, SetFormRowActions() (+15 more)

### Community 13 - "rest-timer-sheet.tsx"

Cohesion: 0.15
Nodes (20): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+12 more)

### Community 14 - "use-exercise-detail.ts"

Cohesion: 0.19
Nodes (18): getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId(), getLatestAchievedAt(), getSetAchievedAt() (+10 more)

### Community 15 - "Set"

Cohesion: 0.16
Nodes (26): Set, SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState, DraftSetFormRow (+18 more)

### Community 16 - "active-workout-exercise-edit-list.tsx"

Cohesion: 0.11
Nodes (23): ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem, ReorderableListRenderItemInfo (+15 more)

### Community 17 - "set-display.utils.ts"

Cohesion: 0.26
Nodes (11): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatDisplaySetPosition() (+3 more)

### Community 18 - "database-provider.tsx"

Cohesion: 0.08
Nodes (37): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+29 more)

### Community 19 - "expo"

Cohesion: 0.12
Nodes (15): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, newArchEnabled (+7 more)

### Community 20 - "Components"

Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"

Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "devDependencies"

Cohesion: 0.07
Nodes (27): babel-plugin-inline-import, babel-preset-expo, @commitlint/config-conventional, @dotenvx/dotenvx, eslint-config-expo, expo-atlas, husky, devDependencies (+19 more)

### Community 23 - "chip.tsx"

Cohesion: 0.05
Nodes (51): ExerciseDetailScreen(), formatUsageBreakdown(), StyledGestureScrollView, BackButtonProps, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants (+43 more)

### Community 24 - "workout-preferences-section.tsx"

Cohesion: 0.16
Nodes (13): Card, CardContent, CardProps, AboutInfoSection(), RestTimerSettingSheet(), StepsSection(), THEME_OPTIONS, ThemeSelectionSection() (+5 more)

### Community 25 - "exercise-picker-sheet.tsx"

Cohesion: 0.14
Nodes (11): ActiveWorkoutExercisePickerSheet(), ActiveWorkoutExercisePickerSheetCommonProps, ActiveWorkoutExercisePickerSheetProps, ExercisePickerRow, ExercisePickerSearchInput, ExercisePickerSearchInputProps, ExercisePickerSheet(), ExercisePickerSheetBodyProps (+3 more)

### Community 26 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 27 - "DrizzleDb"

Cohesion: 0.10
Nodes (47): NewExerciseScreen(), DrizzleDb, createTrackedSet(), ForeignKeyListRow, getHistoricalPersonalRecordRows(), getPersonalRecordSetIds(), insertHistoricalWorkout(), MigrationJournal (+39 more)

### Community 28 - "rest-timer-preset-editor-sheet.tsx"

Cohesion: 0.11
Nodes (20): SettingsContextValue, MAX_REST_TIMER_PRESETS, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems (+12 more)

### Community 29 - "app-theme-provider.tsx"

Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 30 - "android"

Cohesion: 0.17
Nodes (12): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, package, permissions, predictiveBackGestureEnabled (+4 more)

### Community 31 - "use-exercise-history.ts"

Cohesion: 0.38
Nodes (8): getPersonalRecordsByExercise(), getPersonalRecordsByExerciseQuery(), canLoadExerciseHistoryPage(), CanLoadExerciseHistoryPageOptions, didExerciseHistoryPageFinish(), getNextExerciseHistoryLimit(), getBestScore(), useExerciseHistory()

### Community 32 - "styled/bottom-sheet.tsx"

Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 33 - "exercise-history-list.tsx"

Cohesion: 0.15
Nodes (18): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatNumber(), formatScore(), ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList() (+10 more)

### Community 34 - "tracking.domain.ts"

Cohesion: 0.19
Nodes (17): assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), formatPersonalRecordValue(), getDurationMs(), getSetScore(), isNonNegativeNumber(), isPositiveNumber() (+9 more)

### Community 35 - "template-exercise-editor.tsx"

Cohesion: 0.14
Nodes (25): WorkoutTemplateDetailLoaded(), NewTemplateExerciseList(), NewTemplateExerciseListProps, TemplateExerciseEditor(), TemplateExerciseEditorProps, TemplateExerciseEditorRow, DraftExerciseRow, reconcileDraftRows() (+17 more)

### Community 36 - "onboarding.repository.ts"

Cohesion: 0.39
Nodes (5): Index(), useIndexRedirect(), CompleteOnboardingWithPreferencesParams, isOnboardingCompleted(), SETTINGS_KEYS

### Community 37 - "use-rest-timer-notification-responses.ts"

Cohesion: 0.53
Nodes (5): useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, getRestTimerNotificationData(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification()

### Community 38 - "scripts"

Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, knip (+11 more)

### Community 39 - "use-steps-screen.ts"

Cohesion: 0.08
Nodes (46): HealthStepDay, NewHealthStepDay, StepDayRow(), StepDayRowProps, StepsContent(), StepsSummaryCards(), StepsSummaryCardsProps, AndroidStepsSyncHost() (+38 more)

### Community 40 - "plugins"

Cohesion: 0.50
Nodes (4): plugins, expo-font, expo-notifications, react-native-health-connect

### Community 41 - "rest-timer-notifications.service.ts"

Cohesion: 0.33
Nodes (9): cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), isGranted(), requestRestTimerNotificationPermission(), RestTimerNotificationContext, RestTimerNotificationData, scheduleRestTimerNotification() (+1 more)

### Community 42 - "set-duration-picker-sheet.tsx"

Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

### Community 44 - "ExerciseListItem"

Cohesion: 0.17
Nodes (14): ExerciseListRowProps, ExerciseRowProps, ExerciseListItem, ActiveWorkoutExerciseEditList, ActiveWorkoutExerciseList(), ActiveWorkoutExerciseListProps, DisplayWorkoutExerciseRow, listEntering (+6 more)

### Community 46 - "set-form.tsx"

Cohesion: 0.14
Nodes (16): useSettings(), ExerciseTrackTabProps, ProgressionSuggestion(), ProgressionSuggestionProps, ProgressionSuggestionData, darkFeedbackColors, SetFormEmptyState(), emptyStateEntering (+8 more)

### Community 47 - "ignoreDependencies"

Cohesion: 0.13
Nodes (14): ignore, ignoreBinaries, ignoreDependencies, $schema, tags, babel.config.js, babel-plugin-inline-import, babel-preset-expo (+6 more)

### Community 49 - "snackbar.tsx"

Cohesion: 0.31
Nodes (8): dismissSnackbar(), notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore, RestTimerHost()

### Community 50 - "common-providers.tsx"

Cohesion: 0.12
Nodes (9): RootNavigator(), CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost(), appFontAssets (+1 more)

### Community 54 - "TrackingType"

Cohesion: 0.17
Nodes (18): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExercisePersonalRecordSummaryItem (+10 more)

### Community 55 - "overrides"

Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 56 - "useAppTheme"

Cohesion: 0.23
Nodes (9): ExercisesLayout(), LogLayout(), unstable_settings, WorkoutLayout(), Switch(), SwitchProps, TodayStepRadialCard(), useAppTheme() (+1 more)

### Community 57 - "include"

Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/\*.ts, nativewind-env.d.ts, **/_.ts, \*\*/_.tsx, compilerOptions, paths (+3 more)

### Community 58 - "date.utils.ts"

Cohesion: 0.18
Nodes (15): WorkoutDetailLoaded(), ExerciseProgressChart(), WorkoutLogRow(), ActiveWorkoutHeaderDuration(), ActiveWorkoutHeaderDurationProps, HistoricalWorkoutHeader(), RecentWorkoutCard(), WorkoutTemplateCard() (+7 more)

### Community 59 - "dependencies"

Cohesion: 0.18
Nodes (11): class-variance-authority, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo-drizzle-studio-plugin, expo-router, react-native-safe-area-context (+3 more)

### Community 60 - "Product"

Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 62 - "step-goal-sheet.tsx"

Cohesion: 0.33
Nodes (6): numberFormatter, StepGoalSheet(), StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS

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

### Community 68 - "segmented-control.tsx"

Cohesion: 0.14
Nodes (14): AnimatedTabBar(), styles, TabLayout(), SegmentedControl(), SegmentedControlOption, SegmentedControlProps, LogHeader(), LogHeaderProps (+6 more)

### Community 71 - "replaySoundEffect"

Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 72 - "wheel-picker.tsx"

Cohesion: 0.33
Nodes (5): WheelPicker, WheelPickerBase, WheelPickerComponent, SetDurationWheel(), SetDurationWheelProps

### Community 73 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 74 - ".commitlintrc.json"

Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 77 - "lint-staged"

Cohesion: 0.40
Nodes (5): lint-staged, **/\*.{md,json}, **/\*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

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

- **537 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+532 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `active-workout-content.tsx`, `workouts/[id].tsx`, `Text`, `workout-log-content.tsx`, `set-form-row.tsx`, `rest-timer-sheet.tsx`, `active-workout-exercise-edit-list.tsx`, `set-display.utils.ts`, `chip.tsx`, `workout-preferences-section.tsx`, `rest-timer-preset-editor-sheet.tsx`, `app-theme-provider.tsx`, `exercise-history-list.tsx`, `template-exercise-editor.tsx`, `set-duration-picker-sheet.tsx`, `TrackingType`, `useAppTheme`, `date.utils.ts`, `segmented-control.tsx`, `replaySoundEffect`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `expo-router` connect `active-workout-content.tsx` to `cn`, `workouts/[id].tsx`, `onboarding.repository.ts`, `Text`, `segmented-control.tsx`, `use-steps-screen.ts`, `plugins`, `workout-log-content.tsx`, `Workout`, `workout.repository.ts`, `use-rest-timer-notification-responses.ts`, `workout-template.repository.ts`, `set-form.tsx`, `common-providers.tsx`, `TrackingType`, `useAppTheme`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Text` connect `Text` to `cn`, `active-workout-content.tsx`, `workouts/[id].tsx`, `Workout`, `workout-log-content.tsx`, `set-form-row.tsx`, `rest-timer-sheet.tsx`, `active-workout-exercise-edit-list.tsx`, `set-display.utils.ts`, `chip.tsx`, `workout-preferences-section.tsx`, `exercise-picker-sheet.tsx`, `rest-timer-preset-editor-sheet.tsx`, `exercise-history-list.tsx`, `template-exercise-editor.tsx`, `use-steps-screen.ts`, `set-duration-picker-sheet.tsx`, `set-form.tsx`, `snackbar.tsx`, `TrackingType`, `date.utils.ts`, `step-goal-sheet.tsx`, `segmented-control.tsx`, `wheel-picker.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _537 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06599326599326599 - nodes in this community are weakly interconnected._
- **Should `active-workout-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1041776837652036 - nodes in this community are weakly interconnected._
- **Should `workouts/[id].tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0689484126984127 - nodes in this community are weakly interconnected._
