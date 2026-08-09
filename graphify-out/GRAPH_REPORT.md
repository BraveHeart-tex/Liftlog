# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 335 files · ~116,407 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1825 nodes · 5280 edges · 171 communities (95 shown, 76 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dcdf0521`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workout.repository.ts
- use-steps-screen.ts
- workout-log-calendar.tsx
- schema.ts
- ui/bottom-sheet.tsx
- text.tsx
- active-workout-content.tsx
- exercise-picker-sheet.tsx
- settings.repository.ts
- workout-log-content.tsx
- workout-template.repository.ts
- exercise-category-selector.tsx
- exercise.repository.ts
- cn
- weight.utils.ts
- Set
- styled/bottom-sheet.tsx
- exercise-history-list.tsx
- DrizzleDb
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- use-workout-start.ts
- tracking.domain.ts
- use-exercise-detail.ts
- app-theme-provider.tsx
- steps-section.tsx
- scripts
- knip.json
- useDrizzle
- chip.tsx
- button.tsx
- common-providers.tsx
- dev-seed.ts
- expo
- TrackingType
- ExerciseListItem
- package.json
- icon.tsx
- onboarding.repository.ts
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- rest-timer-sheet.tsx
- useSettings
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- active-workout-header-with-actions.tsx
- tests/tsconfig.json
- useAppTheme
- graphify reference: query, path, explain
- .commitlintrc.json
- useLiveWithFallback
- use-exercises-screen.ts
- android
- use-live-with-fallback.hook.ts
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
- use-historical-workout-start.ts
- progression-suggestion.utils.ts
- database-provider.tsx
- segmented-control.tsx
- @types/react
- exercise-metadata-form.tsx
- use-rest-timer-notification-responses.ts
- exercise-picker-filters.tsx
- plugins
- post-commit
- post-checkout
- @stylistic/eslint-plugin
- typescript
- use-workout-log.ts
- @dotenvx/dotenvx
- string.utils.ts
- @types/node
- lint-staged
- use-historical-workout-edit-screen.ts
- ScreenErrorBoundary
- exercise-tracking-style-selector.tsx
- @sentry/react-native
- templates/new.tsx
- @commitlint/cli
- @commitlint/config-conventional
- eslint
- eslint-config-expo
- eslint-plugin-unused-imports
- expo-atlas
- @faker-js/faker
- lint-staged
- knip
- postcss
- prettier
- prettier-plugin-tailwindcss
- tailwindcss
- tsx
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 105 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
5. `Icon()` - 72 edges
6. `Button()` - 62 edges
7. `Workout` - 51 edges
8. `expo-router` - 43 edges
9. `useLiveWithFallback()` - 42 edges
10. `ExerciseListItem` - 35 edges

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

## Communities (171 total, 76 thin omitted)

### Community 0 - "workout.repository.ts"
Cohesion: 0.06
Nodes (51): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutLogRowProps, ActiveWorkoutContentProps, ActiveWorkoutHeaderDurationProps, ActiveWorkoutHeaderWithActionsProps, ActiveWorkoutSummaryCardProps (+43 more)

### Community 1 - "use-steps-screen.ts"
Cohesion: 0.08
Nodes (45): HealthStepDay, StepDayRow(), StepDayRowProps, StepsContent(), StepsSummaryCards(), StepsSummaryCardsProps, AndroidStepsSyncHost(), StepsSyncHost() (+37 more)

### Community 2 - "workout-log-calendar.tsx"
Cohesion: 0.13
Nodes (29): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+21 more)

### Community 3 - "schema.ts"
Cohesion: 0.07
Nodes (42): configureDatabase(), databaseName, databaseOptions, ForeignKeysPragma, ForeignKeyViolation, runDatabaseMigrations(), schema, AppMeta (+34 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (43): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState, BottomSheetSafeContent() (+35 more)

### Community 5 - "text.tsx"
Cohesion: 0.11
Nodes (22): Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants, nativeTextDefaults, NativeTextProps (+14 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.14
Nodes (30): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutDetailScreen(), WorkoutTemplateDetailScreen(), BackButton() (+22 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.16
Nodes (11): SearchInputIcon(), ExerciseListDataItem, ExercisePickerFilters(), ExercisePickerRow, ExercisePickerSearchInput, ExercisePickerSearchInputProps, ExercisePickerSheet(), ExercisePickerSheetBodyProps (+3 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.14
Nodes (31): SettingsContext, SettingsContextValue, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSetting() (+23 more)

### Community 9 - "workout-log-content.tsx"
Cohesion: 0.11
Nodes (18): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, BottomSheetContent(), PulsatingDot(), ExerciseProgressChart(), selectedDayEntering, selectedDayExiting (+10 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.18
Nodes (21): Exercise, WorkoutTemplate, WorkoutTemplateExercise, WorkoutTemplateCardProps, useSaveWorkoutTemplate(), DraftExerciseRow, reconcileDraftRows(), SaveWorkoutTemplateExerciseDraftResult (+13 more)

### Community 11 - "exercise-category-selector.tsx"
Cohesion: 0.24
Nodes (9): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ExerciseMetadataFormProps, BaseCategoryFilter, CATEGORY_FILTERS, ExerciseCategory (+1 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.18
Nodes (20): NewExerciseScreen(), NewExercise, normalizeExerciseName(), createExercise(), CustomExerciseDetailsUpdate, exerciseListFields, ExerciseNameConflictError, getExerciseUsageExistsQuery() (+12 more)

### Community 13 - "cn"
Cohesion: 0.12
Nodes (25): OnboardingScreen(), weightUnitOptions, HapticFeedback, impactFeedbackStyles, NativePressableProps, PressableSurface(), PressableSurfaceProps, triggerHapticFeedback() (+17 more)

### Community 14 - "weight.utils.ts"
Cohesion: 0.18
Nodes (17): areSameTrackingValues(), formatTrackingValue(), getSetValues(), ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseCardProps, WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord() (+9 more)

### Community 15 - "Set"
Cohesion: 0.14
Nodes (29): Set, SetValues, TRACKING_TYPE_DEFINITIONS, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState (+21 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (31): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+23 more)

### Community 17 - "exercise-history-list.tsx"
Cohesion: 0.20
Nodes (13): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatPersonalRecordValue(), ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets() (+5 more)

### Community 18 - "DrizzleDb"
Cohesion: 0.15
Nodes (25): DrizzleDb, archiveExercise(), deleteExercise(), removeCustomExercise(), useActiveWorkoutActions(), UseActiveWorkoutActionsParams, AddSetValues, getSetStorageValues() (+17 more)

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
Cohesion: 0.10
Nodes (22): SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps, toneProgress, SetFormRowActions() (+14 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "use-workout-start.ts"
Cohesion: 0.20
Nodes (16): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, useWorkoutStart(), activeWorkoutRoute, useWorkoutTemplateDetail(), formatWorkoutName(), resolveTemplateName(), resolveWorkoutDate() (+8 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.14
Nodes (22): PersonalRecord, buildProgressPoints(), getBestSetId(), assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), getDurationMs(), getDurationSecondsFromMs() (+14 more)

### Community 26 - "use-exercise-detail.ts"
Cohesion: 0.14
Nodes (26): EditExerciseScreen(), getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), useCustomExerciseEdit(), buildPersonalRecordSummary(), buildTopSetPerformances(), CompletedHistoryEntry, getLatestAchievedAt() (+18 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.19
Nodes (19): THEME_OPTIONS, AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme() (+11 more)

### Community 28 - "steps-section.tsx"
Cohesion: 0.17
Nodes (12): Card, CardContent, CardProps, Switch(), SwitchProps, AboutInfoSection(), StepGoalSheet(), StepsSection() (+4 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "useDrizzle"
Cohesion: 0.23
Nodes (12): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutDetailLoadedProps, useDrizzle(), useActiveWorkoutScreen(), useSaveWorkoutExerciseEdits(), useWorkoutHistoryDetail(), getActiveWorkoutQuery() (+4 more)

### Community 32 - "chip.tsx"
Cohesion: 0.19
Nodes (12): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+4 more)

### Community 33 - "button.tsx"
Cohesion: 0.11
Nodes (18): Props, State, StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle (+10 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.25
Nodes (11): CommonProvidersProps, DatabaseProvider(), dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage, SnackbarOptions (+3 more)

### Community 35 - "dev-seed.ts"
Cohesion: 0.22
Nodes (14): buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData(), LOAD_PROFILES, LoadProfile, maybeCreatePr() (+6 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "TrackingType"
Cohesion: 0.16
Nodes (20): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExercisePersonalRecordSummaryItem (+12 more)

### Community 38 - "ExerciseListItem"
Cohesion: 0.08
Nodes (48): WorkoutDetailLoaded(), WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps (+40 more)

### Community 39 - "package.json"
Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 40 - "icon.tsx"
Cohesion: 0.13
Nodes (21): StyledScrollView, AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames, NativeWindIconStyle (+13 more)

### Community 41 - "onboarding.repository.ts"
Cohesion: 0.33
Nodes (6): Index(), useIndexRedirect(), useOnboardingActions(), UseOnboardingActionsParams, completeOnboardingWithPreferences(), isOnboardingCompleted()

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

### Community 48 - "rest-timer-sheet.tsx"
Cohesion: 0.07
Nodes (41): WheelPicker, WheelPickerBase, WheelPickerComponent, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps (+33 more)

### Community 49 - "useSettings"
Cohesion: 0.22
Nodes (11): minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, WEIGHT_UNIT_OPTIONS, WorkoutPreferencesSection(), useSettings(), useActiveWorkoutExerciseDetail() (+3 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.33
Nodes (9): cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), isGranted(), requestRestTimerNotificationPermission(), RestTimerNotificationContext, RestTimerNotificationData, scheduleRestTimerNotification() (+1 more)

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "active-workout-header-with-actions.tsx"
Cohesion: 0.22
Nodes (8): RenameSheet(), ActiveWorkoutActionsSheet(), ActiveWorkoutHeaderDuration(), ActiveWorkoutHeaderWithActions(), RenameTemplateSheet(), RenameTemplateSheetProps, SaveWorkoutTemplateSheet(), useWorkoutDelete()

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "useAppTheme"
Cohesion: 0.18
Nodes (13): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), unstable_settings, WorkoutLayout(), triggerBottomTabNavigationHaptics() (+5 more)

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "useLiveWithFallback"
Cohesion: 0.22
Nodes (11): HistoricalWorkoutDraftScreen(), useHistoricalWorkoutDraftScreen(), useRecentWorkouts(), useWorkoutTemplates(), UseWorkoutTemplatesOptions, getHistoricalWorkoutDraftQuery(), getRecentWorkoutsQuery(), buildTemplateSummary() (+3 more)

### Community 62 - "use-exercises-screen.ts"
Cohesion: 0.16
Nodes (17): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), getExercisesQuery() (+9 more)

### Community 63 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 64 - "use-live-with-fallback.hook.ts"
Cohesion: 0.19
Nodes (12): DatabaseOperation, DatabaseSpanOptions, getSpanAttributes(), isPromiseLike(), setSpanStatus(), withDatabaseSpan(), activeDebugSubscriptions, debugQueryRuns (+4 more)

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
Cohesion: 0.18
Nodes (10): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, formEaseOut, formLayout, formStateEntering, formStateExiting (+2 more)

### Community 80 - "Sentry Database Observability Plan"
Cohesion: 0.20
Nodes (9): Context, Handoff checklist, Phase 0 — Span foundation, Phase 1 — Shared live-query reads, Phase 2 — Repository operations, Phase 3 — Startup and important user flows, Phase 4 — Baseline review and optimization, Rules (+1 more)

### Community 89 - "step-goal-sheet.tsx"
Cohesion: 0.36
Nodes (6): numberFormatter, StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, isValidStepGoal()

### Community 91 - "exercise-list-row.tsx"
Cohesion: 0.39
Nodes (7): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseListRowProps, formatMuscleList(), getPrimaryMuscleLabel(), toTitleCase()

### Community 102 - "app/_layout.tsx"
Cohesion: 0.22
Nodes (6): RootNavigator(), CommonProviders(), DrizzleStudio(), appFontAssets, AppFontFace, appFonts

### Community 105 - "database-observability.test.ts"
Cohesion: 0.22
Nodes (6): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan

### Community 128 - "use-historical-workout-start.ts"
Cohesion: 0.39
Nodes (7): useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, cleanupStaleHistoricalWorkoutDrafts(), createHistoricalWorkoutDraft(), createHistoricalWorkoutDraftFromTemplate(), getLocalNoonTimestamp(), getWorkoutTemplateRecordById()

### Community 129 - "progression-suggestion.utils.ts"
Cohesion: 0.48
Nodes (6): areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

### Community 130 - "database-provider.tsx"
Cohesion: 0.11
Nodes (22): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+14 more)

### Community 131 - "segmented-control.tsx"
Cohesion: 0.27
Nodes (6): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, LogHeader(), LogHeaderProps, LogView

### Community 133 - "exercise-metadata-form.tsx"
Cohesion: 0.29
Nodes (7): ErrorTarget, ExerciseMetadataForm(), FocusableInput, ExerciseTrackSection(), ExerciseTrackTabProps, ProgressionSuggestion(), scheduleIdleTask()

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

### Community 145 - "use-workout-log.ts"
Cohesion: 0.36
Nodes (7): formatSelectedDate(), WorkoutLogContent(), getWorkoutCalendarDateRange(), useWorkoutCalendarMarks(), useWorkoutRowsForDate(), getCompletedWorkoutCountRowsQuery(), WorkoutCalendarDateRange

### Community 147 - "string.utils.ts"
Cohesion: 0.53
Nodes (4): ActiveWorkoutStats(), ActiveWorkoutStatsProps, pluralize(), pluralizeUnit()

### Community 149 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 150 - "use-historical-workout-edit-screen.ts"
Cohesion: 0.60
Nodes (4): HistoricalWorkoutEditScreen(), useHistoricalWorkoutEditScreen(), getHistoricalWorkoutEditDraftQuery(), getWorkoutByIdQuery()

### Community 152 - "exercise-tracking-style-selector.tsx"
Cohesion: 0.40
Nodes (4): ExerciseTrackingStyleSelector(), ExerciseTrackingStyleSelectorProps, TRACKING_TYPE_ROWS, TRACKING_TYPES

### Community 153 - "@sentry/react-native"
Cohesion: 0.50
Nodes (4): expo, install, exclude, @sentry/react-native

## Knowledge Gaps
- **557 isolated node(s):** `Context`, `Rules`, `Phase 0 — Span foundation`, `Phase 1 — Shared live-query reads`, `Phase 2 — Repository operations` (+552 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **76 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `@sentry/react-native` to `use-live-with-fallback.hook.ts`, `app/_layout.tsx`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **What connects `Context`, `Rules`, `Phase 0 — Span foundation` to the rest of the system?**
  _557 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `workout.repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061507936507936505 - nodes in this community are weakly interconnected._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.083710407239819 - nodes in this community are weakly interconnected._
- **Should `workout-log-calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1319073083778966 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07265306122448979 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06801346801346801 - nodes in this community are weakly interconnected._