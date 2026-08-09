# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 337 files · ~118,120 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1840 nodes · 5388 edges · 147 communities (85 shown, 62 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c8668d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workout.repository.ts
- steps-content.tsx
- workout-log-content.tsx
- schema.ts
- ui/bottom-sheet.tsx
- text.tsx
- exercises/edit/[id].tsx
- exercise-picker-sheet.tsx
- withDatabaseSpan
- use-exercise-detail.ts
- workout-template.repository.ts
- cn
- exercise.repository.ts
- set-duration-picker-sheet.tsx
- Set
- set-form.tsx
- styled/bottom-sheet.tsx
- rest-timer-sheet.tsx
- useLiveWithFallback
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- Text
- tracking.domain.ts
- step-goal-sheet.tsx
- app-theme-provider.tsx
- rest-timer-preset-editor-sheet.tsx
- scripts
- knip.json
- useDrizzle
- chip.tsx
- icon.tsx
- common-providers.tsx
- exercise-history-list.tsx
- expo
- use-exercise-history.ts
- exercises/[id].tsx
- package.json
- rest-timer-trigger.tsx
- DrizzleDb
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- android
- app/_layout.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- button.tsx
- tests/tsconfig.json
- @commitlint/cli
- graphify reference: query, path, explain
- .commitlintrc.json
- snackbar.tsx
- use-save-workout-template.ts
- prettier-plugin-tailwindcss
- wheel-picker.tsx
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
- Observability
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
- segmented-control.tsx
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
- postcss
- ExerciseListItem
- database-provider.tsx
- @tailwindcss/postcss
- @types/react
- @typescript-eslint/parser
- useAppTheme
- weight.utils.ts
- post-commit
- post-checkout
- drizzle-orm
- typescript
- @faker-js/faker
- lint-staged
- knip

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

## Communities (147 total, 62 thin omitted)

### Community 0 - "workout.repository.ts"
Cohesion: 0.09
Nodes (35): ActiveWorkoutEditExercisesContent(), useActiveWorkoutContent(), UseActiveWorkoutContentParams, SaveActiveWorkoutExerciseDraftResult, useActiveWorkoutExerciseDraft(), useHistoricalWorkoutEditStart(), useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions (+27 more)

### Community 1 - "steps-content.tsx"
Cohesion: 0.06
Nodes (60): Card, CardContent, CardProps, Switch(), SwitchProps, HealthStepDay, NewHealthStepDay, AboutInfoSection() (+52 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.07
Nodes (48): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+40 more)

### Community 3 - "schema.ts"
Cohesion: 0.10
Nodes (33): buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData(), LOAD_PROFILES, LoadProfile, maybeCreatePr() (+25 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.09
Nodes (31): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+23 more)

### Community 5 - "text.tsx"
Cohesion: 0.13
Nodes (15): Props, State, PulsatingDot(), nativeTextDefaults, NativeTextProps, TextProps, TextTone, TextVariant (+7 more)

### Community 6 - "exercises/edit/[id].tsx"
Cohesion: 0.21
Nodes (16): WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutTemplateDetailScreen(), BackButton(), BackButtonVariant (+8 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.11
Nodes (16): InputFieldLayout(), InputFieldLayoutProps, Input, InputAccessibilityState, InputProps, NativeTextInputProps, SearchInputIcon(), ExerciseListDataItem (+8 more)

### Community 8 - "withDatabaseSpan"
Cohesion: 0.15
Nodes (32): SettingsContext, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSetting(), getSettingsQuery() (+24 more)

### Community 9 - "use-exercise-detail.ts"
Cohesion: 0.17
Nodes (20): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem (+12 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.09
Nodes (41): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, validateStagedCustomExerciseNames(), WorkoutTemplateCardProps (+33 more)

### Community 11 - "cn"
Cohesion: 0.08
Nodes (36): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+28 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.20
Nodes (19): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+11 more)

### Community 13 - "set-duration-picker-sheet.tsx"
Cohesion: 0.12
Nodes (14): BottomSheetSafeFooter(), centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems (+6 more)

### Community 14 - "Set"
Cohesion: 0.15
Nodes (26): Set, ExerciseProgressChartBodyProps, areSameTrackingValues(), getSetValues(), resolveTrackingType(), TrackingType, ActiveWorkoutExerciseCardProps, ExerciseHistoryListProps (+18 more)

### Community 15 - "set-form.tsx"
Cohesion: 0.12
Nodes (32): SetValues, TRACKING_TYPE_DEFINITIONS, TrackingFieldDefinition, useSettings(), darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting (+24 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 17 - "rest-timer-sheet.tsx"
Cohesion: 0.16
Nodes (16): RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps, RestTimerWidget(), RestTimerWidgetProps, widgetEntering (+8 more)

### Community 18 - "useLiveWithFallback"
Cohesion: 0.07
Nodes (40): EditExerciseScreen(), ExercisesScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), HistoricalWorkoutEditScreen(), WorkoutDetailLoadedProps, buildAlphabetizedExerciseListItems(), getExerciseByIdQuery() (+32 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): babel-plugin-inline-import, babel-preset-expo, @commitlint/config-conventional, @dotenvx/dotenvx, eslint, eslint-config-expo, eslint-plugin-unused-imports, expo-atlas (+21 more)

### Community 20 - "Components"
Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "migrations.js"
Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 22 - "set-form-row.tsx"
Cohesion: 0.10
Nodes (23): SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps, toneProgress, SetFormRowActions() (+15 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "Text"
Cohesion: 0.10
Nodes (24): WorkoutDetailLoaded(), WorkoutDetailScreen(), StyledBottomSheetTextInput, BottomSheetInput, BottomSheetInputProps, BottomSheetTextInputRef, InputAccessibilityState, NativeTextInputProps (+16 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.18
Nodes (18): assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), formatPersonalRecordValue(), getDurationMs(), getSetScore(), isNonNegativeNumber(), isPositiveNumber() (+10 more)

### Community 26 - "step-goal-sheet.tsx"
Cohesion: 0.31
Nodes (7): numberFormatter, StepGoalSheetContent, parseStepGoal(), MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, isValidStepGoal()

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "rest-timer-preset-editor-sheet.tsx"
Cohesion: 0.15
Nodes (17): SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, getDurationDraft() (+9 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "useDrizzle"
Cohesion: 0.07
Nodes (43): ActiveWorkoutEditExercisesContentProps, useDrizzle(), Workout, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps, ActiveWorkoutContentProps, ActiveWorkoutHeaderWithActionsProps (+35 more)

### Community 32 - "chip.tsx"
Cohesion: 0.06
Nodes (43): StyledGestureScrollView, StyledScrollView, BackButtonProps, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps (+35 more)

### Community 33 - "icon.tsx"
Cohesion: 0.10
Nodes (38): expo-router, Button(), EmptyState(), EmptyStateProps, AppIconProps, createStyledIcon(), getIconSize(), Icon() (+30 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.18
Nodes (6): CommonProviders(), CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary, AndroidStepsSyncHost(), StepsSyncHost()

### Community 35 - "exercise-history-list.tsx"
Cohesion: 0.20
Nodes (13): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets(), formatWorkoutDate() (+5 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "use-exercise-history.ts"
Cohesion: 0.24
Nodes (11): CompletedHistoryEntry, buildExerciseHistory(), getExerciseHistoryQuery(), getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows(), canLoadExerciseHistoryPage(), CanLoadExerciseHistoryPageOptions, didExerciseHistoryPageFinish() (+3 more)

### Community 38 - "exercises/[id].tsx"
Cohesion: 0.21
Nodes (13): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseProgressChart(), ExerciseTrackingStyleSelector(), ExerciseTrackingStyleSelectorProps, TRACKING_TYPE_ROWS, formatMuscleList() (+5 more)

### Community 39 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, pnpm, expo, install, exclude, main, name (+5 more)

### Community 40 - "rest-timer-trigger.tsx"
Cohesion: 0.22
Nodes (10): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerTrigger(), RestTimerTriggerProps, useIsRestTimerRunning(), DurationMsParts, formatTime() (+2 more)

### Community 41 - "DrizzleDb"
Cohesion: 0.10
Nodes (34): Index(), DrizzleDb, AppMeta, healthStepDays, getExerciseUsageExistsQuery(), useIndexRedirect(), useOnboardingActions(), UseOnboardingActionsParams (+26 more)

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

### Community 49 - "app/_layout.tsx"
Cohesion: 0.28
Nodes (4): DrizzleStudio(), appFontAssets, AppFontFace, appFonts

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

### Community 56 - "button.tsx"
Cohesion: 0.22
Nodes (9): StyledActivityIndicator, ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants, ButtonVariant, buttonVariantConfig (+1 more)

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

### Community 64 - "wheel-picker.tsx"
Cohesion: 0.33
Nodes (5): WheelPicker, WheelPickerBase, WheelPickerComponent, SetDurationWheel(), SetDurationWheelProps

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

### Community 82 - "Observability"
Cohesion: 0.33
Nodes (5): Adding or changing data access, Data Access, Naming and metadata, Observability, Span boundaries

### Community 86 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 89 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 102 - "segmented-control.tsx"
Cohesion: 0.25
Nodes (8): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, THEME_OPTIONS, ThemeSelectionSection(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics()

### Community 105 - "database-observability.test.ts"
Cohesion: 0.20
Nodes (7): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan, WithDomainFlowSpan

### Community 129 - "ExerciseListItem"
Cohesion: 0.06
Nodes (58): WorkoutTemplateDetailLoaded(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem, ReorderableListRenderItemInfo (+50 more)

### Community 130 - "database-provider.tsx"
Cohesion: 0.08
Nodes (32): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+24 more)

### Community 134 - "useAppTheme"
Cohesion: 0.20
Nodes (11): RootNavigator(), ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), unstable_settings, WorkoutLayout() (+3 more)

### Community 139 - "weight.utils.ts"
Cohesion: 0.19
Nodes (14): ActiveWorkoutExerciseEditRow(), ProgressionSuggestion(), ProgressionSuggestionProps, areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion() (+6 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

## Knowledge Gaps
- **559 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+554 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `package.json` to `app/_layout.tsx`, `useDrizzle`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _559 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `workout.repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09302325581395349 - nodes in this community are weakly interconnected._
- **Should `steps-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05844155844155844 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07071887784921099 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09358974358974359 - nodes in this community are weakly interconnected._