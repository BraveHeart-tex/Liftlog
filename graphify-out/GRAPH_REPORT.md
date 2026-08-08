# Graph Report - liftlog  (2026-08-08)

## Corpus Check
- 331 files · ~112,912 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1804 nodes · 5302 edges · 139 communities (76 shown, 63 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3b273e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- active-workout-content.tsx
- ui/bottom-sheet.tsx
- schema.ts
- Workout
- icon.tsx
- tracking.domain.ts
- useLiveWithFallback
- workout-template.repository.ts
- workout-log-content.tsx
- workout.repository.ts
- settings.repository.ts
- set-form-row.tsx
- rest-timer-sheet.tsx
- workouts/[id].tsx
- Set
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
- date.utils.ts
- app-theme-provider.tsx
- use-exercises-screen.ts
- settings-provider.tsx
- step-goal-sheet.tsx
- weight.utils.ts
- use-exercise-track-tab.ts
- active-workout-exercise-edit-list.tsx
- useDrizzle
- common-providers.tsx
- scripts
- useSettings
- chip.tsx
- rest-timer-notifications.service.ts
- set-duration-picker-sheet.tsx
- @expo-google-fonts/instrument-sans
- ExerciseListItem
- use-active-workout-exercise-picker.ts
- tests/tsconfig.json
- knip.json
- exercise-history-list.tsx
- snackbar.tsx
- app/_layout.tsx
- NodeSQLiteStatement
- flash-list.tsx
- babel-preset-expo
- TrackingType
- overrides
- (tabs)/_layout.tsx
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
- useAppTheme
- prettier
- replaySoundEffect
- graphify reference: query, path, explain
- .commitlintrc.json
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

## Communities (139 total, 63 thin omitted)

### Community 0 - "cn"
Cohesion: 0.07
Nodes (51): OnboardingScreen(), weightUnitOptions, StyledScrollView, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig (+43 more)

### Community 1 - "active-workout-content.tsx"
Cohesion: 0.11
Nodes (37): expo-router, EditExerciseScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen() (+29 more)

### Community 2 - "ui/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (41): StyledBottomSheetBackdrop, StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader() (+33 more)

### Community 3 - "schema.ts"
Cohesion: 0.07
Nodes (50): ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData() (+42 more)

### Community 4 - "Workout"
Cohesion: 0.08
Nodes (36): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, ActiveWorkoutHeaderWithActionsProps (+28 more)

### Community 5 - "icon.tsx"
Cohesion: 0.09
Nodes (28): Props, State, StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle (+20 more)

### Community 6 - "tracking.domain.ts"
Cohesion: 0.16
Nodes (18): assertNonNegativeNumber(), assertPositiveNumber(), formatPersonalRecordValue(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), isNonNegativeNumber(), isPositiveNumber() (+10 more)

### Community 7 - "useLiveWithFallback"
Cohesion: 0.08
Nodes (41): getExerciseByIdQuery(), getExercisesQuery(), getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem, ExerciseTopSetPerformance, useCustomExerciseEdit(), buildPersonalRecordSummary(), buildProgressPoints() (+33 more)

### Community 8 - "workout-template.repository.ts"
Cohesion: 0.09
Nodes (37): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, NewTemplateContent(), WorkoutTemplateCardProps (+29 more)

### Community 9 - "workout-log-content.tsx"
Cohesion: 0.07
Nodes (47): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+39 more)

### Community 10 - "workout.repository.ts"
Cohesion: 0.09
Nodes (49): WorkoutDetailLoadedProps, DrizzleDb, NewWorkout, getCompletedSetsForPersonalRecords(), rebuildPersonalRecordsForExerciseInTransaction(), rebuildPersonalRecordsForExercises(), rebuildPersonalRecordsForExercisesInTransaction(), useActiveWorkoutActions() (+41 more)

### Community 11 - "settings.repository.ts"
Cohesion: 0.11
Nodes (32): addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getHealthConnectStepsEnabled(), getRestTimerDuration(), getRestTimerPresets(), getRestTimerPresetsFromValue(), getSetting() (+24 more)

### Community 12 - "set-form-row.tsx"
Cohesion: 0.07
Nodes (31): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone (+23 more)

### Community 13 - "rest-timer-sheet.tsx"
Cohesion: 0.14
Nodes (20): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+12 more)

### Community 14 - "workouts/[id].tsx"
Cohesion: 0.18
Nodes (12): WorkoutDetailScreen(), RenameSheet(), RenameSheetContent, RenameSheetProps, ActiveWorkoutHeaderWithActions(), RenameTemplateSheet(), RenameTemplateSheetProps, BottomSheetInputRef (+4 more)

### Community 15 - "Set"
Cohesion: 0.15
Nodes (27): Set, SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState, DraftSetFormRow (+19 more)

### Community 17 - "set-display.utils.ts"
Cohesion: 0.25
Nodes (12): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatCompletedSets() (+4 more)

### Community 18 - "database-provider.tsx"
Cohesion: 0.10
Nodes (24): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+16 more)

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
Cohesion: 0.14
Nodes (17): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataFormProps, FocusableInput, ExerciseMuscleSelector (+9 more)

### Community 24 - "exercise-picker-filters.tsx"
Cohesion: 0.18
Nodes (11): StyledGestureScrollView, BackButtonProps, IconComponent, ThemeOptionCardProps, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilter, ExercisePickerFilterOption (+3 more)

### Community 25 - "exercise-picker-sheet.tsx"
Cohesion: 0.18
Nodes (8): StyledBottomSheetFlatList, SearchInputIcon(), ExercisePickerSearchInput, ExercisePickerSearchInputProps, ExercisePickerSheetBodyProps, ExercisePickerSheetContent, ExercisePickerSheetProps, SNAP_POINTS

### Community 26 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 27 - "exercise.repository.ts"
Cohesion: 0.17
Nodes (22): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+14 more)

### Community 28 - "date.utils.ts"
Cohesion: 0.15
Nodes (17): SettingsContextValue, MAX_REST_TIMER_PRESETS, RestTimerPreset, ActiveWorkoutDuration(), ActiveWorkoutDurationProps, getDurationDraft(), RestTimerIdleContent(), RestTimerIdleContentProps (+9 more)

### Community 29 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 30 - "use-exercises-screen.ts"
Cohesion: 0.26
Nodes (10): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch() (+2 more)

### Community 31 - "settings-provider.tsx"
Cohesion: 0.32
Nodes (9): SettingsContext, SettingsProvider(), getSettingsQuery(), getSettingsSnapshot(), mapSettingsRows(), ActiveWorkoutStats(), ActiveWorkoutStatsProps, pluralize() (+1 more)

### Community 32 - "step-goal-sheet.tsx"
Cohesion: 0.06
Nodes (29): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetFlatListBase, StyledBottomSheetScrollViewBase, StyledBottomSheetScrollViewRef (+21 more)

### Community 33 - "weight.utils.ts"
Cohesion: 0.30
Nodes (9): formatNumber(), formatScore(), formatExerciseHistorySessionMetadata(), formatRollingProgression(), formatSignedScore(), convertWeightFromKg(), formatWeight(), formatWeightForUnit() (+1 more)

### Community 34 - "use-exercise-track-tab.ts"
Cohesion: 0.10
Nodes (26): ExerciseMetadataForm(), computeEstimated1RM(), roundScore(), ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseCardProps, ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRowProps, ExerciseTrackSection() (+18 more)

### Community 35 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.07
Nodes (47): WorkoutDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem (+39 more)

### Community 36 - "useDrizzle"
Cohesion: 0.13
Nodes (20): Index(), useDrizzle(), useIndexRedirect(), isOnboardingCompleted(), useFinishWorkout(), useHistoricalWorkoutEditStart(), useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions (+12 more)

### Community 37 - "common-providers.tsx"
Cohesion: 0.20
Nodes (5): CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary, AndroidStepsSyncHost(), StepsSyncHost()

### Community 38 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, knip (+12 more)

### Community 39 - "useSettings"
Cohesion: 0.05
Nodes (67): Card, CardContent, CardProps, WheelPicker, WheelPickerBase, WheelPickerComponent, HealthStepDay, AboutInfoSection() (+59 more)

### Community 40 - "chip.tsx"
Cohesion: 0.27
Nodes (9): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+1 more)

### Community 41 - "rest-timer-notifications.service.ts"
Cohesion: 0.21
Nodes (16): showSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), getRestTimerNotificationData() (+8 more)

### Community 42 - "set-duration-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

### Community 44 - "ExerciseListItem"
Cohesion: 0.21
Nodes (12): ExerciseListRow(), ExerciseListRowProps, ExerciseRow(), ExerciseRowProps, ExerciseListItem, getPrimaryMuscleLabel(), ActiveWorkoutContentProps, ActiveWorkoutExerciseListProps (+4 more)

### Community 45 - "use-active-workout-exercise-picker.ts"
Cohesion: 0.28
Nodes (6): ActiveWorkoutExercisePickerSheetCommonProps, ActiveWorkoutExercisePickerSheetProps, ExercisePickerSheet(), useActiveWorkoutExercisePicker(), UseActiveWorkoutExercisePickerParams, RECENT_EXERCISES_LIMIT

### Community 46 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 47 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 48 - "exercise-history-list.tsx"
Cohesion: 0.38
Nodes (6): ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets(), formatWorkoutDate(), getProgressionToneClassName()

### Community 49 - "snackbar.tsx"
Cohesion: 0.36
Nodes (7): dismissSnackbar(), notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore

### Community 50 - "app/_layout.tsx"
Cohesion: 0.16
Nodes (9): plugins, expo-font, expo-notifications, react-native-health-connect, CommonProviders(), DrizzleStudio(), appFontAssets, AppFontFace (+1 more)

### Community 52 - "flash-list.tsx"
Cohesion: 0.50
Nodes (3): FlashListClassNameProps, StyledFlashList, StyledFlashListBase

### Community 54 - "TrackingType"
Cohesion: 0.17
Nodes (18): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps (+10 more)

### Community 55 - "overrides"
Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 56 - "(tabs)/_layout.tsx"
Cohesion: 0.29
Nodes (7): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), useTabBarTheme(), nativeFontSizes

### Community 57 - "include"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 58 - "exercises/[id].tsx"
Cohesion: 0.29
Nodes (9): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseProgressChart(), ExerciseTrackingStyleSelector(), TRACKING_TYPE_ROWS, formatMuscleList(), HistoricalWorkoutHeader(), formatWorkoutDate() (+1 more)

### Community 59 - "dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, clsx, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, clsx, expo-drizzle-studio-plugin (+3 more)

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

### Community 68 - "useAppTheme"
Cohesion: 0.13
Nodes (16): RootNavigator(), unstable_settings, WorkoutLayout(), SegmentedControl(), SegmentedControlOption, SegmentedControlProps, Switch(), SwitchProps (+8 more)

### Community 71 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 73 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 74 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

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
- **543 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+538 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `active-workout-content.tsx` to `cn`, `use-exercise-track-tab.ts`, `useDrizzle`, `useAppTheme`, `Workout`, `useSettings`, `workout-template.repository.ts`, `workout-log-content.tsx`, `rest-timer-notifications.service.ts`, `workouts/[id].tsx`, `app/_layout.tsx`, `TrackingType`, `(tabs)/_layout.tsx`, `exercises/[id].tsx`, `exercise.repository.ts`, `date.utils.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `active-workout-content.tsx`, `ui/bottom-sheet.tsx`, `icon.tsx`, `workout-log-content.tsx`, `set-form-row.tsx`, `rest-timer-sheet.tsx`, `workouts/[id].tsx`, `set-display.utils.ts`, `date.utils.ts`, `app-theme-provider.tsx`, `step-goal-sheet.tsx`, `use-exercise-track-tab.ts`, `active-workout-exercise-edit-list.tsx`, `useSettings`, `chip.tsx`, `set-duration-picker-sheet.tsx`, `ExerciseListItem`, `exercise-history-list.tsx`, `TrackingType`, `exercises/[id].tsx`, `useAppTheme`, `replaySoundEffect`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Text` connect `cn` to `active-workout-content.tsx`, `ui/bottom-sheet.tsx`, `icon.tsx`, `workout-log-content.tsx`, `set-form-row.tsx`, `rest-timer-sheet.tsx`, `workouts/[id].tsx`, `set-display.utils.ts`, `exercise-metadata-form.tsx`, `exercise-picker-sheet.tsx`, `exercise.repository.ts`, `date.utils.ts`, `settings-provider.tsx`, `step-goal-sheet.tsx`, `use-exercise-track-tab.ts`, `active-workout-exercise-edit-list.tsx`, `useSettings`, `chip.tsx`, `set-duration-picker-sheet.tsx`, `ExerciseListItem`, `exercise-history-list.tsx`, `snackbar.tsx`, `TrackingType`, `exercises/[id].tsx`, `useAppTheme`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _543 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.06533646322378717 - nodes in this community are weakly interconnected._
- **Should `active-workout-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10734463276836158 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07918552036199095 - nodes in this community are weakly interconnected._