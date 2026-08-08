# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 332 files · ~114,790 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1799 nodes · 5250 edges · 136 communities (73 shown, 63 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1dd2fe6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Workout
- steps-content.tsx
- workout-log-content.tsx
- database-provider.tsx
- ui/bottom-sheet.tsx
- rest-timer-setting-sheet.tsx
- active-workout-content.tsx
- Text
- settings.repository.ts
- rest-timer-sheet.tsx
- workout-template.repository.ts
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
- progress.repository.ts
- app-theme-provider.tsx
- settings.tsx
- scripts
- knip.json
- useDrizzle
- text.tsx
- use-exercise-detail.ts
- common-providers.tsx
- schema.ts
- expo
- TrackingType
- exercise-picker-sheet.tsx
- package.json
- useAppTheme
- onboarding.repository.ts
- NodeSQLiteDatabase
- overrides
- include
- expo-constants
- dependencies
- Product
- use-live-with-fallback.hook.ts
- segmented-control.tsx
- Liftlog
- expo-audio
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- @tailwindcss/postcss
- tests/tsconfig.json
- useLiveWithFallback
- graphify reference: query, path, explain
- .commitlintrc.json
- app/_layout.tsx
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
- expo
- expo-asset
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
- postcss
- prettier-plugin-tailwindcss
- @types/react
- typescript
- @typescript-eslint/parser
- exercise-picker-filters.tsx
- post-commit
- post-checkout

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 105 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
5. `Icon()` - 72 edges
6. `Button()` - 62 edges
7. `Workout` - 48 edges
8. `expo-router` - 43 edges
9. `useLiveWithFallback()` - 41 edges
10. `ExerciseListItem` - 37 edges

## Surprising Connections (you probably didn't know these)
- `createTrackedSet()` --calls--> `createCompletedSet()`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/features/workouts/workout.repository.ts
- `WorkoutDetailLoaded()` --indirect_call--> `DumbbellIcon()`  [INFERRED]
  src/app/workouts/[id].tsx → tests/mocks/lucide-react-native.ts
- `getHistoricalPersonalRecordRows()` --references--> `DrizzleDb`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/db/client.ts
- `getPersonalRecordSetIds()` --references--> `DrizzleDb`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/db/client.ts
- `insertHistoricalWorkout()` --references--> `DrizzleDb`  [EXTRACTED]
  tests/db/database.integration.test.ts → src/db/client.ts

## Import Cycles
- None detected.

## Communities (136 total, 63 thin omitted)

### Community 0 - "Workout"
Cohesion: 0.09
Nodes (31): ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow, ExerciseHistoryRows, WorkoutLogRowProps, ActiveWorkoutContentProps (+23 more)

### Community 1 - "steps-content.tsx"
Cohesion: 0.07
Nodes (52): Card, CardContent, CardProps, HealthStepDay, StepDayRow(), StepDayRowProps, StepsActionsSheet(), StepsContent() (+44 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.07
Nodes (49): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+41 more)

### Community 3 - "database-provider.tsx"
Cohesion: 0.09
Nodes (27): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+19 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.09
Nodes (38): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+30 more)

### Community 5 - "rest-timer-setting-sheet.tsx"
Cohesion: 0.14
Nodes (13): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, minuteItems (+5 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.06
Nodes (73): expo-router, EditExerciseScreen(), ExerciseDetailScreen(), formatUsageBreakdown(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen() (+65 more)

### Community 7 - "Text"
Cohesion: 0.09
Nodes (39): Props, State, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants (+31 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.07
Nodes (47): ExerciseListRow(), ExerciseListRowProps, formatMuscleList(), getPrimaryMuscleLabel(), numberFormatter, StepGoalSheet(), StepGoalSheetContent, SettingsContext (+39 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.10
Nodes (32): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, getDurationDraft(), RestTimerIdleContent(), RestTimerIdleContentProps, RestTimerPausedContent(), RestTimerPresetEditorSheet() (+24 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.05
Nodes (72): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem (+64 more)

### Community 11 - "exercise-metadata-form.tsx"
Cohesion: 0.15
Nodes (17): ChoiceChip(), choiceChipContainerVariants, choiceChipTextVariants, CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget (+9 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.18
Nodes (21): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+13 more)

### Community 13 - "cn"
Cohesion: 0.09
Nodes (32): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+24 more)

### Community 14 - "weight.utils.ts"
Cohesion: 0.22
Nodes (15): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatDisplaySetPosition() (+7 more)

### Community 15 - "Set"
Cohesion: 0.16
Nodes (26): Set, SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState, DraftSetFormRow (+18 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.08
Nodes (25): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+17 more)

### Community 17 - "exercise-history-list.tsx"
Cohesion: 0.21
Nodes (12): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryWidgets(), formatWorkoutDate() (+4 more)

### Community 18 - "workout.repository.ts"
Cohesion: 0.09
Nodes (49): ActiveWorkoutEditExercisesContent(), DrizzleDb, NewWorkout, rebuildPersonalRecordsForExerciseInTransaction(), useActiveWorkoutActions(), useActiveWorkoutContent(), UseActiveWorkoutContentParams, AddSetValues (+41 more)

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
Cohesion: 0.06
Nodes (38): StyledActivityIndicator, SwitchProps, useSettings(), ActiveWorkoutExerciseEditRow(), ProgressionSuggestion(), darkFeedbackColors, SetFormEmptyState(), emptyStateEntering (+30 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "set-duration-picker-sheet.tsx"
Cohesion: 0.12
Nodes (14): centisecondItems, DurationInputMode, DurationModeTab(), DurationModeTabProps, DurationModeTabsProps, hourItems, minuteItems, SetDurationPickerSheet() (+6 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.16
Nodes (20): PersonalRecord, assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), formatPersonalRecordValue(), getDurationMs(), getSetScore(), isNonNegativeNumber() (+12 more)

### Community 26 - "progress.repository.ts"
Cohesion: 0.13
Nodes (27): buildExerciseHistory(), getCompletedSetsForPersonalRecords(), getExerciseHistoryQuery(), getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows(), rebuildPersonalRecordsForExercises(), rebuildPersonalRecordsForExercisesInTransaction(), getDurationSecondsFromMs() (+19 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "settings.tsx"
Cohesion: 0.29
Nodes (5): AboutInfoSection(), StepsSection(), THEME_OPTIONS, ThemeSelectionSection(), WorkoutPreferencesSection()

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "useDrizzle"
Cohesion: 0.10
Nodes (25): WorkoutDetailLoadedProps, useDrizzle(), AndroidStepsSyncHost(), saveStepSyncResult(), ActiveWorkoutHeaderWithActions(), useFinishWorkout(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutDraftScreen() (+17 more)

### Community 32 - "text.tsx"
Cohesion: 0.10
Nodes (21): ChipShape, ChipTextStyle, ChoiceChipProps, choiceChipVariantConfig, ChoiceChipVariants, NativePressableProps, PulsatingDot(), nativeTextDefaults (+13 more)

### Community 33 - "use-exercise-detail.ts"
Cohesion: 0.29
Nodes (12): getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), useCustomExerciseEdit(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId() (+4 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.14
Nodes (11): CommonProviders(), CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary, notifySnackbarDismissed(), SnackbarHost(), SnackbarMessage, SnackbarOptions (+3 more)

### Community 35 - "schema.ts"
Cohesion: 0.08
Nodes (43): ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName(), getStartedAt(), hasDevSeeded(), hasWorkoutData() (+35 more)

### Community 36 - "expo"
Cohesion: 0.08
Nodes (25): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, reactCompiler (+17 more)

### Community 37 - "TrackingType"
Cohesion: 0.14
Nodes (23): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps (+15 more)

### Community 38 - "exercise-picker-sheet.tsx"
Cohesion: 0.11
Nodes (21): ExerciseRowProps, categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), ExerciseListItem (+13 more)

### Community 39 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, pnpm, expo, install, exclude, main, name (+5 more)

### Community 40 - "useAppTheme"
Cohesion: 0.22
Nodes (10): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), unstable_settings, WorkoutLayout(), useAppTheme() (+2 more)

### Community 41 - "onboarding.repository.ts"
Cohesion: 0.31
Nodes (7): Index(), useIndexRedirect(), useOnboardingActions(), completeOnboardingWithPreferences(), isOnboardingCompleted(), getSetting(), getWeightUnit()

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

### Community 48 - "use-live-with-fallback.hook.ts"
Cohesion: 0.22
Nodes (8): ExerciseMetadataForm(), activeDebugSubscriptions, debugQueryRuns, LiveRowsQuery, QueryRows, UseLiveWithFallbackOptions, UseLiveWithFallbackResult, scheduleIdleTask()

### Community 49 - "segmented-control.tsx"
Cohesion: 0.43
Nodes (5): SegmentedControlOption, SegmentedControlProps, triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics()

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.21
Nodes (16): dismissSnackbar(), RestTimerHost(), useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, cancelRestTimerNotification(), cancelScheduledRestTimerNotification(), ensureRestTimerNotificationChannel(), getRestTimerNotificationData() (+8 more)

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.39
Nodes (4): playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "useLiveWithFallback"
Cohesion: 0.26
Nodes (12): ExercisesScreen(), buildAlphabetizedExerciseListItems(), getExercisesQuery(), matchesExerciseFilter(), useExercisesScreen(), useExercises(), UseExercisesOptions, useActiveWorkoutExercisePicker() (+4 more)

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 62 - "app/_layout.tsx"
Cohesion: 0.18
Nodes (8): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect, RootNavigator(), DrizzleStudio(), appFontAssets

### Community 63 - "lint-staged"
Cohesion: 0.40
Nodes (5): lint-staged, **/*.{md,json}, **/*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

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

### Community 139 - "exercise-picker-filters.tsx"
Cohesion: 0.18
Nodes (11): StyledGestureScrollView, StyledScrollView, BackButtonProps, IconComponent, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilter, ExercisePickerFilterOption (+3 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

## Knowledge Gaps
- **543 isolated node(s):** `SavedHistoricalWorkoutDraft`, `SavedHistoricalWorkoutEditDraft`, `CompletedSetCommandOptions`, `CompletedSetMutationResult`, `NewCompletedSet` (+538 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `package.json` to `app/_layout.tsx`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **What connects `SavedHistoricalWorkoutDraft`, `SavedHistoricalWorkoutEditDraft`, `CompletedSetCommandOptions` to the rest of the system?**
  _543 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Workout` be split into smaller, more focused modules?**
  _Cohesion score 0.0907563025210084 - nodes in this community are weakly interconnected._
- **Should `steps-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07115384615384615 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06994535519125683 - nodes in this community are weakly interconnected._
- **Should `database-provider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0907563025210084 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08823529411764706 - nodes in this community are weakly interconnected._