# Graph Report - liftlog  (2026-08-08)

## Corpus Check
- 330 files · ~112,619 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1791 nodes · 5260 edges · 139 communities (75 shown, 64 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37e2dc0e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ExerciseListItem
- use-steps-screen.ts
- workout-log-content.tsx
- schema.ts
- ui/bottom-sheet.tsx
- useDrizzle
- active-workout-content.tsx
- Text
- settings.repository.ts
- rest-timer-sheet.tsx
- workout-template.repository.ts
- chip.tsx
- DrizzleDb
- text.tsx
- TrackingType
- Set
- styled/bottom-sheet.tsx
- Workout
- workout.repository.ts
- devDependencies
- Components
- migrations.js
- set-form-row.tsx
- What You Must Do When Invoked
- button.tsx
- tracking.domain.ts
- use-exercise-history.ts
- app-theme-provider.tsx
- useSettings
- scripts
- knip.json
- WorkoutDetailLoaded
- set-form.tsx
- use-exercise-detail.ts
- useAppTheme
- use-historical-workout-start.ts
- expo
- exercise-progress-chart.tsx
- exercise-picker-sheet.tsx
- package.json
- (tabs)/_layout.tsx
- common-providers.tsx
- NodeSQLiteDatabase
- overrides
- include
- android
- dependencies
- Product
- rest-timer-setting-sheet.tsx
- progression-suggestion.utils.ts
- Liftlog
- onboarding.repository.ts
- rest-timer-notifications.service.ts
- graphify reference: extra exports and benchmark
- replaySoundEffect
- nativewind-env.d.ts
- log/index.tsx
- tests/tsconfig.json
- database-error-boundary.tsx
- graphify reference: query, path, explain
- .commitlintrc.json
- use-rest-timer-notification-responses.ts
- plugins
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
- flash-list.tsx
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
- expo-constants
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
- @tailwindcss/postcss
- @types/react
- typescript
- @typescript-eslint/parser

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

## Communities (139 total, 64 thin omitted)

### Community 0 - "ExerciseListItem"
Cohesion: 0.05
Nodes (59): ExerciseDetailScreen(), formatUsageBreakdown(), WorkoutTemplateDetailLoaded(), ReorderableHandle(), ReorderableHandleProps, ReorderableHandleRenderProps, ReorderableList(), ReorderableListItemProps (+51 more)

### Community 1 - "use-steps-screen.ts"
Cohesion: 0.06
Nodes (59): BackButtonProps, Card, CardContent, CardProps, IconComponent, PulsatingDot(), HealthStepDay, StepDayRow() (+51 more)

### Community 2 - "workout-log-content.tsx"
Cohesion: 0.06
Nodes (56): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps (+48 more)

### Community 3 - "schema.ts"
Cohesion: 0.06
Nodes (57): DrizzleProvider(), migrateAsync(), configureDatabase(), createDrizzleDb(), databaseName, databaseOptions, ForeignKeysPragma, ForeignKeyViolation (+49 more)

### Community 4 - "ui/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (46): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+38 more)

### Community 5 - "useDrizzle"
Cohesion: 0.08
Nodes (43): ExercisesScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditScreen(), WorkoutDetailLoadedProps, DatabaseProviderProps, DrizzleContext (+35 more)

### Community 6 - "active-workout-content.tsx"
Cohesion: 0.13
Nodes (31): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutDetailScreen(), WorkoutTemplateDetailScreen(), BackButton() (+23 more)

### Community 7 - "Text"
Cohesion: 0.09
Nodes (33): Props, State, StyledScrollView, Button(), buttonSpinnerVariants, buttonTextVariants, AppIconProps, createStyledIcon() (+25 more)

### Community 8 - "settings.repository.ts"
Cohesion: 0.09
Nodes (44): numberFormatter, StepGoalSheet(), StepGoalSheetContent, SettingsContext, SettingsContextValue, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset() (+36 more)

### Community 9 - "rest-timer-sheet.tsx"
Cohesion: 0.09
Nodes (33): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, minuteItems, RestTimerDurationPicker(), RestTimerDurationPickerProps, secondItems, RestTimerIdleContentProps (+25 more)

### Community 10 - "workout-template.repository.ts"
Cohesion: 0.09
Nodes (39): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, Exercise, WorkoutTemplate, WorkoutTemplateExercise, NewTemplateContent(), WorkoutTemplateCardProps, useSaveWorkoutTemplate() (+31 more)

### Community 11 - "chip.tsx"
Cohesion: 0.07
Nodes (38): StyledGestureScrollView, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig (+30 more)

### Community 12 - "DrizzleDb"
Cohesion: 0.12
Nodes (37): NewExerciseScreen(), DrizzleDb, NewExercise, createSeedExercises(), runSeedIfNeeded(), runSeedUpgrades(), upsertAppMeta(), normalizeExerciseName() (+29 more)

### Community 13 - "text.tsx"
Cohesion: 0.08
Nodes (34): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+26 more)

### Community 14 - "TrackingType"
Cohesion: 0.13
Nodes (29): ExerciseTrackingStyleSelectorProps, areSameTrackingValues(), formatTrackingValue(), getSetValues(), TrackingType, UseOnboardingActionsParams, CompleteOnboardingWithPreferencesParams, ActiveWorkoutExerciseEditRow() (+21 more)

### Community 15 - "Set"
Cohesion: 0.13
Nodes (31): Set, CompletedHistoryEntry, ExerciseHistoryQueryRow, ExerciseHistoryRows, SetValues, TrackingFieldDefinition, SetFormProps, ActiveDurationPickerState (+23 more)

### Community 16 - "styled/bottom-sheet.tsx"
Cohesion: 0.07
Nodes (30): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+22 more)

### Community 17 - "Workout"
Cohesion: 0.11
Nodes (29): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Workout, WorkoutExercise, WorkoutLogRowProps, ActiveWorkoutHeaderWithActionsProps, HistoricalWorkoutHeaderProps, RecentWorkoutCardProps (+21 more)

### Community 18 - "workout.repository.ts"
Cohesion: 0.12
Nodes (27): useActiveWorkoutContent(), UseActiveWorkoutContentParams, AddSetValues, getSetStorageValues(), useExerciseTrackActions(), CompletedSetCommandOptions, CompletedSetUpdates, createCompletedSet() (+19 more)

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
Nodes (22): SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone, SetFormSaveSurface(), SetFormSaveSurfaceProps, toneProgress, SetFormRowActions() (+14 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 24 - "button.tsx"
Cohesion: 0.09
Nodes (19): StyledActivityIndicator, ButtonProps, ButtonSize, buttonTextStyle, ButtonVariant, buttonVariantConfig, ButtonVariants, centisecondItems (+11 more)

### Community 25 - "tracking.domain.ts"
Cohesion: 0.14
Nodes (20): PersonalRecord, assertNonNegativeNumber(), assertPositiveNumber(), formatNumber(), formatPersonalRecordValue(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot() (+12 more)

### Community 26 - "use-exercise-history.ts"
Cohesion: 0.20
Nodes (15): buildExerciseHistory(), getExerciseHistoryQuery(), getPersonalRecordsByExerciseQuery(), mapExerciseHistoryRows(), resolveTrackingType(), canLoadExerciseHistoryPage(), CanLoadExerciseHistoryPageOptions, didExerciseHistoryPageFinish() (+7 more)

### Community 27 - "app-theme-provider.tsx"
Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 28 - "useSettings"
Cohesion: 0.16
Nodes (13): SegmentedControl(), AboutInfoSection(), StepsSection(), THEME_OPTIONS, ThemeSelectionSection(), WEIGHT_UNIT_OPTIONS, WorkoutPreferencesSection(), useSettings() (+5 more)

### Community 29 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, lint (+11 more)

### Community 30 - "knip.json"
Cohesion: 0.11
Nodes (17): entry, expo, config, entry, ignore, ignoreBinaries, $schema, tags (+9 more)

### Community 31 - "WorkoutDetailLoaded"
Cohesion: 0.17
Nodes (13): WorkoutDetailLoaded(), ActiveWorkoutHeaderWithActions(), useHistoricalWorkoutDraftActions(), useHistoricalWorkoutEditActions(), useRepeatWorkout(), useWorkoutDelete(), useWorkoutRename(), chunkRows() (+5 more)

### Community 32 - "set-form.tsx"
Cohesion: 0.14
Nodes (13): SegmentedControlOption, SegmentedControlProps, SwitchProps, darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, formEaseOut (+5 more)

### Community 33 - "use-exercise-detail.ts"
Cohesion: 0.28
Nodes (14): EditExerciseScreen(), getExerciseByIdQuery(), getExerciseUsageSummaryQuery(), useCustomExerciseEdit(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), getBestSetId() (+6 more)

### Community 34 - "useAppTheme"
Cohesion: 0.16
Nodes (10): RootNavigator(), unstable_settings, WorkoutLayout(), CommonProviders(), DrizzleStudio(), TodayStepRadialCard(), useAppTheme(), appFontAssets (+2 more)

### Community 35 - "use-historical-workout-start.ts"
Cohesion: 0.19
Nodes (14): useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, useWorkoutTemplates(), UseWorkoutTemplatesOptions, buildHistoricalWorkoutSourceSnapshot(), cleanupStaleHistoricalWorkoutDrafts(), createHistoricalWorkoutDraft(), createHistoricalWorkoutDraftFromTemplate() (+6 more)

### Community 36 - "expo"
Cohesion: 0.13
Nodes (14): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, orientation (+6 more)

### Community 37 - "exercise-progress-chart.tsx"
Cohesion: 0.21
Nodes (12): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChart(), ExerciseProgressChartProps (+4 more)

### Community 38 - "exercise-picker-sheet.tsx"
Cohesion: 0.14
Nodes (11): ActiveWorkoutExercisePickerSheetCommonProps, ActiveWorkoutExercisePickerSheetProps, ExercisePickerRow, ExercisePickerSearchInput, ExercisePickerSearchInputProps, ExercisePickerSheet(), ExercisePickerSheetBodyProps, ExercisePickerSheetCommonProps (+3 more)

### Community 39 - "package.json"
Cohesion: 0.14
Nodes (13): engines, node, pnpm, expo, install, exclude, main, name (+5 more)

### Community 40 - "(tabs)/_layout.tsx"
Cohesion: 0.23
Nodes (10): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+2 more)

### Community 41 - "common-providers.tsx"
Cohesion: 0.25
Nodes (11): CommonProvidersProps, DatabaseProvider(), dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage, SnackbarOptions (+3 more)

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
Nodes (11): class-variance-authority, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo-drizzle-studio-plugin, expo-router, react-native-safe-area-context (+3 more)

### Community 47 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 48 - "rest-timer-setting-sheet.tsx"
Cohesion: 0.22
Nodes (8): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, SetDurationWheelProps

### Community 49 - "progression-suggestion.utils.ts"
Cohesion: 0.27
Nodes (10): computeEstimated1RM(), roundScore(), ProgressionSuggestionProps, areSameSetValues(), getBestEstimated1RM(), getCompletedSets(), getLastWorkingSet(), getProgressionSuggestion() (+2 more)

### Community 50 - "Liftlog"
Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 51 - "onboarding.repository.ts"
Cohesion: 0.33
Nodes (6): Index(), useIndexRedirect(), useOnboardingActions(), completeOnboardingWithPreferences(), isOnboardingCompleted(), SETTINGS_KEYS

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

### Community 56 - "log/index.tsx"
Cohesion: 0.32
Nodes (5): StepsContent(), getAvailabilityLabel(), LogHeader(), LogHeaderProps, LogView

### Community 57 - "tests/tsconfig.json"
Cohesion: 0.29
Nodes (6): ./mocks/lucide-react-native.ts, ../tsconfig.json, compilerOptions, paths, extends, lucide-react-native

### Community 58 - "database-error-boundary.tsx"
Cohesion: 0.29
Nodes (3): DatabaseErrorBoundary, Props, State

### Community 59 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 60 - ".commitlintrc.json"
Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 61 - "use-rest-timer-notification-responses.ts"
Cohesion: 0.53
Nodes (5): useRestTimerNotificationResponses(), UseRestTimerNotificationResponsesParams, getRestTimerNotificationData(), getActiveWorkoutExerciseForRestTimerNotification(), getActiveWorkoutForRestTimerNotification()

### Community 62 - "plugins"
Cohesion: 0.40
Nodes (5): plugins, expo-asset, expo-font, expo-notifications, react-native-health-connect

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

### Community 73 - "flash-list.tsx"
Cohesion: 0.50
Nodes (3): FlashListClassNameProps, StyledFlashList, StyledFlashListBase

## Knowledge Gaps
- **538 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+533 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@sentry/react-native` connect `package.json` to `useAppTheme`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _538 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ExerciseListItem` be split into smaller, more focused modules?**
  _Cohesion score 0.05368382080710848 - nodes in this community are weakly interconnected._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05627545353572751 - nodes in this community are weakly interconnected._
- **Should `workout-log-content.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06459627329192547 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06386946386946386 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07103825136612021 - nodes in this community are weakly interconnected._