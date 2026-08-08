# Graph Report - liftlog  (2026-08-08)

## Corpus Check
- 332 files · ~114,933 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1800 nodes · 5267 edges · 157 communities (83 shown, 74 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5695221b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- exercise-list-row.tsx
- use-steps-screen.ts
- workout-log-calendar.tsx
- database.integration.test.ts
- ui/bottom-sheet.tsx
- useLiveWithFallback
- active-workout-content.tsx
- icon.tsx
- settings.repository.ts
- rest-timer-preset-editor-sheet.tsx
- workout-template.repository.ts
- exercise-metadata-form.tsx
- schema.ts
- text.tsx
- weight.utils.ts
- Set
- styled/bottom-sheet.tsx
- template-exercise-editor.tsx
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
- useAppTheme
- scripts
- knip.json
- useDrizzle
- Text
- button.tsx
- common-providers.tsx
- dev-seed.ts
- expo
- TrackingType
- exercise-picker-sheet.tsx
- package.json
- (tabs)/_layout.tsx
- snackbar.tsx
- NodeSQLiteDatabase
- overrides
- include
- android
- dependencies
- Product
- rest-timer-duration-picker.tsx
- useSettings
- Liftlog
- steps-content.tsx
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- motion.constants.ts
- tests/tsconfig.json
- ExerciseListItem
- graphify reference: query, path, explain
- .commitlintrc.json
- rest-timer-host.tsx
- plugins
- lint-staged
- today-step-radial-card.tsx
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- useRestTimerStore
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
- expo-audio
- expo-build-properties
- active-workout-exercise-list.tsx
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
- exercise-track-section.tsx
- @types/react
- typescript
- @typescript-eslint/parser
- exercise-picker-filters.tsx
- step-goal-sheet.tsx
- post-commit
- post-checkout
- expo
- @commitlint/config-conventional
- @dotenvx/dotenvx
- eslint
- eslint-config-expo
- eslint-plugin-unused-imports
- expo-atlas
- @react-navigation/native
- prettier
- @stylistic/eslint-plugin
- tailwindcss
- tsx
- @types/node
- @typescript-eslint/eslint-plugin

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 106 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
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

## Communities (157 total, 74 thin omitted)

### Community 0 - "exercise-list-row.tsx"
Cohesion: 0.23
Nodes (11): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseListRowProps, ExerciseTrackingStyleSelector(), formatMuscleList(), getPrimaryMuscleLabel(), ActiveWorkoutStats() (+3 more)

### Community 1 - "use-steps-screen.ts"
Cohesion: 0.12
Nodes (32): healthStepDays, NewHealthStepDay, AndroidStepsSyncHost(), BACKGROUND_PERMISSION, getHealthConnectAvailability(), getStepPermissionState(), getTodayDateKeyFromTimestamp(), GrantedPermission (+24 more)

### Community 2 - "workout-log-calendar.tsx"
Cohesion: 0.11
Nodes (32): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+24 more)

### Community 3 - "database.integration.test.ts"
Cohesion: 0.05
Nodes (50): Index(), DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps (+42 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (44): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+36 more)

### Community 5 - "useLiveWithFallback"
Cohesion: 0.08
Nodes (37): ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditScreen(), WorkoutDetailLoadedProps, formatSelectedDate(), WorkoutLogContent(), getWorkoutCalendarDateRange() (+29 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.14
Nodes (31): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutDetailScreen(), WorkoutTemplateDetailLoaded(), WorkoutTemplateDetailScreen() (+23 more)

### Community 7 - "icon.tsx"
Cohesion: 0.08
Nodes (40): AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames, NativeWindIconStyle, NativeWindStylableIcon (+32 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.14
Nodes (31): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSetting(), getSettingsQuery() (+23 more)

### Community 9 - "rest-timer-preset-editor-sheet.tsx"
Cohesion: 0.13
Nodes (18): SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, getDurationDraft(), RestTimerIdleContent(), RestTimerIdleContentProps, RestTimerPresetEditorSheet(), RestTimerPresetEditorSheetContent (+10 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.11
Nodes (35): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, showSnackbar(), WorkoutTemplate, WorkoutTemplateExercise, WorkoutTemplateCardProps, useSaveWorkoutTemplate(), useWorkoutStart() (+27 more)

### Community 11 - "exercise-metadata-form.tsx"
Cohesion: 0.13
Nodes (19): ChoiceChip(), choiceChipContainerVariants, choiceChipTextVariants, CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget (+11 more)

### Community 12 - "schema.ts"
Cohesion: 0.09
Nodes (43): NewExerciseScreen(), ActiveWorkoutEditExercisesContent(), Exercise, NewAppMeta, NewExercise, NewWorkoutExercise, NewWorkoutTemplate, NewWorkoutTemplateExercise (+35 more)

### Community 13 - "text.tsx"
Cohesion: 0.07
Nodes (43): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+35 more)

### Community 14 - "weight.utils.ts"
Cohesion: 0.22
Nodes (15): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatDisplaySetPosition() (+7 more)

### Community 15 - "Set"
Cohesion: 0.14
Nodes (30): Set, SetValues, TrackingFieldDefinition, SetFormRowProps, SetForm(), SetFormProps, ActiveDurationPickerState, BaseRowView (+22 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (32): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+24 more)

### Community 17 - "template-exercise-editor.tsx"
Cohesion: 0.15
Nodes (20): getExercisesQuery(), useExercises(), UseExercisesOptions, NewTemplateExerciseListProps, TemplateExerciseEditor(), TemplateExerciseEditorProps, TemplateExerciseEditorRow, DraftExerciseRow (+12 more)

### Community 18 - "workout.repository.ts"
Cohesion: 0.12
Nodes (36): DrizzleDb, NewWorkout, useActiveWorkoutActions(), UseActiveWorkoutActionsParams, useActiveWorkoutContent(), UseActiveWorkoutContentParams, useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions (+28 more)

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
Nodes (31): StyledActivityIndicator, TRACKING_TYPE_DEFINITIONS, darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface() (+23 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "set-duration-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.09
Nodes (31): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, PersonalRecord, assertNonNegativeNumber(), assertPositiveNumber(), formatNumber(), formatPersonalRecordValue() (+23 more)

### Community 26 - "use-exercise-detail.ts"
Cohesion: 0.11
Nodes (36): EditExerciseScreen(), getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), useCustomExerciseEdit(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry (+28 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "useAppTheme"
Cohesion: 0.17
Nodes (11): unstable_settings, WorkoutLayout(), Switch(), SwitchProps, AboutInfoSection(), StepGoalSheet(), StepsSection(), THEME_OPTIONS (+3 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "useDrizzle"
Cohesion: 0.08
Nodes (35): ActiveWorkoutEditExercisesContentProps, WorkoutDetailLoaded(), useDrizzle(), Workout, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps (+27 more)

### Community 32 - "Text"
Cohesion: 0.12
Nodes (24): PulsatingDot(), Text, ExerciseProgressChart(), ExerciseRow(), selectedDayEntering, selectedDayExiting, WorkoutLogRow(), getDateKeyTimestamp() (+16 more)

### Community 33 - "button.tsx"
Cohesion: 0.11
Nodes (16): Props, State, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants (+8 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.13
Nodes (8): RootNavigator(), CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost(), appFontAssets

### Community 35 - "dev-seed.ts"
Cohesion: 0.13
Nodes (21): buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData(), LOAD_PROFILES, LoadProfile, maybeCreatePr() (+13 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "TrackingType"
Cohesion: 0.18
Nodes (18): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps (+10 more)

### Community 38 - "exercise-picker-sheet.tsx"
Cohesion: 0.13
Nodes (18): ExercisesScreen(), buildAlphabetizedExerciseListItems(), categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch() (+10 more)

### Community 39 - "package.json"
Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 40 - "(tabs)/_layout.tsx"
Cohesion: 0.26
Nodes (9): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+1 more)

### Community 41 - "snackbar.tsx"
Cohesion: 0.38
Nodes (6): notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore

### Community 43 - "overrides"
Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 44 - "include"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 45 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 46 - "dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, expo-constants, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo-constants, expo-drizzle-studio-plugin (+3 more)

### Community 47 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 48 - "rest-timer-duration-picker.tsx"
Cohesion: 0.20
Nodes (9): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, SetDurationWheel() (+1 more)

### Community 49 - "useSettings"
Cohesion: 0.20
Nodes (13): computeEstimated1RM(), roundScore(), useSettings(), ActiveWorkoutExerciseEditRow(), ProgressionSuggestion(), ProgressionSuggestionProps, areSameSetValues(), getBestEstimated1RM() (+5 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 51 - "steps-content.tsx"
Cohesion: 0.20
Nodes (15): HealthStepDay, StepDayRow(), StepDayRowProps, StepsActionsSheet(), StepsContent(), StepsEmptyState(), StepsSummaryCards(), StepsUnavailableState() (+7 more)

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

### Community 56 - "motion.constants.ts"
Cohesion: 0.23
Nodes (7): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, LogHeader(), LogHeaderProps, LogView, MOTION_DURATION_MS

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "ExerciseListItem"
Cohesion: 0.16
Nodes (14): ExerciseRowProps, ExerciseListItem, ActiveWorkoutContentProps, ActiveWorkoutExercisePickerSheet(), ActiveWorkoutExercisePickerSheetCommonProps, ActiveWorkoutExercisePickerSheetProps, ExercisePickerRowProps, ExercisePickerSheet() (+6 more)

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "rest-timer-host.tsx"
Cohesion: 0.39
Nodes (7): dismissSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, getRestTimerNotificationData(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification()

### Community 62 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 63 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 64 - "today-step-radial-card.tsx"
Cohesion: 0.24
Nodes (9): Card, CardContent, CardProps, StepsSummaryCardsProps, TodayStepRadialCardProps, StepStats, StepRecentActivityStatus, WorkoutMetrics() (+1 more)

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

### Community 73 - "useRestTimerStore"
Cohesion: 0.29
Nodes (9): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), useIsRestTimerRunning(), REST_TIMER_INCREMENT_SECONDS, triggerRestTimerImpact() (+1 more)

### Community 91 - "active-workout-exercise-list.tsx"
Cohesion: 0.19
Nodes (11): StyledGestureScrollView, StyledScrollView, ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseEditList, ActiveWorkoutExerciseList(), ActiveWorkoutExerciseListProps, DisplayWorkoutExerciseRow, listEntering (+3 more)

### Community 131 - "exercise-track-section.tsx"
Cohesion: 0.24
Nodes (10): ActiveWorkoutExerciseCardProps, ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRowProps, ExerciseTrackSection(), ExerciseTrackTabProps, WorkoutExerciseWithSets, AddSetValues, getSetStorageValues() (+2 more)

### Community 139 - "exercise-picker-filters.tsx"
Cohesion: 0.22
Nodes (9): BackButtonProps, IconComponent, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilter, ExercisePickerFilterOption, ExercisePickerFilters(), ExercisePickerFiltersProps (+1 more)

### Community 140 - "step-goal-sheet.tsx"
Cohesion: 0.33
Nodes (6): numberFormatter, StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, nativeFontSizes

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 143 - "expo"
Cohesion: 0.50
Nodes (4): expo, install, exclude, @sentry/react-native

## Knowledge Gaps
- **538 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+533 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `expo` to `common-providers.tsx`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _538 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12162162162162163 - nodes in this community are weakly interconnected._
- **Should `workout-log-calendar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.112375533428165 - nodes in this community are weakly interconnected._
- **Should `database.integration.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05336951605608322 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07199032062915911 - nodes in this community are weakly interconnected._
- **Should `useLiveWithFallback` be split into smaller, more focused modules?**
  _Cohesion score 0.07729468599033816 - nodes in this community are weakly interconnected._