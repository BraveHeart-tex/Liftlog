# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 336 files · ~117,047 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1827 nodes · 5376 edges · 166 communities (91 shown, 75 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ee1b16b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Workout
- useSettings
- workout-log-calendar.tsx
- database-error-boundary.tsx
- ui/bottom-sheet.tsx
- use-historical-workout-start.ts
- expo-router
- icon.tsx
- settings.repository.ts
- rest-timer-sheet.tsx
- active-workout-exercise-edit-list.tsx
- exercise-metadata-form.tsx
- exercise.repository.ts
- cn
- weight.utils.ts
- Set
- styled/bottom-sheet.tsx
- exercise-history-list.tsx
- workout.repository.ts
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- set-duration-picker-sheet.tsx
- tracking.domain.ts
- use-exercise-detail.ts
- app-theme-provider.tsx
- schema.ts
- scripts
- knip.json
- workout-template.repository.ts
- text.tsx
- button.tsx
- useAppTheme
- DrizzleDb
- expo
- TrackingType
- exercise-picker-sheet.tsx
- package.json
- (tabs)/_layout.tsx
- useDrizzle
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- new-template-content.tsx
- exercise-list-row.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- progression-suggestion.utils.ts
- tests/tsconfig.json
- use-exercises-screen.ts
- graphify reference: query, path, explain
- .commitlintrc.json
- segmented-control.tsx
- plugins
- lint-staged
- common-providers.tsx
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- expo
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
- expo
- expo-asset
- @commitlint/config-conventional
- expo-build-properties
- @dotenvx/dotenvx
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
- postcss
- prettier-plugin-tailwindcss
- eslint
- @types/react
- typescript
- @typescript-eslint/parser
- chip.tsx
- eslint-config-expo
- post-commit
- post-checkout
- eslint-plugin-unused-imports
- expo-atlas
- prettier
- @stylistic/eslint-plugin
- tailwindcss
- tsx
- @types/node
- @typescript-eslint/eslint-plugin
- active-workout-content.tsx
- use-workout-template-exercise-draft.ts
- rest-timer-preset-editor-sheet.tsx
- useLiveWithFallback
- rest-timer-duration-picker.tsx
- android
- use-workout-history-detail.ts
- bottom-sheet-input.tsx
- step-goal-sheet.tsx
- set-form.tsx
- database-observability.test.ts
- motion.constants.ts
- use-rest-timer-notification-responses.ts
- ScreenErrorBoundary

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 106 edges
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

## Communities (166 total, 75 thin omitted)

### Community 0 - "Workout"
Cohesion: 0.08
Nodes (38): ActiveWorkoutEditExercisesContentProps, WorkoutDetailLoaded(), Exercise, NewPersonalRecord, personalRecords, Workout, WorkoutExercise, CustomExerciseDetailsUpdate (+30 more)

### Community 1 - "useSettings"
Cohesion: 0.05
Nodes (67): BackButtonProps, Card, CardContent, CardProps, IconComponent, PulsatingDot(), HealthStepDay, NewHealthStepDay (+59 more)

### Community 2 - "workout-log-calendar.tsx"
Cohesion: 0.11
Nodes (32): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+24 more)

### Community 3 - "database-error-boundary.tsx"
Cohesion: 0.29
Nodes (3): DatabaseErrorBoundary, Props, State

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.09
Nodes (33): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+25 more)

### Community 5 - "use-historical-workout-start.ts"
Cohesion: 0.23
Nodes (12): useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, useWorkoutTemplates(), UseWorkoutTemplatesOptions, cleanupStaleHistoricalWorkoutDrafts(), createHistoricalWorkoutDraft(), createHistoricalWorkoutDraftFromTemplate(), getLocalNoonTimestamp() (+4 more)

### Community 6 - "expo-router"
Cohesion: 0.14
Nodes (26): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen(), WorkoutDetailScreen() (+18 more)

### Community 7 - "icon.tsx"
Cohesion: 0.10
Nodes (22): Props, State, AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames (+14 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.13
Nodes (32): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSetting(), getSettingsQuery() (+24 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.15
Nodes (20): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+12 more)

### Community 10 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.07
Nodes (49): WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem (+41 more)

### Community 11 - "exercise-metadata-form.tsx"
Cohesion: 0.16
Nodes (15): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataFormProps, FocusableInput, ExerciseMuscleSelector (+7 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.20
Nodes (22): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, hasExerciseNameConflict() (+14 more)

### Community 13 - "cn"
Cohesion: 0.11
Nodes (28): OnboardingScreen(), weightUnitOptions, BottomSheetSafeFooter(), HapticFeedback, impactFeedbackStyles, NativePressableProps, PressableSurface(), PressableSurfaceProps (+20 more)

### Community 14 - "weight.utils.ts"
Cohesion: 0.17
Nodes (19): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatExerciseHistorySessionMetadata() (+11 more)

### Community 15 - "Set"
Cohesion: 0.14
Nodes (29): Set, SetValues, TrackingFieldDefinition, SetFormRowProps, SetForm(), SetFormProps, ActiveDurationPickerState, BaseRowView (+21 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 17 - "exercise-history-list.tsx"
Cohesion: 0.23
Nodes (10): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatPersonalRecordValue(), ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets() (+2 more)

### Community 18 - "workout.repository.ts"
Cohesion: 0.10
Nodes (34): useActiveWorkoutActions(), useActiveWorkoutContent(), AddSetValues, getSetStorageValues(), useExerciseTrackActions(), useHistoricalWorkoutEditStart(), addExerciseToWorkout(), buildHistoricalWorkoutSourceSnapshot() (+26 more)

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
Cohesion: 0.11
Nodes (20): SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps, toneProgress, SetFormRowActions() (+12 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "set-duration-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.11
Nodes (26): PersonalRecord, ExerciseTrackingStyleSelectorProps, TRACKING_TYPE_ROWS, buildProgressPoints(), getBestSetId(), assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM() (+18 more)

### Community 26 - "use-exercise-detail.ts"
Cohesion: 0.15
Nodes (27): EditExerciseScreen(), getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), useCustomExerciseEdit(), buildPersonalRecordSummary(), buildTopSetPerformances(), CompletedHistoryEntry, getLatestAchievedAt() (+19 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "schema.ts"
Cohesion: 0.09
Nodes (37): buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData(), LOAD_PROFILES, LoadProfile, maybeCreatePr() (+29 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "workout-template.repository.ts"
Cohesion: 0.15
Nodes (27): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, WorkoutTemplate, WorkoutTemplateExercise, WorkoutTemplateCardProps, useSaveWorkoutTemplate(), useWorkoutStart(), activeWorkoutRoute (+19 more)

### Community 32 - "text.tsx"
Cohesion: 0.11
Nodes (22): StyledScrollView, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants, nativeTextDefaults (+14 more)

### Community 33 - "button.tsx"
Cohesion: 0.16
Nodes (14): StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants, ButtonVariant (+6 more)

### Community 34 - "useAppTheme"
Cohesion: 0.21
Nodes (7): RootNavigator(), unstable_settings, WorkoutLayout(), DrizzleStudio(), useAppTheme(), appFontAssets, AppFontFace

### Community 35 - "DrizzleDb"
Cohesion: 0.07
Nodes (53): DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync(), migrationsThroughExerciseNameBackfill, withStartupDatabaseSpan(), configureDatabase() (+45 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "TrackingType"
Cohesion: 0.16
Nodes (19): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExercisePersonalRecordSummaryItem (+11 more)

### Community 38 - "exercise-picker-sheet.tsx"
Cohesion: 0.12
Nodes (16): categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), ActiveWorkoutExercisePickerSheetCommonProps, ActiveWorkoutExercisePickerSheetProps (+8 more)

### Community 39 - "package.json"
Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 40 - "(tabs)/_layout.tsx"
Cohesion: 0.26
Nodes (9): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+1 more)

### Community 41 - "useDrizzle"
Cohesion: 0.15
Nodes (19): Index(), useDrizzle(), useIndexRedirect(), isOnboardingCompleted(), useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), completeWorkout() (+11 more)

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

### Community 48 - "new-template-content.tsx"
Cohesion: 0.21
Nodes (7): InputFieldLayout(), InputFieldLayoutProps, Input, InputAccessibilityState, InputProps, NativeTextInputProps, NewTemplateContent()

### Community 49 - "exercise-list-row.tsx"
Cohesion: 0.20
Nodes (12): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseListRowProps, ExerciseTrackingStyleSelector(), formatMuscleList(), getPrimaryMuscleLabel(), ActiveWorkoutStats() (+4 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.36
Nodes (8): cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), isGranted(), requestRestTimerNotificationPermission(), RestTimerNotificationContext, RestTimerNotificationData, scheduleRestTimerNotification(), ScheduleRestTimerNotificationParams

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "progression-suggestion.utils.ts"
Cohesion: 0.48
Nodes (6): areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "use-exercises-screen.ts"
Cohesion: 0.32
Nodes (9): ExercisesScreen(), buildAlphabetizedExerciseListItems(), getExercisesQuery(), matchesExerciseFilter(), useExercisesScreen(), useActiveWorkoutExercisePicker(), UseActiveWorkoutExercisePickerParams, RECENT_EXERCISES_LIMIT (+1 more)

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "segmented-control.tsx"
Cohesion: 0.21
Nodes (8): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, THEME_OPTIONS, ThemeSelectionSection(), LogHeader(), LogHeaderProps, LogView

### Community 62 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 63 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 64 - "common-providers.tsx"
Cohesion: 0.22
Nodes (13): CommonProviders(), CommonProvidersProps, DatabaseProvider(), dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage (+5 more)

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

### Community 73 - "expo"
Cohesion: 0.50
Nodes (4): expo, install, exclude, @sentry/react-native

### Community 139 - "chip.tsx"
Cohesion: 0.14
Nodes (16): StyledGestureScrollView, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig (+8 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 151 - "active-workout-content.tsx"
Cohesion: 0.15
Nodes (16): EmptyState(), EmptyStateProps, RenameSheet(), chromeEntering, chromeExiting, chromeLayout, headerEntering, headerExiting (+8 more)

### Community 152 - "use-workout-template-exercise-draft.ts"
Cohesion: 0.13
Nodes (17): ActiveWorkoutEditExercisesContent(), DraftExerciseRow, SaveActiveWorkoutExerciseDraftResult, useActiveWorkoutExerciseDraft(), useSaveActiveWorkoutExerciseDraft(), useSaveWorkoutExerciseEdits(), DraftExerciseRow, SaveWorkoutTemplateExerciseDraftResult (+9 more)

### Community 153 - "rest-timer-preset-editor-sheet.tsx"
Cohesion: 0.13
Nodes (17): SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, getDurationDraft(), RestTimerIdleContentProps, RestTimerPresetEditorSheet(), RestTimerPresetEditorSheetContent, RestTimerPresetEditorSheetContentProps (+9 more)

### Community 154 - "useLiveWithFallback"
Cohesion: 0.14
Nodes (17): useExercises(), UseExercisesOptions, TemplateExerciseEditor(), useHistoricalWorkoutDraftScreen(), useHistoricalWorkoutEditScreen(), useRecentWorkouts(), getHistoricalWorkoutDraftQuery(), getHistoricalWorkoutEditDraftQuery() (+9 more)

### Community 155 - "rest-timer-duration-picker.tsx"
Cohesion: 0.20
Nodes (9): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, SetDurationWheel() (+1 more)

### Community 156 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 157 - "use-workout-history-detail.ts"
Cohesion: 0.27
Nodes (9): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutDetailLoadedProps, useActiveWorkoutScreen(), useWorkoutHistoryDetail(), getActiveWorkoutQuery(), getWorkoutHistoryDetailRowsQuery(), mapWorkoutHistoryDetailRows() (+1 more)

### Community 158 - "bottom-sheet-input.tsx"
Cohesion: 0.20
Nodes (9): StyledBottomSheetTextInput, BottomSheetInput, BottomSheetInputProps, BottomSheetTextInputRef, InputAccessibilityState, NativeTextInputProps, ExerciseNameField(), ExerciseNameFieldProps (+1 more)

### Community 159 - "step-goal-sheet.tsx"
Cohesion: 0.33
Nodes (6): numberFormatter, StepGoalSheet(), StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS

### Community 160 - "set-form.tsx"
Cohesion: 0.20
Nodes (9): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, formEaseOut, formLayout, formStateEntering, formStateExiting (+1 more)

### Community 161 - "database-observability.test.ts"
Cohesion: 0.20
Nodes (7): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan, WithDomainFlowSpan

### Community 162 - "motion.constants.ts"
Cohesion: 0.32
Nodes (5): Switch(), SwitchProps, MOTION_DURATION_MS, PRESS_EASING, UsePressScaleOptions

### Community 163 - "use-rest-timer-notification-responses.ts"
Cohesion: 0.53
Nodes (5): useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, getRestTimerNotificationData(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification()

## Knowledge Gaps
- **549 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+544 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **75 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `expo` to `useDrizzle`, `useAppTheme`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _549 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Workout` be split into smaller, more focused modules?**
  _Cohesion score 0.07568027210884354 - nodes in this community are weakly interconnected._
- **Should `useSettings` be split into smaller, more focused modules?**
  _Cohesion score 0.05034199726402189 - nodes in this community are weakly interconnected._
- **Should `workout-log-calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.112375533428165 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08970099667774087 - nodes in this community are weakly interconnected._
- **Should `expo-router` be split into smaller, more focused modules?**
  _Cohesion score 0.13623188405797101 - nodes in this community are weakly interconnected._