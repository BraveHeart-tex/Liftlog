# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 337 files · ~117,882 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1837 nodes · 5384 edges · 166 communities (92 shown, 74 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6693ed2a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workout.repository.ts
- active-workout-summary-card.tsx
- workout-log-calendar.tsx
- schema.ts
- ui/bottom-sheet.tsx
- text.tsx
- Set
- exercise-picker-sheet.tsx
- withDatabaseSpan
- use-exercise-detail.ts
- workout-template.repository.ts
- cn
- exercise.repository.ts
- set-duration-picker-sheet.tsx
- workout-exercise-summary.tsx
- set-form.utils.ts
- styled/bottom-sheet.tsx
- rest-timer-sheet.tsx
- useDrizzle
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- active-workout-header-with-actions.tsx
- tracking.domain.ts
- icon.tsx
- app-theme-provider.tsx
- date.utils.ts
- scripts
- knip.json
- Workout
- chip.tsx
- Button
- common-providers.tsx
- exercise-history-list.tsx
- expo
- progress.repository.ts
- button.tsx
- package.json
- template-exercise-editor.tsx
- DrizzleDb
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- android
- workout-log-content.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- new-template-exercise-row.tsx
- tests/tsconfig.json
- @commitlint/cli
- graphify reference: query, path, explain
- .commitlintrc.json
- snackbar.tsx
- use-save-workout-template.ts
- prettier-plugin-tailwindcss
- TrackingType
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- use-rest-timer-notification-responses.ts
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
- plugins
- expo
- expo-asset
- lint-staged
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
- sizes.ts
- @gorhom/bottom-sheet
- husky
- steps-content.tsx
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
- postcss
- active-workout-exercise-edit-list.tsx
- database-provider.tsx
- use-steps-screen.ts
- @types/react
- @typescript-eslint/parser
- useAppTheme
- weight.utils.ts
- ExerciseListItem
- post-commit
- post-checkout
- health-connect.service.ts
- drizzle-orm
- typescript
- steps-display.utils.ts
- workout-preferences-section.tsx
- active-workout-exercise-list.tsx
- toLocalDateKey
- @sentry/react-native
- @commitlint/config-conventional
- @dotenvx/dotenvx
- eslint
- eslint-config-expo
- eslint-plugin-unused-imports
- expo-atlas
- prettier
- @stylistic/eslint-plugin
- tailwindcss
- tsx
- @faker-js/faker
- lint-staged
- knip
- @types/node
- @typescript-eslint/eslint-plugin

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 106 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
5. `Icon()` - 72 edges
6. `Button()` - 62 edges
7. `withDatabaseSpan()` - 59 edges
8. `Workout` - 51 edges
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

## Communities (166 total, 74 thin omitted)

### Community 0 - "workout.repository.ts"
Cohesion: 0.09
Nodes (42): useActiveWorkoutActions(), UseActiveWorkoutActionsParams, getSetStorageValues(), useExerciseTrackActions(), useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), useHistoricalWorkoutEditStart() (+34 more)

### Community 1 - "active-workout-summary-card.tsx"
Cohesion: 0.14
Nodes (15): BackButtonProps, Card, CardContent, CardProps, IconComponent, PulsatingDot(), Switch(), SwitchProps (+7 more)

### Community 2 - "workout-log-calendar.tsx"
Cohesion: 0.12
Nodes (30): StyledActivityIndicator, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS (+22 more)

### Community 3 - "schema.ts"
Cohesion: 0.10
Nodes (32): configureDatabase(), databaseName, databaseOptions, ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName() (+24 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (43): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+35 more)

### Community 5 - "text.tsx"
Cohesion: 0.11
Nodes (25): StyledScrollView, nativeTextDefaults, NativeTextProps, Text, TextProps, TextTone, TextVariant, textVariantConfig (+17 more)

### Community 6 - "Set"
Cohesion: 0.16
Nodes (19): Set, CompletedHistoryEntry, ExerciseHistoryQueryRow, ExerciseHistoryRows, SetValues, ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseCardProps, ExerciseTrackTabProps (+11 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.15
Nodes (13): SearchInputIcon(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), ExercisePickerSearchInput (+5 more)

### Community 8 - "withDatabaseSpan"
Cohesion: 0.05
Nodes (65): numberFormatter, StepGoalSheet(), StepGoalSheetContent, SettingsContext, SettingsContextValue, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset() (+57 more)

### Community 9 - "use-exercise-detail.ts"
Cohesion: 0.29
Nodes (12): getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem, ExerciseTopSetPerformance, buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), getBestSetId() (+4 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.15
Nodes (27): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, WorkoutTemplateCardProps, useWorkoutStart() (+19 more)

### Community 11 - "cn"
Cohesion: 0.09
Nodes (27): OnboardingScreen(), weightUnitOptions, StyledBottomSheetTextInput, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig (+19 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.11
Nodes (33): NewExerciseScreen(), ActiveWorkoutEditExercisesContent(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields (+25 more)

### Community 13 - "set-duration-picker-sheet.tsx"
Cohesion: 0.09
Nodes (19): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheetContent, secondItems, centisecondItems, DurationInputMode (+11 more)

### Community 14 - "workout-exercise-summary.tsx"
Cohesion: 0.27
Nodes (12): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatCompletedSets() (+4 more)

### Community 15 - "set-form.utils.ts"
Cohesion: 0.31
Nodes (14): TrackingFieldDefinition, ActiveDurationPickerState, areSetValuesEqual(), formatFieldValue(), getHasSavedChanges(), getInitialFieldValues(), parseDurationMsInput(), parseFieldValue() (+6 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 17 - "rest-timer-sheet.tsx"
Cohesion: 0.13
Nodes (23): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+15 more)

### Community 18 - "useDrizzle"
Cohesion: 0.08
Nodes (45): ExercisesScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutDetailLoadedProps, useDrizzle(), buildAlphabetizedExerciseListItems(), getExercisesQuery(), useCustomExerciseEdit() (+37 more)

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
Nodes (34): TRACKING_TYPE_DEFINITIONS, useSettings(), darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface() (+26 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "active-workout-header-with-actions.tsx"
Cohesion: 0.32
Nodes (5): RenameSheet(), ActiveWorkoutHeaderWithActions(), RenameTemplateSheet(), RenameTemplateSheetProps, useWorkoutDelete()

### Community 25 - "tracking.domain.ts"
Cohesion: 0.17
Nodes (15): assertNonNegativeNumber(), assertPositiveNumber(), formatNumber(), getDurationSecondsFromMs(), isNonNegativeNumber(), isPositiveNumber(), TrackingTypeDefinition, trackingTypeSet (+7 more)

### Community 26 - "icon.tsx"
Cohesion: 0.13
Nodes (15): Props, State, AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames (+7 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "date.utils.ts"
Cohesion: 0.11
Nodes (20): ActiveWorkoutDuration(), ActiveWorkoutDurationProps, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, getDurationDraft(), RestTimerIdleContentProps (+12 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "Workout"
Cohesion: 0.15
Nodes (19): ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ActiveWorkoutContentProps, ActiveWorkoutExerciseEditListProps, ActiveWorkoutHeaderDurationProps, ActiveWorkoutHeaderWithActionsProps (+11 more)

### Community 32 - "chip.tsx"
Cohesion: 0.07
Nodes (34): StyledGestureScrollView, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig (+26 more)

### Community 33 - "Button"
Cohesion: 0.11
Nodes (39): expo-router, EditExerciseScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen() (+31 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.12
Nodes (10): RootNavigator(), CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost(), appFontAssets (+2 more)

### Community 35 - "exercise-history-list.tsx"
Cohesion: 0.20
Nodes (13): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatPersonalRecordValue(), ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets() (+5 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "progress.repository.ts"
Cohesion: 0.13
Nodes (27): buildExerciseHistory(), getCompletedSetsForPersonalRecords(), getExerciseHistoryQuery(), getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows(), rebuildPersonalRecordsForExercisesInTransaction(), computeEstimated1RM(), getDurationMs() (+19 more)

### Community 38 - "button.tsx"
Cohesion: 0.15
Nodes (16): ExerciseDetailScreen(), formatUsageBreakdown(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants, ButtonVariant (+8 more)

### Community 39 - "package.json"
Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 40 - "template-exercise-editor.tsx"
Cohesion: 0.17
Nodes (15): useExercises(), UseExercisesOptions, TemplateExerciseEditor(), TemplateExerciseEditorProps, DraftExerciseRow, reconcileDraftRows(), SaveWorkoutTemplateExerciseDraftResult, useWorkoutTemplateExerciseDraft() (+7 more)

### Community 41 - "DrizzleDb"
Cohesion: 0.11
Nodes (26): Index(), DrizzleDb, AppMeta, createSeedExercises(), runSeedIfNeeded(), runSeedUpgrades(), upsertAppMeta(), getExerciseUsageExistsQuery() (+18 more)

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

### Community 48 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 49 - "workout-log-content.tsx"
Cohesion: 0.16
Nodes (16): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, formatSelectedDate(), selectedDayEntering, selectedDayExiting, WorkoutLogContent(), getDateKeyTimestamp() (+8 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.32
Nodes (10): RestTimerHost(), cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), isGranted(), requestRestTimerNotificationPermission(), RestTimerNotificationContext, RestTimerNotificationData (+2 more)

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "new-template-exercise-row.tsx"
Cohesion: 0.14
Nodes (13): ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItemInfo, StyledReorderableList, StyledReorderableListBase (+5 more)

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "snackbar.tsx"
Cohesion: 0.36
Nodes (7): dismissSnackbar(), notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore

### Community 62 - "use-save-workout-template.ts"
Cohesion: 0.38
Nodes (4): showSnackbar(), NewTemplateContent(), useSaveWorkoutTemplate(), createWorkoutTemplate()

### Community 64 - "TrackingType"
Cohesion: 0.25
Nodes (14): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseProgressPoint (+6 more)

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

### Community 73 - "use-rest-timer-notification-responses.ts"
Cohesion: 0.53
Nodes (5): useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, getRestTimerNotificationData(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification()

### Community 80 - "Sentry Database Observability Plan"
Cohesion: 0.20
Nodes (9): Context, Handoff checklist, Phase 0 — Span foundation, Phase 1 — Shared live-query reads, Phase 2 — Repository operations, Phase 3 — Startup and important user flows, Phase 4 — Baseline review and optimization, Rules (+1 more)

### Community 86 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 89 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 102 - "sizes.ts"
Cohesion: 0.20
Nodes (11): AnimatedTabBar(), styles, TabLayout(), SegmentedControlOption, SegmentedControlProps, triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+3 more)

### Community 105 - "steps-content.tsx"
Cohesion: 0.17
Nodes (11): StepsActionsSheet(), StepsContent(), StepsEmptyState(), StepsUnavailableState(), StepsUnavailableStateProps, TodayStepRadialCard(), HealthConnectAvailability, getAvailabilityLabel() (+3 more)

### Community 129 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.18
Nodes (20): WorkoutDetailLoaded(), ReorderableList(), ReorderableListRenderItem, EditableWorkoutExerciseRow, NewTemplateExerciseList(), NewTemplateExerciseListProps, pairControlEaseOut, PairWithNextControl() (+12 more)

### Community 130 - "database-provider.tsx"
Cohesion: 0.10
Nodes (23): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+15 more)

### Community 131 - "use-steps-screen.ts"
Cohesion: 0.23
Nodes (13): healthStepDays, AndroidStepsSyncHost(), openStepHealthConnectSettings(), syncStepDaysFromHealthConnect(), EMPTY_PERMISSION_STATE, getStats(), SyncState, useStepsScreen() (+5 more)

### Community 134 - "useAppTheme"
Cohesion: 0.36
Nodes (6): ExercisesLayout(), LogLayout(), unstable_settings, WorkoutLayout(), useAppTheme(), useTabBarTheme()

### Community 139 - "weight.utils.ts"
Cohesion: 0.27
Nodes (9): ActiveWorkoutExerciseEditRow(), ActiveWorkoutExerciseEditRowProps, ProgressionSuggestion(), ProgressionSuggestionProps, ProgressionSuggestionData, convertWeightFromKg(), formatWeight(), formatWeightForUnit() (+1 more)

### Community 140 - "ExerciseListItem"
Cohesion: 0.19
Nodes (12): ExerciseListRow(), ExerciseListRowProps, ExerciseRow(), ExerciseRowProps, ExerciseListItem, getPrimaryMuscleLabel(), ActiveWorkoutExercisePickerSheetCommonProps, ActiveWorkoutExercisePickerSheetProps (+4 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 143 - "health-connect.service.ts"
Cohesion: 0.22
Nodes (13): NewHealthStepDay, BACKGROUND_PERMISSION, getHealthConnectAvailability(), getStepPermissionState(), GrantedPermission, hasPermission(), HISTORY_PERMISSION, initializeHealthConnect() (+5 more)

### Community 146 - "steps-display.utils.ts"
Cohesion: 0.31
Nodes (10): HealthStepDay, StepDayRow(), StepDayRowProps, StepsSummaryCards(), StepsSummaryCardsProps, StepStats, formatStepMonthDay(), formatSteps() (+2 more)

### Community 147 - "workout-preferences-section.tsx"
Cohesion: 0.24
Nodes (7): SegmentedControl(), AboutInfoSection(), RestTimerSettingSheet(), THEME_OPTIONS, ThemeSelectionSection(), WEIGHT_UNIT_OPTIONS, WorkoutPreferencesSection()

### Community 148 - "active-workout-exercise-list.tsx"
Cohesion: 0.24
Nodes (8): ActiveWorkoutExerciseEditList, ActiveWorkoutExerciseList(), ActiveWorkoutExerciseListProps, DisplayWorkoutExerciseRow, listEntering, listExiting, useActiveWorkoutExerciseList(), UseActiveWorkoutExerciseListParams

### Community 149 - "toLocalDateKey"
Cohesion: 0.33
Nodes (8): getTodayDateKeyFromTimestamp(), readDailyStepTotals(), getLocalDayRange(), getRecentLocalDayRanges(), getTodayDateKey(), LocalDayRange, withWorkoutDateKey(), toLocalDateKey()

### Community 150 - "@sentry/react-native"
Cohesion: 0.50
Nodes (4): expo, install, exclude, @sentry/react-native

## Knowledge Gaps
- **557 isolated node(s):** `Data Access`, `Observability`, `Context`, `Rules`, `Phase 0 — Span foundation` (+552 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `@sentry/react-native` to `withDatabaseSpan`, `common-providers.tsx`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **What connects `Data Access`, `Observability`, `Context` to the rest of the system?**
  _557 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `workout.repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._
- **Should `active-workout-summary-card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._
- **Should `workout-log-calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12222222222222222 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07727272727272727 - nodes in this community are weakly interconnected._