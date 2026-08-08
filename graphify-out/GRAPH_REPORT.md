# Graph Report - liftlog (2026-08-08)

## Corpus Check

- 336 files · ~120,971 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1867 nodes · 5354 edges · 152 communities (88 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `e9037a0e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- cn
- active-workout-content.tsx
- ui/bottom-sheet.tsx
- schema.ts
- useDrizzle
- Text
- exercise.repository.ts
- useLiveWithFallback
- workout-template.repository.ts
- workout-log-calendar.tsx
- workout.repository.ts
- settings.repository.ts
- set-form-row.tsx
- rest-timer.store.ts
- use-exercise-detail.ts
- set-form.utils.ts
- active-workout-exercise-edit-list.tsx
- TrackingType
- database-provider.tsx
- expo
- Components
- migrations.js
- devDependencies
- exercise-metadata-form.tsx
- workout-preferences-section.tsx
- exercise-picker-sheet.tsx
- What You Must Do When Invoked
- DrizzleDb
- rest-timer-sheet.tsx
- app-theme-provider.tsx
- Set
- icon.tsx
- styled/bottom-sheet.tsx
- exercise-history-list.tsx
- tracking.domain.ts
- template-exercise-editor.tsx
- Exercise History Critique
- LiftLog onboarding critique
- scripts
- useSettings
- Exercise Details critique
- rest-timer-notifications.service.ts
- set-duration-picker-sheet.tsx
- Workout Home critique
- active-workout-exercise-list.tsx
- steps-content.tsx
- weight.utils.ts
- ignoreDependencies
- exercise-list-row.tsx
- snackbar.tsx
- common-providers.tsx
- chip.tsx
- NodeSQLiteDatabase
- health-connect.service.ts
- exercise-progress-chart.tsx
- overrides
- useAppTheme
- include
- active-workout-header-with-actions.tsx
- dependencies
- Product
- bottom-sheet-input.tsx
- step-goal-sheet.tsx
- package.json
- Liftlog
- graphify reference: extra exports and benchmark
- toLocalDateKey
- nativewind-env.d.ts
- (tabs)/\_layout.tsx
- log/index.tsx
- use-active-workout-exercise-picker.ts
- replaySoundEffect
- wheel-picker.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- Findings
- Exercise Set Form critique
- lint-staged
- ScreenErrorBoundary
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
- @expo-google-fonts/inter
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

- `getHistoricalPersonalRecordRows()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts
- `getPersonalRecordSetIds()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts
- `insertHistoricalWorkout()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts
- `seedHistoricalExercises()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts
- `seedTrackedExercise()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts

## Import Cycles

- None detected.

## Communities (152 total, 64 thin omitted)

### Community 0 - "cn"

Cohesion: 0.07
Nodes (45): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+37 more)

### Community 1 - "active-workout-content.tsx"

Cohesion: 0.11
Nodes (37): expo-router, EditExerciseScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen() (+29 more)

### Community 2 - "ui/bottom-sheet.tsx"

Cohesion: 0.07
Nodes (45): BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState, BottomSheetSafeContent() (+37 more)

### Community 3 - "schema.ts"

Cohesion: 0.09
Nodes (43): ForeignKeysPragma, ForeignKeyViolation, schema, ForeignKeyListRow, getHistoricalPersonalRecordRows(), getPersonalRecordSetIds(), insertHistoricalWorkout(), MigrationJournal (+35 more)

### Community 4 - "useDrizzle"

Cohesion: 0.07
Nodes (37): Index(), ActiveWorkoutEditExercisesContentProps, useDrizzle(), Workout, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, useIndexRedirect() (+29 more)

### Community 5 - "Text"

Cohesion: 0.09
Nodes (27): Props, State, StyledActivityIndicator, StyledScrollView, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants (+19 more)

### Community 6 - "exercise.repository.ts"

Cohesion: 0.11
Nodes (32): NewExerciseScreen(), ActiveWorkoutEditExercisesContent(), NewExercise, normalizeExerciseName(), createExercise(), exerciseListFields, ExerciseNameConflictError, hasExerciseNameConflict() (+24 more)

### Community 7 - "useLiveWithFallback"

Cohesion: 0.09
Nodes (32): WorkoutDetailLoadedProps, getExerciseByIdQuery(), getExercisesQuery(), useCustomExerciseEdit(), useExercises(), UseExercisesOptions, parseMuscleList(), getWorkoutCalendarDateRange() (+24 more)

### Community 8 - "workout-template.repository.ts"

Cohesion: 0.11
Nodes (33): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, WorkoutTemplateCardProps, useWorkoutStart() (+25 more)

### Community 9 - "workout-log-calendar.tsx"

Cohesion: 0.11
Nodes (32): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+24 more)

### Community 10 - "workout.repository.ts"

Cohesion: 0.11
Nodes (33): createTrackedSet(), rebuildPersonalRecordsForExerciseInTransaction(), AddSetValues, getSetStorageValues(), useExerciseTrackActions(), useHistoricalWorkoutEditStart(), useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions (+25 more)

### Community 11 - "settings.repository.ts"

Cohesion: 0.13
Nodes (33): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getHealthConnectStepsEnabled(), getRestTimerDuration(), getRestTimerPresets() (+25 more)

### Community 12 - "set-form-row.tsx"

Cohesion: 0.07
Nodes (30): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone (+22 more)

### Community 13 - "rest-timer.store.ts"

Cohesion: 0.13
Nodes (20): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerTrigger(), RestTimerTriggerProps (+12 more)

### Community 14 - "use-exercise-detail.ts"

Cohesion: 0.15
Nodes (23): getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildTopSetPerformances(), CompletedHistoryEntry, getLatestAchievedAt(), getSetAchievedAt(), useExerciseDetail(), buildExerciseHistory() (+15 more)

### Community 15 - "set-form.utils.ts"

Cohesion: 0.15
Nodes (26): SetValues, TrackingFieldDefinition, SetFormRowProps, ActiveDurationPickerState, BaseRowView, DraftRowState, DraftSetFormRow, PersistedEditState (+18 more)

### Community 16 - "active-workout-exercise-edit-list.tsx"

Cohesion: 0.11
Nodes (23): ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem, ReorderableListRenderItemInfo (+15 more)

### Community 17 - "TrackingType"

Cohesion: 0.17
Nodes (20): ExerciseTrackingStyleSelectorProps, areSameTrackingValues(), formatTrackingValue(), getSetValues(), TrackingType, ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseCardProps, WorkoutExerciseSummary() (+12 more)

### Community 18 - "database-provider.tsx"

Cohesion: 0.10
Nodes (22): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+14 more)

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
Nodes (27): babel-plugin-inline-import, babel-preset-expo, @commitlint/config-conventional, @dotenvx/dotenvx, eslint-config-expo, expo-atlas, husky, devDependencies (+19 more)

### Community 23 - "exercise-metadata-form.tsx"

Cohesion: 0.11
Nodes (21): StyledGestureScrollView, CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataForm(), ExerciseMetadataFormProps (+13 more)

### Community 24 - "workout-preferences-section.tsx"

Cohesion: 0.13
Nodes (18): BackButtonProps, Card, CardContent, CardProps, IconComponent, AboutInfoSection(), RestTimerSettingSheet(), StepsSection() (+10 more)

### Community 25 - "exercise-picker-sheet.tsx"

Cohesion: 0.12
Nodes (20): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch() (+12 more)

### Community 26 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 27 - "DrizzleDb"

Cohesion: 0.15
Nodes (23): DrizzleDb, createSeedExercises(), runSeedIfNeeded(), runSeedUpgrades(), upsertAppMeta(), archiveExercise(), deleteExercise(), getExerciseUsageExistsQuery() (+15 more)

### Community 28 - "rest-timer-sheet.tsx"

Cohesion: 0.13
Nodes (21): SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, getDurationDraft() (+13 more)

### Community 29 - "app-theme-provider.tsx"

Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 30 - "Set"

Cohesion: 0.20
Nodes (17): Set, WorkoutExercise, ExerciseRowProps, ExerciseListItem, ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRowProps, ActiveWorkoutExerciseListProps, ExercisePickerRowProps (+9 more)

### Community 31 - "icon.tsx"

Cohesion: 0.15
Nodes (15): AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames, NativeWindIconStyle, NativeWindStylableIcon (+7 more)

### Community 32 - "styled/bottom-sheet.tsx"

Cohesion: 0.11
Nodes (18): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+10 more)

### Community 33 - "exercise-history-list.tsx"

Cohesion: 0.16
Nodes (16): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatNumber(), formatPersonalRecordValue(), formatScore(), ExerciseHistoryData, ExerciseHistoryEntry (+8 more)

### Community 34 - "tracking.domain.ts"

Cohesion: 0.17
Nodes (18): ExerciseTrackingStyleSelector(), TRACKING_TYPE_ROWS, buildProgressPoints(), getBestSetId(), assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), getDurationMs() (+10 more)

### Community 35 - "template-exercise-editor.tsx"

Cohesion: 0.20
Nodes (16): TemplateExerciseEditor(), TemplateExerciseEditorProps, DraftExerciseRow, reconcileDraftRows(), SaveWorkoutTemplateExerciseDraftResult, useWorkoutTemplateExerciseDraft(), createSupersetId(), linkAdjacentSupersetRows() (+8 more)

### Community 36 - "Exercise History Critique"

Cohesion: 0.11
Nodes (18): AI-Slop Verdict, Design Health Score, Design Specificity Verdict, Exercise History Critique, Minor Observations, Narrow Implementation Sequence, Overall Impression, P1 — Session cards obstruct comparison and waste the viewport (+10 more)

### Community 37 - "LiftLog onboarding critique"

Cohesion: 0.11
Nodes (18): AI-slop verdict, Design Health Score, Design Specificity Verdict, LiftLog onboarding critique, Narrow Implementation Sequence, Overall Impression, [P1] Large-text and compact-screen resilience is blocked, [P1] The CTA hides the first useful action (+10 more)

### Community 38 - "scripts"

Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, knip (+11 more)

### Community 39 - "useSettings"

Cohesion: 0.23
Nodes (16): useSettings(), AndroidStepsSyncHost(), getHealthConnectAvailability(), getStepPermissionState(), initializeHealthConnect(), openStepHealthConnectSettings(), requestStepPermissions(), syncStepDaysFromHealthConnect() (+8 more)

### Community 40 - "Exercise Details critique"

Cohesion: 0.11
Nodes (17): Design Health Score, Design Specificity Verdict, Exercise Details critique, Minor Observations, Narrow Implementation Sequence, Overall Impression, [P1] Android metadata is too fragile, [P1] Current performance has no primary tier (+9 more)

### Community 41 - "rest-timer-notifications.service.ts"

Cohesion: 0.22
Nodes (15): RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), getRestTimerNotificationData(), isGranted() (+7 more)

### Community 42 - "set-duration-picker-sheet.tsx"

Cohesion: 0.12
Nodes (14): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+6 more)

### Community 43 - "Workout Home critique"

Cohesion: 0.12
Nodes (15): Design Health Score, Design specificity, Findings, Overall verdict, P2 — Active summary consumes too much of the viewport, P2 — Blank start and template start are not framed as two workout-start paths, P2 — Recent workout cards are weakly distinguishable, P2 — Section-header actions are too small for gym-time interaction (+7 more)

### Community 44 - "active-workout-exercise-list.tsx"

Cohesion: 0.18
Nodes (15): WorkoutDetailLoaded(), WorkoutTemplateDetailLoaded(), ActiveWorkoutExerciseEditList, ActiveWorkoutExerciseList(), DisplayWorkoutExerciseRow, listEntering, listExiting, NewTemplateExerciseList() (+7 more)

### Community 45 - "steps-content.tsx"

Cohesion: 0.24
Nodes (13): HealthStepDay, StepDayRow(), StepDayRowProps, StepsActionsSheet(), StepsContent(), StepsEmptyState(), StepsSummaryCards(), TodayStepRadialCard() (+5 more)

### Community 46 - "weight.utils.ts"

Cohesion: 0.21
Nodes (13): ProgressionSuggestion(), ProgressionSuggestionProps, areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry (+5 more)

### Community 47 - "ignoreDependencies"

Cohesion: 0.13
Nodes (14): ignore, ignoreBinaries, ignoreDependencies, $schema, tags, babel.config.js, babel-plugin-inline-import, babel-preset-expo (+6 more)

### Community 48 - "exercise-list-row.tsx"

Cohesion: 0.24
Nodes (11): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseListRowProps, formatMuscleList(), getPrimaryMuscleLabel(), ActiveWorkoutStats(), ActiveWorkoutStatsProps (+3 more)

### Community 49 - "snackbar.tsx"

Cohesion: 0.19
Nodes (11): dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore (+3 more)

### Community 50 - "common-providers.tsx"

Cohesion: 0.16
Nodes (9): plugins, expo-font, expo-notifications, react-native-health-connect, CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio() (+1 more)

### Community 51 - "chip.tsx"

Cohesion: 0.19
Nodes (12): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+4 more)

### Community 53 - "health-connect.service.ts"

Cohesion: 0.19
Nodes (12): NewHealthStepDay, StepsUnavailableState(), StepsUnavailableStateProps, BACKGROUND_PERMISSION, GrantedPermission, hasPermission(), HealthConnectAvailability, HISTORY_PERMISSION (+4 more)

### Community 54 - "exercise-progress-chart.tsx"

Cohesion: 0.23
Nodes (11): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChart(), ExerciseProgressChartProps (+3 more)

### Community 55 - "overrides"

Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 56 - "useAppTheme"

Cohesion: 0.22
Nodes (10): RootNavigator(), ExercisesLayout(), TabLayout(), LogLayout(), unstable_settings, WorkoutLayout(), ThemeSelectionSection(), SetForm() (+2 more)

### Community 57 - "include"

Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/\*.ts, nativewind-env.d.ts, **/_.ts, \*\*/_.tsx, compilerOptions, paths (+3 more)

### Community 58 - "active-workout-header-with-actions.tsx"

Cohesion: 0.23
Nodes (8): RenameSheet(), ActiveWorkoutHeaderDuration(), ActiveWorkoutHeaderWithActions(), ActiveWorkoutHeaderWithActionsProps, RenameTemplateSheet(), RenameTemplateSheetProps, useWorkoutRename(), updateWorkoutName()

### Community 59 - "dependencies"

Cohesion: 0.18
Nodes (11): class-variance-authority, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo-drizzle-studio-plugin, expo-router, react-native-safe-area-context (+3 more)

### Community 60 - "Product"

Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 61 - "bottom-sheet-input.tsx"

Cohesion: 0.20
Nodes (9): StyledBottomSheetTextInput, BottomSheetInput, BottomSheetInputProps, BottomSheetTextInputRef, InputAccessibilityState, NativeTextInputProps, ExerciseNameField(), ExerciseNameFieldProps (+1 more)

### Community 62 - "step-goal-sheet.tsx"

Cohesion: 0.31
Nodes (7): numberFormatter, StepGoalSheet(), StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, isValidStepGoal()

### Community 63 - "package.json"

Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 64 - "Liftlog"

Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 65 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 66 - "toLocalDateKey"

Cohesion: 0.33
Nodes (8): getTodayDateKeyFromTimestamp(), readDailyStepTotals(), getLocalDayRange(), getRecentLocalDayRanges(), getTodayDateKey(), LocalDayRange, withWorkoutDateKey(), toLocalDateKey()

### Community 67 - "nativewind-env.d.ts"

Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 68 - "(tabs)/\_layout.tsx"

Cohesion: 0.39
Nodes (6): AnimatedTabBar(), styles, triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics(), nativeFontSizes

### Community 69 - "log/index.tsx"

Cohesion: 0.32
Nodes (5): LogHeader(), LogHeaderProps, LogView, formatSelectedDate(), WorkoutLogContent()

### Community 70 - "use-active-workout-exercise-picker.ts"

Cohesion: 0.32
Nodes (6): ActiveWorkoutExercisePickerSheetCommonProps, ActiveWorkoutExercisePickerSheetProps, ExercisePickerSheet(), useActiveWorkoutExercisePicker(), UseActiveWorkoutExercisePickerParams, getRecentExerciseIdsQuery()

### Community 71 - "replaySoundEffect"

Cohesion: 0.39
Nodes (4): playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 72 - "wheel-picker.tsx"

Cohesion: 0.33
Nodes (5): WheelPicker, WheelPickerBase, WheelPickerComponent, SetDurationWheel(), SetDurationWheelProps

### Community 73 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 74 - ".commitlintrc.json"

Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 75 - "Findings"

Cohesion: 0.33
Nodes (5): Findings, Overall implementation verdict, P1 — Management Mode removals bypass Cancel, P1 — Terminal workout transitions leave the rest timer alive, P2 — Management Mode hides a still-running rest timer

### Community 76 - "Exercise Set Form critique"

Cohesion: 0.33
Nodes (5): Exercise Set Form critique, Overall verdict, Stylistic preference, Usability issues, What is already working

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

- **605 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+600 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `active-workout-content.tsx`, `ui/bottom-sheet.tsx`, `Text`, `workout-log-calendar.tsx`, `set-form-row.tsx`, `rest-timer.store.ts`, `active-workout-exercise-edit-list.tsx`, `TrackingType`, `workout-preferences-section.tsx`, `rest-timer-sheet.tsx`, `app-theme-provider.tsx`, `Set`, `icon.tsx`, `exercise-history-list.tsx`, `tracking.domain.ts`, `set-duration-picker-sheet.tsx`, `active-workout-exercise-list.tsx`, `steps-content.tsx`, `exercise-list-row.tsx`, `chip.tsx`, `bottom-sheet-input.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `expo-router` connect `active-workout-content.tsx` to `cn`, `useDrizzle`, `(tabs)/_layout.tsx`, `exercise.repository.ts`, `Text`, `useSettings`, `rest-timer-notifications.service.ts`, `workout.repository.ts`, `workout-template.repository.ts`, `weight.utils.ts`, `TrackingType`, `common-providers.tsx`, `useAppTheme`, `active-workout-header-with-actions.tsx`, `icon.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Text` connect `Text` to `cn`, `active-workout-content.tsx`, `ui/bottom-sheet.tsx`, `exercise.repository.ts`, `workout-log-calendar.tsx`, `set-form-row.tsx`, `rest-timer.store.ts`, `active-workout-exercise-edit-list.tsx`, `TrackingType`, `exercise-metadata-form.tsx`, `workout-preferences-section.tsx`, `exercise-picker-sheet.tsx`, `rest-timer-sheet.tsx`, `Set`, `icon.tsx`, `exercise-history-list.tsx`, `tracking.domain.ts`, `template-exercise-editor.tsx`, `set-duration-picker-sheet.tsx`, `steps-content.tsx`, `weight.utils.ts`, `exercise-list-row.tsx`, `snackbar.tsx`, `chip.tsx`, `health-connect.service.ts`, `exercise-progress-chart.tsx`, `active-workout-header-with-actions.tsx`, `step-goal-sheet.tsx`, `log/index.tsx`, `wheel-picker.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _605 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0703962703962704 - nodes in this community are weakly interconnected._
- **Should `active-workout-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11412429378531073 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07259528130671507 - nodes in this community are weakly interconnected._
