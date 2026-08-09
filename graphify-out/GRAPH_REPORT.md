# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 338 files · ~118,548 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1854 nodes · 5411 edges · 145 communities (81 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cf81b8f0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- rest-timer.store.ts
- useSettings
- workout-log-content.tsx
- active-workout-exercise-edit-list.tsx
- ui/bottom-sheet.tsx
- schema.ts
- active-workout-content.tsx
- exercise.repository.ts
- withDatabaseSpan
- useRestTimerStore
- android
- step-goal-sheet.tsx
- DrizzleDb
- exercises/index.tsx
- WeightUnit
- Set
- styled/bottom-sheet.tsx
- Log Screen Rendering Performance Plan
- set-duration-picker-sheet.tsx
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- text.tsx
- tracking.domain.ts
- progress.repository.ts
- app-theme-provider.tsx
- database-provider.tsx
- scripts
- knip.json
- set-form.tsx
- rest-timer-host.tsx
- Text
- common-providers.tsx
- Workout
- expo
- TrackingType
- workout-template.repository.ts
- package.json
- useAppTheme
- workouts/[id].tsx
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- workout.repository.ts
- exercise-history-list.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- weight.utils.ts
- tests/tsconfig.json
- (tabs)/_layout.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- bottom-sheet-input.tsx
- seed.ts
- rest-timer-sheet.tsx
- snackbar.tsx
- NodeSQLiteStatement
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- metro.config.js
- build-android-release-single-arch.sh
- plugins
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- database.md
- observability-span.ts
- extraction-spec.md
- babel-preset-expo
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-kit
- drizzle-orm
- expo
- expo-asset
- clsx
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
- prettier-plugin-tailwindcss
- @types/react
- @commitlint/cli
- post-commit
- post-checkout
- eslint-plugin-unused-imports
- progression-suggestion.utils.ts
- prettier
- wheel-picker.tsx
- @types/node
- @typescript-eslint/eslint-plugin
- rest-timer-preset-editor-sheet.tsx

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 107 edges
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

## Communities (145 total, 64 thin omitted)

### Community 0 - "rest-timer.store.ts"
Cohesion: 0.28
Nodes (4): MAX_REST_TIMER_SECONDS, MIN_REST_TIMER_SECONDS, RestTimerState, RestTimerStatus

### Community 1 - "useSettings"
Cohesion: 0.06
Nodes (62): Card, CardContent, CardProps, HealthStepDay, NewHealthStepDay, AboutInfoSection(), RestTimerSettingSheet(), StepsSection() (+54 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.07
Nodes (46): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+38 more)

### Community 3 - "active-workout-exercise-edit-list.tsx"
Cohesion: 0.08
Nodes (41): WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem (+33 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (40): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+32 more)

### Community 5 - "schema.ts"
Cohesion: 0.09
Nodes (36): configureDatabase(), databaseName, databaseOptions, ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName() (+28 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.11
Nodes (36): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), HistoricalWorkoutEditScreen(), WorkoutTemplateDetailScreen(), BackButton() (+28 more)

### Community 7 - "exercise.repository.ts"
Cohesion: 0.05
Nodes (60): EditExerciseScreen(), ExerciseDetailScreen(), formatUsageBreakdown(), ExercisesScreen(), ActiveWorkoutEditExercisesContent(), ExerciseListRow(), ExerciseListRowProps, buildAlphabetizedExerciseListItems() (+52 more)

### Community 8 - "withDatabaseSpan"
Cohesion: 0.11
Nodes (38): useOnboardingActions(), UseOnboardingActionsParams, completeOnboardingWithPreferences(), CompleteOnboardingWithPreferencesParams, SettingsContext, SettingsProvider(), addRestTimerPreset(), deleteRestTimerPreset() (+30 more)

### Community 9 - "useRestTimerStore"
Cohesion: 0.22
Nodes (12): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerTrigger(), useIsRestTimerRunning(), REST_TIMER_INCREMENT_SECONDS (+4 more)

### Community 10 - "android"
Cohesion: 0.18
Nodes (11): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, android (+3 more)

### Community 11 - "step-goal-sheet.tsx"
Cohesion: 0.07
Nodes (39): StyledGestureScrollView, BackButtonProps, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants (+31 more)

### Community 12 - "DrizzleDb"
Cohesion: 0.12
Nodes (31): DrizzleDb, archiveExercise(), deleteExercise(), getExerciseUsageExistsQuery(), isExerciseUsed(), removeCustomExercise(), rebuildPersonalRecordsForExerciseInTransaction(), rebuildPersonalRecordsForExercises() (+23 more)

### Community 13 - "exercises/index.tsx"
Cohesion: 0.24
Nodes (7): InputFieldLayout(), InputFieldLayoutProps, Input, InputAccessibilityState, InputProps, NativeTextInputProps, SearchInputIcon()

### Community 14 - "WeightUnit"
Cohesion: 0.20
Nodes (16): areSameTrackingValues(), formatTrackingValue(), getSetValues(), ActiveWorkoutExerciseCardProps, WorkoutExerciseSummary(), WorkoutExerciseSummaryProps, WorkoutHistoryExerciseCardProps, DisplaySetGroup (+8 more)

### Community 15 - "Set"
Cohesion: 0.14
Nodes (30): Set, CompletedHistoryEntry, SetValues, TrackingFieldDefinition, SetFormRowProps, SetFormProps, ActiveDurationPickerState, BaseRowView (+22 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 17 - "Log Screen Rendering Performance Plan"
Cohesion: 0.10
Nodes (19): Acceptance criteria, Checks after implementation, Cross-phase risks and decisions, Deferred-work fallback, Log Screen Rendering Performance Plan, Objective, Observed baseline, Phase 1 — Baseline and attribution (+11 more)

### Community 18 - "set-duration-picker-sheet.tsx"
Cohesion: 0.15
Nodes (11): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+3 more)

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
Cohesion: 0.11
Nodes (20): SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps, toneProgress, SetFormRowActions() (+12 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "text.tsx"
Cohesion: 0.07
Nodes (42): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+34 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.18
Nodes (15): assertNonNegativeNumber(), assertPositiveNumber(), getDurationMs(), isNonNegativeNumber(), isPositiveNumber(), TRACKING_TYPES, TrackingTypeDefinition, trackingTypeSet (+7 more)

### Community 26 - "progress.repository.ts"
Cohesion: 0.14
Nodes (29): getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), getBestSetId(), getLatestAchievedAt(), getSetAchievedAt() (+21 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "database-provider.tsx"
Cohesion: 0.11
Nodes (20): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+12 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "set-form.tsx"
Cohesion: 0.20
Nodes (9): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, formEaseOut, formLayout, formStateEntering, formStateExiting (+1 more)

### Community 32 - "rest-timer-host.tsx"
Cohesion: 0.39
Nodes (7): dismissSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, getRestTimerNotificationData(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification()

### Community 33 - "Text"
Cohesion: 0.08
Nodes (39): Props, State, StyledActivityIndicator, StyledScrollView, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants (+31 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.12
Nodes (10): RootNavigator(), CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost(), appFontAssets (+2 more)

### Community 35 - "Workout"
Cohesion: 0.08
Nodes (37): ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, createRestTimerPreset(), WorkoutLogRowProps (+29 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "TrackingType"
Cohesion: 0.22
Nodes (13): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps (+5 more)

### Community 38 - "workout-template.repository.ts"
Cohesion: 0.08
Nodes (47): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, showSnackbar(), Exercise, WorkoutTemplate, WorkoutTemplateExercise, CustomExerciseDetailsUpdate, validateStagedCustomExerciseNames() (+39 more)

### Community 39 - "package.json"
Cohesion: 0.13
Nodes (14): engines, node, pnpm, lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, main, name (+6 more)

### Community 40 - "useAppTheme"
Cohesion: 0.17
Nodes (12): unstable_settings, WorkoutLayout(), SegmentedControl(), SegmentedControlOption, SegmentedControlProps, Switch(), SwitchProps, THEME_OPTIONS (+4 more)

### Community 41 - "workouts/[id].tsx"
Cohesion: 0.15
Nodes (16): WorkoutDetailLoaded(), WorkoutDetailScreen(), RenameSheet(), ActiveWorkoutActionsSheet(), ActiveWorkoutDuration(), ActiveWorkoutDurationProps, ActiveWorkoutHeaderDuration(), ActiveWorkoutHeaderWithActions() (+8 more)

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

### Community 48 - "workout.repository.ts"
Cohesion: 0.06
Nodes (56): Index(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), HistoricalWorkoutDraftScreen(), WorkoutDetailLoadedProps, useDrizzle(), useIndexRedirect(), isOnboardingCompleted() (+48 more)

### Community 49 - "exercise-history-list.tsx"
Cohesion: 0.16
Nodes (16): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatNumber(), formatPersonalRecordValue(), formatScore(), ExerciseHistoryData, ExerciseHistoryEntry (+8 more)

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

### Community 56 - "weight.utils.ts"
Cohesion: 0.18
Nodes (14): ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRow(), ActiveWorkoutExerciseEditRowProps, ExerciseTrackTabProps, ProgressionSuggestion(), ProgressionSuggestionProps, ProgressionSuggestionData, SetForm() (+6 more)

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

### Community 61 - "bottom-sheet-input.tsx"
Cohesion: 0.20
Nodes (9): StyledBottomSheetTextInput, BottomSheetInput, BottomSheetInputProps, BottomSheetTextInputRef, InputAccessibilityState, NativeTextInputProps, ExerciseNameField(), ExerciseNameFieldProps (+1 more)

### Community 62 - "seed.ts"
Cohesion: 0.18
Nodes (19): NewExerciseScreen(), exercises, NewExercise, createSeedExercises(), runSeedIfNeeded(), runSeedUpgrades(), upsertAppMeta(), normalizeExerciseName() (+11 more)

### Community 63 - "rest-timer-sheet.tsx"
Cohesion: 0.33
Nodes (6): RestTimerIdleContentProps, RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps, RestTimerSheetProps, RestTimerContext

### Community 64 - "snackbar.tsx"
Cohesion: 0.38
Nodes (6): notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions, SnackbarState, useSnackbarStore

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

### Community 73 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

### Community 78 - "observability-span.ts"
Cohesion: 0.10
Nodes (17): expo, install, exclude, @sentry/react-native, DomainFlowSpanOptions, isPromiseLike(), ObservabilitySpanOptions, setSpanStatus() (+9 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 144 - "progression-suggestion.utils.ts"
Cohesion: 0.36
Nodes (8): computeEstimated1RM(), roundScore(), areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry

### Community 146 - "wheel-picker.tsx"
Cohesion: 0.33
Nodes (5): WheelPicker, WheelPickerBase, WheelPickerComponent, SetDurationWheel(), SetDurationWheelProps

### Community 153 - "rest-timer-preset-editor-sheet.tsx"
Cohesion: 0.17
Nodes (15): SettingsContextValue, REST_TIMER_PRESET_NAME_MAX_LENGTH, RestTimerPreset, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, getDurationDraft() (+7 more)

## Knowledge Gaps
- **563 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+558 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `observability-span.ts` to `common-providers.tsx`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _563 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useSettings` be split into smaller, more focused modules?**
  _Cohesion score 0.05664556962025316 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07456140350877193 - nodes in this community are weakly interconnected._
- **Should `active-workout-exercise-edit-list.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0792156862745098 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08315863032844165 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09024390243902439 - nodes in this community are weakly interconnected._