# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 336 files · ~117,156 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1828 nodes · 5356 edges · 147 communities (82 shown, 65 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62b4321f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workout.repository.ts
- use-steps-screen.ts
- workout-log-content.tsx
- schema.ts
- ui/bottom-sheet.tsx
- text.tsx
- active-workout-content.tsx
- exercise-picker-sheet.tsx
- settings.repository.ts
- date.utils.ts
- workout-template.repository.ts
- Workout
- exercise.repository.ts
- new-template-exercise-list.tsx
- TrackingType
- set-form.utils.ts
- styled/bottom-sheet.tsx
- exercise-history-list.tsx
- DrizzleDb
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- active-workout-exercise-edit-list.tsx
- tracking.domain.ts
- use-exercise-detail.ts
- app-theme-provider.tsx
- workout-preferences-section.tsx
- scripts
- knip.json
- useDrizzle
- chip.tsx
- button.tsx
- snackbar.tsx
- Set
- expo
- exercise-progress-chart.tsx
- ExerciseListItem
- package.json
- Text
- database.integration.test.ts
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- rest-timer.store.ts
- use-exercise-history.ts
- Liftlog
- expo-audio
- common-providers.tsx
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- workouts/[id].tsx
- tests/tsconfig.json
- (tabs)/_layout.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- use-active-workout-actions.ts
- use-exercises-screen.ts
- use-active-workout-content.ts
- use-custom-exercise-edit.ts
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- use-index-redirect.ts
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
- babel-preset-expo
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
- app/_layout.tsx
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
- progression-suggestion.utils.ts
- database-provider.tsx
- useAppTheme
- @types/react
- post-commit
- post-checkout
- @types/node
- @commitlint/cli
- eslint-plugin-unused-imports
- @faker-js/faker
- lint-staged
- knip
- prettier
- prettier-plugin-tailwindcss
- @typescript-eslint/eslint-plugin

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 106 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
5. `Icon()` - 72 edges
6. `Button()` - 62 edges
7. `withDatabaseSpan()` - 58 edges
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

## Communities (147 total, 65 thin omitted)

### Community 0 - "workout.repository.ts"
Cohesion: 0.07
Nodes (44): getSetting(), getWeightUnit(), readSetting(), setWeightUnit(), ActiveWorkoutHeaderWithActions(), useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions() (+36 more)

### Community 1 - "use-steps-screen.ts"
Cohesion: 0.09
Nodes (41): HealthStepDay, StepDayRow(), StepDayRowProps, StepsSummaryCards(), StepsSummaryCardsProps, AndroidStepsSyncHost(), StepsSyncHost(), StepsUnavailableStateProps (+33 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.07
Nodes (47): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, StepsContent(), getAvailabilityLabel(), AnimatedText, CalendarDayButton(), CalendarDayButtonProps (+39 more)

### Community 3 - "schema.ts"
Cohesion: 0.12
Nodes (30): ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData() (+22 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (43): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+35 more)

### Community 5 - "text.tsx"
Cohesion: 0.06
Nodes (44): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+36 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.12
Nodes (32): expo-router, ExerciseDetailScreen(), formatUsageBreakdown(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen() (+24 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): SearchInputIcon(), ExerciseListDataItem, ExercisePickerFilters(), ExercisePickerSearchInput, ExercisePickerSearchInputProps, ExercisePickerSheet(), ExercisePickerSheetBodyProps, ExercisePickerSheetContent (+3 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.10
Nodes (38): SettingsContext, SettingsContextValue, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSettingsQuery() (+30 more)

### Community 9 - "date.utils.ts"
Cohesion: 0.11
Nodes (22): PulsatingDot(), ExerciseProgressChart(), WorkoutLogRow(), WorkoutLogRowProps, ActiveWorkoutDuration(), ActiveWorkoutDurationProps, ActiveWorkoutHeaderDuration(), ActiveWorkoutHeaderDurationProps (+14 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.09
Nodes (42): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, validateStagedCustomExerciseNames(), WorkoutTemplateCardProps (+34 more)

### Community 11 - "Workout"
Cohesion: 0.13
Nodes (25): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, ActiveWorkoutHeaderWithActionsProps (+17 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.19
Nodes (20): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+12 more)

### Community 13 - "new-template-exercise-list.tsx"
Cohesion: 0.22
Nodes (17): WorkoutTemplateDetailLoaded(), NewTemplateExerciseList(), NewTemplateExerciseListProps, TemplateExerciseEditor(), TemplateExerciseEditorRow, useWorkoutTemplateExerciseDraft(), createSupersetId(), flattenSupersetBlocks() (+9 more)

### Community 14 - "TrackingType"
Cohesion: 0.20
Nodes (18): areSameTrackingValues(), formatTrackingValue(), getSetValues(), TrackingType, CompleteOnboardingWithPreferencesParams, ExerciseHistoryListProps, WorkoutExerciseSummary(), WorkoutExerciseSummaryProps (+10 more)

### Community 15 - "set-form.utils.ts"
Cohesion: 0.21
Nodes (15): SetForm(), areSetValuesEqual(), formatFieldValue(), getHasSavedChanges(), getInitialFieldValues(), parseDurationMsInput(), parseFieldValue(), parseTrackingFieldValues() (+7 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (31): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+23 more)

### Community 17 - "exercise-history-list.tsx"
Cohesion: 0.17
Nodes (16): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets(), formatWorkoutDate() (+8 more)

### Community 18 - "DrizzleDb"
Cohesion: 0.22
Nodes (19): DrizzleDb, getCompletedSetsForPersonalRecords(), rebuildPersonalRecordsForExerciseInTransaction(), rebuildPersonalRecordsForExercises(), rebuildPersonalRecordsForExercisesInTransaction(), AddSetValues, getSetStorageValues(), useExerciseTrackActions() (+11 more)

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
Nodes (31): TRACKING_TYPE_DEFINITIONS, SetDurationPickerSheet(), darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface() (+23 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.12
Nodes (16): ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem, ReorderableListRenderItemInfo, StyledReorderableList (+8 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.16
Nodes (18): PersonalRecord, assertNonNegativeNumber(), assertPositiveNumber(), formatPersonalRecordValue(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot(), isNonNegativeNumber() (+10 more)

### Community 26 - "use-exercise-detail.ts"
Cohesion: 0.19
Nodes (19): getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem, buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId(), getLatestAchievedAt() (+11 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "workout-preferences-section.tsx"
Cohesion: 0.13
Nodes (17): BackButtonProps, Card, CardContent, CardProps, IconComponent, Switch(), AboutInfoSection(), minuteItems (+9 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "useDrizzle"
Cohesion: 0.12
Nodes (26): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutDetailLoadedProps, useDrizzle(), useExercises(), UseExercisesOptions, useActiveWorkoutScreen(), useHistoricalWorkoutDraftScreen() (+18 more)

### Community 32 - "chip.tsx"
Cohesion: 0.06
Nodes (46): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+38 more)

### Community 33 - "button.tsx"
Cohesion: 0.10
Nodes (22): Props, State, StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle (+14 more)

### Community 34 - "snackbar.tsx"
Cohesion: 0.20
Nodes (10): dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore (+2 more)

### Community 35 - "Set"
Cohesion: 0.25
Nodes (17): Set, SetValues, TrackingFieldDefinition, useSettings(), SetFormRowProps, SetFormProps, ActiveDurationPickerState, BaseRowView (+9 more)

### Community 36 - "expo"
Cohesion: 0.08
Nodes (25): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, reactCompiler (+17 more)

### Community 37 - "exercise-progress-chart.tsx"
Cohesion: 0.24
Nodes (11): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseProgressPoint (+3 more)

### Community 38 - "ExerciseListItem"
Cohesion: 0.14
Nodes (20): WorkoutDetailLoaded(), ExerciseListItem, ActiveWorkoutContentProps, ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseCardProps, ActiveWorkoutExerciseEditRowProps, ActiveWorkoutExerciseList(), ActiveWorkoutExerciseListProps (+12 more)

### Community 39 - "package.json"
Cohesion: 0.13
Nodes (14): engines, node, pnpm, lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, main, name (+6 more)

### Community 40 - "Text"
Cohesion: 0.11
Nodes (27): StyledGestureScrollView, StyledScrollView, AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames (+19 more)

### Community 41 - "database.integration.test.ts"
Cohesion: 0.10
Nodes (21): AppMeta, healthStepDays, NewHealthStepDay, useOnboardingActions(), UseOnboardingActionsParams, completeOnboardingWithPreferences(), isOnboardingCompleted(), SETTINGS_KEYS (+13 more)

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

### Community 48 - "rest-timer.store.ts"
Cohesion: 0.15
Nodes (17): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerTrigger(), RestTimerTriggerProps, RestTimerWidget() (+9 more)

### Community 49 - "use-exercise-history.ts"
Cohesion: 0.27
Nodes (11): getPersonalRecordsByExerciseQuery(), canLoadExerciseHistoryPage(), CanLoadExerciseHistoryPageOptions, didExerciseHistoryPageFinish(), getNextExerciseHistoryLimit(), useActiveWorkoutExerciseDetail(), getBestScore(), useExerciseHistory() (+3 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "common-providers.tsx"
Cohesion: 0.14
Nodes (16): CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary, RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification() (+8 more)

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
Cohesion: 0.17
Nodes (11): WorkoutDetailScreen(), RenameSheet(), RenameSheetContent, RenameSheetProps, ActiveWorkoutActionsSheet(), RenameTemplateSheet(), RenameTemplateSheetProps, SaveWorkoutTemplateSheet() (+3 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "(tabs)/_layout.tsx"
Cohesion: 0.26
Nodes (9): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+1 more)

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "use-active-workout-actions.ts"
Cohesion: 0.60
Nodes (5): useActiveWorkoutActions(), addExerciseToWorkout(), createCustomExerciseAndAddToWorkout(), insertWorkoutExerciseAtNextOrder(), requireWorkoutAllowsExerciseChanges()

### Community 62 - "use-exercises-screen.ts"
Cohesion: 0.20
Nodes (14): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), getExercisesQuery() (+6 more)

### Community 63 - "use-active-workout-content.ts"
Cohesion: 0.53
Nodes (5): useActiveWorkoutContent(), UseActiveWorkoutContentParams, getSetsForWorkoutQuery(), getWorkoutExercisesQuery(), getWorkoutExercisesWithExercisesQuery()

### Community 64 - "use-custom-exercise-edit.ts"
Cohesion: 0.60
Nodes (4): EditExerciseScreen(), getExerciseByIdQuery(), useCustomExerciseEdit(), parseMuscleList()

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

### Community 80 - "Sentry Database Observability Plan"
Cohesion: 0.20
Nodes (9): Context, Handoff checklist, Phase 0 — Span foundation, Phase 1 — Shared live-query reads, Phase 2 — Repository operations, Phase 3 — Startup and important user flows, Phase 4 — Baseline review and optimization, Rules (+1 more)

### Community 102 - "app/_layout.tsx"
Cohesion: 0.12
Nodes (14): plugins, expo, install, exclude, expo-asset, expo-font, expo-notifications, react-native-health-connect (+6 more)

### Community 105 - "database-observability.test.ts"
Cohesion: 0.22
Nodes (6): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan

### Community 129 - "progression-suggestion.utils.ts"
Cohesion: 0.27
Nodes (10): computeEstimated1RM(), roundScore(), ProgressionSuggestionProps, areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion() (+2 more)

### Community 130 - "database-provider.tsx"
Cohesion: 0.09
Nodes (27): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+19 more)

### Community 131 - "useAppTheme"
Cohesion: 0.12
Nodes (16): RootNavigator(), unstable_settings, WorkoutLayout(), SegmentedControl(), SegmentedControlOption, SegmentedControlProps, SwitchProps, WheelPickerBase (+8 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

## Knowledge Gaps
- **552 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+547 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `app/_layout.tsx` to `workout.repository.ts`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _552 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `workout.repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07402031930333818 - nodes in this community are weakly interconnected._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09308510638297872 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0677555958862674 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12100840336134454 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07676767676767676 - nodes in this community are weakly interconnected._