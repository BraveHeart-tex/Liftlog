# Graph Report - liftlog  (2026-08-09)

## Corpus Check
- 336 files · ~117,182 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1828 nodes · 5321 edges · 145 communities (81 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ba440f4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useDrizzle
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
- use-active-workout-exercise-draft.ts
- exercise.repository.ts
- set-duration-picker-sheet.tsx
- TrackingType
- Set
- styled/bottom-sheet.tsx
- exercise-tracking-style-selector.tsx
- workout.repository.ts
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- use-historical-workout-start.ts
- tracking.domain.ts
- resolveTrackingType
- app-theme-provider.tsx
- Text
- scripts
- knip.json
- withDatabaseSpan
- exercise-metadata-form.tsx
- button.tsx
- common-providers.tsx
- chip.tsx
- expo
- useLiveWithFallback
- ExerciseListItem
- package.json
- icon.tsx
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
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- exercise-display.utils.ts
- tests/tsconfig.json
- (tabs)/_layout.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- exercise-picker-filters.tsx
- use-exercises-screen.ts
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
- expo-atlas
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
- @stylistic/eslint-plugin
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
- @tailwindcss/postcss
- set-form.tsx
- database-provider.tsx
- useAppTheme
- @types/react
- typescript
- @typescript-eslint/parser
- post-commit
- post-checkout
- @faker-js/faker
- lint-staged
- knip
- prettier

## God Nodes (most connected - your core abstractions)
1. `DrizzleDb` - 106 edges
2. `cn()` - 100 edges
3. `Text` - 87 edges
4. `useDrizzle()` - 79 edges
5. `Icon()` - 72 edges
6. `Button()` - 62 edges
7. `withDatabaseSpan()` - 58 edges
8. `Workout` - 45 edges
9. `expo-router` - 43 edges
10. `useLiveWithFallback()` - 42 edges

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

## Communities (145 total, 64 thin omitted)

### Community 0 - "useDrizzle"
Cohesion: 0.08
Nodes (35): ActiveWorkoutEditExercisesContentProps, useDrizzle(), Workout, ActiveWorkoutContentProps, ActiveWorkoutHeaderWithActions(), ActiveWorkoutHeaderWithActionsProps, HistoricalWorkoutHeaderProps, SaveWorkoutTemplateSheetProps (+27 more)

### Community 1 - "use-steps-screen.ts"
Cohesion: 0.10
Nodes (39): HealthStepDay, StepDayRow(), StepDayRowProps, StepsSummaryCards(), StepsSummaryCardsProps, StepsUnavailableStateProps, BACKGROUND_PERMISSION, getHealthConnectAvailability() (+31 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.07
Nodes (43): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, StepsContent(), getAvailabilityLabel(), AnimatedText, CalendarDayButton(), CalendarDayButtonProps (+35 more)

### Community 3 - "schema.ts"
Cohesion: 0.08
Nodes (41): configureDatabase(), databaseName, ForeignKeysPragma, ForeignKeyViolation, runDatabaseMigrations(), schema, buildSetRows(), getExerciseRowsByName() (+33 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.06
Nodes (52): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+44 more)

### Community 5 - "text.tsx"
Cohesion: 0.08
Nodes (40): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+32 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.10
Nodes (40): expo-router, ExerciseDetailScreen(), formatUsageBreakdown(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen() (+32 more)

### Community 7 - "exercise-picker-sheet.tsx"
Cohesion: 0.16
Nodes (11): SearchInputIcon(), ExerciseListDataItem, ExercisePickerFilters(), ExercisePickerRow, ExercisePickerSearchInput, ExercisePickerSearchInputProps, ExercisePickerSheet(), ExercisePickerSheetBodyProps (+3 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.10
Nodes (38): SettingsContext, SettingsContextValue, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getRestTimerPresets(), getSettingsQuery() (+30 more)

### Community 9 - "date.utils.ts"
Cohesion: 0.15
Nodes (14): ActiveWorkoutDuration(), ActiveWorkoutDurationProps, RestTimerIdleContentProps, RestTimerPresetList(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps, RestTimerSheetProps (+6 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.11
Nodes (32): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, WorkoutTemplate, WorkoutTemplateExercise, validateStagedCustomExerciseNames(), useSaveWorkoutTemplate(), useWorkoutStart(), activeWorkoutRoute (+24 more)

### Community 11 - "use-active-workout-exercise-draft.ts"
Cohesion: 0.21
Nodes (12): ActiveWorkoutEditExercisesContent(), DraftExerciseRow, SaveActiveWorkoutExerciseDraftResult, useActiveWorkoutExerciseDraft(), useSaveActiveWorkoutExerciseDraft(), useSaveWorkoutExerciseEdits(), ActiveWorkoutExerciseDraftBaselineRow, ActiveWorkoutExerciseDraftConflictError (+4 more)

### Community 12 - "exercise.repository.ts"
Cohesion: 0.17
Nodes (22): NewExerciseScreen(), Exercise, NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), CustomExerciseDetailsUpdate, deleteExercise() (+14 more)

### Community 13 - "set-duration-picker-sheet.tsx"
Cohesion: 0.08
Nodes (23): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, minuteItems (+15 more)

### Community 14 - "TrackingType"
Cohesion: 0.11
Nodes (34): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatPersonalRecordValue(), formatTrackingValue(), TrackingType, UseOnboardingActionsParams, ActiveWorkoutExerciseEditRow() (+26 more)

### Community 15 - "Set"
Cohesion: 0.17
Nodes (27): Set, getSetValues(), SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState (+19 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (31): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+23 more)

### Community 17 - "exercise-tracking-style-selector.tsx"
Cohesion: 0.19
Nodes (13): ExerciseListRow(), ExerciseListRowProps, ExerciseTrackingStyleSelector(), ExerciseTrackingStyleSelectorProps, TRACKING_TYPE_ROWS, formatMuscleList(), getPrimaryMuscleLabel(), TRACKING_TYPES (+5 more)

### Community 18 - "workout.repository.ts"
Cohesion: 0.10
Nodes (42): WorkoutDetailLoadedProps, DrizzleDb, getCompletedSetsForPersonalRecords(), rebuildPersonalRecordsForExerciseInTransaction(), rebuildPersonalRecordsForExercises(), rebuildPersonalRecordsForExercisesInTransaction(), useActiveWorkoutActions(), AddSetValues (+34 more)

### Community 19 - "devDependencies"
Cohesion: 0.07
Nodes (29): babel-plugin-inline-import, babel-preset-expo, @commitlint/cli, @commitlint/config-conventional, @dotenvx/dotenvx, eslint, eslint-config-expo, eslint-plugin-unused-imports (+21 more)

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

### Community 24 - "use-historical-workout-start.ts"
Cohesion: 0.19
Nodes (14): WorkoutTemplateCardProps, useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, useWorkoutTemplates(), UseWorkoutTemplatesOptions, cleanupStaleHistoricalWorkoutDrafts(), createHistoricalWorkoutDraft(), createHistoricalWorkoutDraftFromTemplate() (+6 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.14
Nodes (22): PersonalRecord, getBestSetId(), areSameTrackingValues(), assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), getDurationMs(), getDurationSecondsFromMs() (+14 more)

### Community 26 - "resolveTrackingType"
Cohesion: 0.18
Nodes (13): getExerciseHistoryQuery(), resolveTrackingType(), areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion(), ProgressionHistoryEntry (+5 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "Text"
Cohesion: 0.17
Nodes (14): BackButtonProps, Card, CardContent, CardProps, IconComponent, PulsatingDot(), Text, AboutInfoSection() (+6 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "withDatabaseSpan"
Cohesion: 0.11
Nodes (19): getSetting(), getWeightUnit(), readSetting(), setWeightUnit(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification(), updateWorkoutExerciseSupersets(), DatabaseOperation (+11 more)

### Community 32 - "exercise-metadata-form.tsx"
Cohesion: 0.18
Nodes (14): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataFormProps, FocusableInput, ExerciseMuscleSelector (+6 more)

### Community 33 - "button.tsx"
Cohesion: 0.12
Nodes (15): Props, State, StyledActivityIndicator, Button(), ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle (+7 more)

### Community 34 - "common-providers.tsx"
Cohesion: 0.18
Nodes (16): CommonProviders(), CommonProvidersProps, DatabaseProvider(), dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage (+8 more)

### Community 35 - "chip.tsx"
Cohesion: 0.27
Nodes (9): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+1 more)

### Community 36 - "expo"
Cohesion: 0.08
Nodes (25): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled, reactCompiler (+17 more)

### Community 37 - "useLiveWithFallback"
Cohesion: 0.13
Nodes (26): EditExerciseScreen(), axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps (+18 more)

### Community 38 - "ExerciseListItem"
Cohesion: 0.07
Nodes (54): WorkoutDetailLoaded(), WorkoutTemplateDetailLoaded(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps, ReorderableListProps, ReorderableListRenderItem (+46 more)

### Community 39 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, pnpm, expo, install, exclude, main, name (+5 more)

### Community 40 - "icon.tsx"
Cohesion: 0.10
Nodes (26): StyledGestureScrollView, StyledScrollView, EmptyStateProps, AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone (+18 more)

### Community 41 - "database.integration.test.ts"
Cohesion: 0.10
Nodes (23): Index(), AppMeta, healthStepDays, NewHealthStepDay, useIndexRedirect(), useOnboardingActions(), completeOnboardingWithPreferences(), CompleteOnboardingWithPreferencesParams (+15 more)

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
Cohesion: 0.25
Nodes (12): getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows(), canLoadExerciseHistoryPage(), CanLoadExerciseHistoryPageOptions, didExerciseHistoryPageFinish(), getNextExerciseHistoryLimit(), useActiveWorkoutExerciseDetail(), getBestScore() (+4 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 52 - "rest-timer-notifications.service.ts"
Cohesion: 0.17
Nodes (14): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect, useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, ensureRestTimerNotificationChannel() (+6 more)

### Community 53 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 54 - "replaySoundEffect"
Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 55 - "nativewind-env.d.ts"
Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 56 - "exercise-display.utils.ts"
Cohesion: 0.40
Nodes (5): categoryLabelByValue, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch()

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

### Community 61 - "exercise-picker-filters.tsx"
Cohesion: 0.33
Nodes (5): CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilter, ExercisePickerFilterOption, ExercisePickerFiltersProps

### Community 62 - "use-exercises-screen.ts"
Cohesion: 0.24
Nodes (11): ExercisesScreen(), buildAlphabetizedExerciseListItems(), getExercisesQuery(), matchesExerciseFilter(), useExercisesScreen(), useExercises(), UseExercisesOptions, useActiveWorkoutExercisePicker() (+3 more)

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

### Community 80 - "Sentry Database Observability Plan"
Cohesion: 0.20
Nodes (9): Context, Handoff checklist, Phase 0 — Span foundation, Phase 1 — Shared live-query reads, Phase 2 — Repository operations, Phase 3 — Startup and important user flows, Phase 4 — Baseline review and optimization, Rules (+1 more)

### Community 102 - "app/_layout.tsx"
Cohesion: 0.24
Nodes (5): RootNavigator(), DrizzleStudio(), appFontAssets, AppFontFace, appFonts

### Community 105 - "database-observability.test.ts"
Cohesion: 0.22
Nodes (6): DatabaseSpanOptions, FakeSpan, loadDatabaseObservability(), spans, StartSpanOptions, WithDatabaseSpan

### Community 129 - "set-form.tsx"
Cohesion: 0.11
Nodes (20): ExerciseMetadataForm(), TRACKING_TYPE_DEFINITIONS, useSettings(), ExerciseTrackSection(), ExerciseTrackTabProps, ProgressionSuggestion(), ProgressionSuggestionProps, ProgressionSuggestionData (+12 more)

### Community 130 - "database-provider.tsx"
Cohesion: 0.10
Nodes (25): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+17 more)

### Community 131 - "useAppTheme"
Cohesion: 0.16
Nodes (13): unstable_settings, WorkoutLayout(), SegmentedControl(), SegmentedControlOption, SegmentedControlProps, SwitchProps, THEME_OPTIONS, ThemeSelectionSection() (+5 more)

### Community 141 - "post-commit"
Cohesion: 0.40
Nodes (4): post-commit script, GRAPHIFY_CHANGED, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

### Community 142 - "post-checkout"
Cohesion: 0.50
Nodes (3): post-checkout script, GRAPHIFY_REBUILD_LOG, PYTHONHASHSEED

## Knowledge Gaps
- **567 isolated node(s):** `Context`, `Rules`, `Phase 0 — Span foundation`, `Phase 1 — Shared live-query reads`, `Phase 2 — Repository operations` (+562 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `package.json` to `app/_layout.tsx`, `withDatabaseSpan`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **What connects `Context`, `Rules`, `Phase 0 — Span foundation` to the rest of the system?**
  _567 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useDrizzle` be split into smaller, more focused modules?**
  _Cohesion score 0.08181818181818182 - nodes in this community are weakly interconnected._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10101010101010101 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07402031930333818 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0841813135985199 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06233538191395961 - nodes in this community are weakly interconnected._