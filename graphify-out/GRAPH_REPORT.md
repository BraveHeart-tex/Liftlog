# Graph Report - . (2026-08-08)

## Corpus Check

- cluster-only mode — file stats not available

## Summary

- 1735 nodes · 5456 edges · 97 communities (66 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.63)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `113d798a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- use-steps-screen.ts
- workout.repository.ts
- ui/bottom-sheet.tsx
- active-workout-content.tsx
- react-native
- useDrizzle
- icon.tsx
- scripts
- exercise.repository.ts
- Button
- cn
- chip.tsx
- schema.ts
- progress.repository.ts
- devDependencies
- workout-template.repository.ts
- Set
- set-form-row.tsx
- snackbar.tsx
- workout-log-calendar.tsx
- set-duration-picker-sheet.tsx
- exercise-picker-sheet.tsx
- database-provider.tsx
- DrizzleDb
- compilerOptions
- settings.repository.ts
- rest-timer.store.ts
- weight.utils.ts
- dependencies
- tracking.domain.ts
- app-theme-provider.tsx
- TrackingType
- common-providers.tsx
- styled/bottom-sheet.tsx
- expo-step-counter/package.json
- segmented-control.tsx
- exercise-history-list.tsx
- expo
- src/index.ts
- settings-provider.tsx
- use-active-workout-exercise-draft.ts
- include
- (tabs)/\_layout.tsx
- NodeSQLiteDatabase
- useSettings
- exercise-track-section.tsx
- devDependencies
- button.tsx
- step-goal-sheet.tsx
- ignoreDependencies
- keywords
- knip.json
- replaySoundEffect
- android
- plugins
- prepare.js
- nativewind-env.d.ts
- @commitlint/config-conventional
- useAppTheme
- NodeSQLiteStatement
- metro.config.js
- eslint.config.cjs
- build-android-release-single-arch.sh
- clean.js
- @react-navigation/native
- with-step-activity-permissions.js
- class-variance-authority
- clsx
- expo-build-properties
- expo-constants
- expo-dev-client
- expo-drizzle-studio-plugin
- expo-linking
- expo-splash-screen
- expo-sqlite
- expo-status-bar
- expo-system-ui
- @gorhom/bottom-sheet
- lucide-react-native
- nativewind
- expo
- react-native-css
- react-native-drum-picker
- react-native-gesture-handler
- react-native-mmkv
- react-native-safe-area-context
- react-native-screens
- react-native-worklets
- @react-navigation/bottom-tabs
- @sentry/react-native
- tailwind-merge
- victory-native
- zustand

## God Nodes (most connected - your core abstractions)

1. `react-native` - 142 edges
2. `DrizzleDb` - 108 edges
3. `cn()` - 102 edges
4. `Text` - 89 edges
5. `useDrizzle()` - 81 edges
6. `Icon()` - 73 edges
7. `Button()` - 62 edges
8. `Workout` - 52 edges
9. `expo-router` - 45 edges
10. `useLiveWithFallback()` - 41 edges

## Surprising Connections (you probably didn't know these)

- `plugins` --extends--> `expo-notifications` [EXTRACTED]
  app.json → package.json
- `plugins` --extends--> `expo-router` [EXTRACTED]
  app.json → package.json
- `ignoreDependencies` --extends--> `babel-plugin-inline-import` [EXTRACTED]
  knip.json → package.json
- `ignoreDependencies` --extends--> `babel-preset-expo` [EXTRACTED]
  knip.json → package.json
- `ignoreDependencies` --extends--> `expo-atlas` [EXTRACTED]
  knip.json → package.json

## Import Cycles

- None detected.

## Communities (97 total, 31 thin omitted)

### Community 0 - "use-steps-screen.ts"

Cohesion: 0.07
Nodes (64): StepCounter, HealthStepDay, NewHealthStepDay, StepsSection(), StepDayRow(), StepDayRowProps, StepsContent(), StepsSummaryCardsProps (+56 more)

### Community 1 - "workout.repository.ts"

Cohesion: 0.05
Nodes (65): ActiveWorkoutEditExercisesContentProps, HistoricalWorkoutEditScreen(), Exercise, Workout, WorkoutExercise, CustomExerciseDetailsUpdate, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow (+57 more)

### Community 2 - "ui/bottom-sheet.tsx"

Cohesion: 0.06
Nodes (51): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+43 more)

### Community 3 - "active-workout-content.tsx"

Cohesion: 0.05
Nodes (50): ExerciseDetailScreen(), formatUsageBreakdown(), WorkoutTemplateDetailLoaded(), ExerciseListRow(), ExerciseListRowProps, ExerciseRow(), ExerciseRowProps, ExerciseListItem (+42 more)

### Community 4 - "react-native"

Cohesion: 0.08
Nodes (41): react-native, Props, State, StyledScrollView, Badge(), BadgeProps, badgeTextVariants, BadgeVariant (+33 more)

### Community 5 - "useDrizzle"

Cohesion: 0.07
Nodes (48): EditExerciseScreen(), ExercisesScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), HistoricalWorkoutDraftScreen(), WorkoutDetailLoadedProps, useDrizzle(), buildAlphabetizedExerciseListItems() (+40 more)

### Community 6 - "icon.tsx"

Cohesion: 0.09
Nodes (37): AppIconProps, createStyledIcon(), getIconSize(), Icon(), IconTone, iconToneClassNames, NativeWindIconStyle, NativeWindStylableIcon (+29 more)

### Community 7 - "scripts"

Cohesion: 0.04
Nodes (46): engines, node, pnpm, lint-staged, **/\*.{md,json}, **/\*.{ts,tsx,js}, main, name (+38 more)

### Community 8 - "exercise.repository.ts"

Cohesion: 0.15
Nodes (26): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+18 more)

### Community 9 - "Button"

Cohesion: 0.16
Nodes (25): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutDetailScreen(), WorkoutTemplateDetailScreen(), BackButton() (+17 more)

### Community 10 - "cn"

Cohesion: 0.10
Nodes (28): OnboardingScreen(), weightUnitOptions, WorkoutDetailLoaded(), BackButtonProps, IconComponent, ExerciseProgressChart(), ThemeOptionCard(), ThemeOptionCardProps (+20 more)

### Community 11 - "chip.tsx"

Cohesion: 0.08
Nodes (33): StyledGestureScrollView, ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig (+25 more)

### Community 12 - "schema.ts"

Cohesion: 0.08
Nodes (39): databaseName, databaseOptions, ForeignKeysPragma, ForeignKeyViolation, schema, buildSetRows(), getExerciseRowsByName(), getStartedAt() (+31 more)

### Community 13 - "progress.repository.ts"

Cohesion: 0.13
Nodes (32): PersonalRecord, getExerciseUsageSummaryQuery(), buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId(), getLatestAchievedAt() (+24 more)

### Community 14 - "devDependencies"

Cohesion: 0.05
Nodes (39): @commitlint/cli, @dotenvx/dotenvx, drizzle-kit, eslint-config-expo, eslint-plugin-unused-imports, @faker-js/faker, husky, lint-staged (+31 more)

### Community 15 - "workout-template.repository.ts"

Cohesion: 0.11
Nodes (33): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, WorkoutTemplate, WorkoutTemplateExercise, WorkoutTemplateCardProps, UseHistoricalWorkoutStartOptions, useWorkoutStart(), activeWorkoutRoute (+25 more)

### Community 16 - "Set"

Cohesion: 0.13
Nodes (31): Set, SetValues, TrackingFieldDefinition, SetFormRowProps, SetForm(), SetFormProps, ActiveDurationPickerState, BaseRowView (+23 more)

### Community 17 - "set-form-row.tsx"

Cohesion: 0.08
Nodes (30): darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors, SetFormFieldSurface(), SetFormFieldSurfaceProps, SetFormFieldTone (+22 more)

### Community 18 - "snackbar.tsx"

Cohesion: 0.10
Nodes (28): expo-notifications, expo-notifications, dismissSnackbar(), notifySnackbarDismissed(), showSnackbar(), SnackbarHost(), SnackbarMessage, SnackbarOptions (+20 more)

### Community 19 - "workout-log-calendar.tsx"

Cohesion: 0.13
Nodes (29): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+21 more)

### Community 20 - "set-duration-picker-sheet.tsx"

Cohesion: 0.08
Nodes (24): WheelPicker, WheelPickerBase, WheelPickerComponent, minuteItems, RestTimerSettingSheet(), RestTimerSettingSheetContent, secondItems, minuteItems (+16 more)

### Community 21 - "exercise-picker-sheet.tsx"

Cohesion: 0.09
Nodes (21): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, Input, InputProps, NativeTextInputProps, SearchInputIcon(), ExerciseListDataItem (+13 more)

### Community 22 - "database-provider.tsx"

Cohesion: 0.09
Nodes (26): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+18 more)

### Community 23 - "DrizzleDb"

Cohesion: 0.09
Nodes (31): Index(), DrizzleDb, createTrackedSet(), ForeignKeyListRow, getHistoricalPersonalRecordRows(), getPersonalRecordSetIds(), insertHistoricalWorkout(), MigrationJournal (+23 more)

### Community 24 - "compilerOptions"

Cohesion: 0.07
Nodes (29): compilerOptions, declaration, declarationMap, esModuleInterop, inlineSources, jsx, lib, module (+21 more)

### Community 25 - "settings.repository.ts"

Cohesion: 0.12
Nodes (31): SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getHealthConnectStepsEnabled(), getRestTimerDuration(), getRestTimerPresets(), getRestTimerPresetsFromValue() (+23 more)

### Community 26 - "rest-timer.store.ts"

Cohesion: 0.14
Nodes (19): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerTrigger(), RestTimerWidget() (+11 more)

### Community 27 - "weight.utils.ts"

Cohesion: 0.20
Nodes (15): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatDisplaySetPosition() (+7 more)

### Community 28 - "dependencies"

Cohesion: 0.09
Nodes (23): drizzle-orm, expo-audio, @expo-google-fonts/inter, expo-haptics, dependencies, drizzle-orm, expo-audio, @expo-google-fonts/inter (+15 more)

### Community 29 - "tracking.domain.ts"

Cohesion: 0.13
Nodes (20): ExerciseTrackingStyleSelector(), TRACKING_TYPE_ROWS, assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), formatPersonalRecordValue(), getDurationMs(), isNonNegativeNumber() (+12 more)

### Community 30 - "app-theme-provider.tsx"

Cohesion: 0.21
Nodes (18): AppThemeContext, AppThemeContextValue, AppThemeProvider(), createNavigationTheme(), resolveAppColorScheme(), resolveColorScheme(), bootstrapThemeColorScheme(), getThemePreference() (+10 more)

### Community 31 - "TrackingType"

Cohesion: 0.18
Nodes (18): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseTrackingStyleSelectorProps (+10 more)

### Community 32 - "common-providers.tsx"

Cohesion: 0.12
Nodes (10): RootNavigator(), CommonProviders(), CommonProvidersProps, DatabaseProvider(), DrizzleStudio(), ScreenErrorBoundary, StepsSyncHost(), appFontAssets (+2 more)

### Community 33 - "styled/bottom-sheet.tsx"

Cohesion: 0.11
Nodes (18): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+10 more)

### Community 34 - "expo-step-counter/package.json"

Cohesion: 0.11
Nodes (17): author, bugs, url, dependencies, description, homepage, license, main (+9 more)

### Community 35 - "segmented-control.tsx"

Cohesion: 0.15
Nodes (10): SegmentedControl(), SegmentedControlOption, SegmentedControlProps, AboutInfoSection(), THEME_OPTIONS, ThemeSelectionSection(), WorkoutPreferencesSection(), LogHeader() (+2 more)

### Community 36 - "exercise-history-list.tsx"

Cohesion: 0.19
Nodes (13): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, ExerciseHistoryData, ExerciseHistoryEntry, ExerciseHistoryList(), ExerciseHistoryListProps, ExerciseHistoryWidgets() (+5 more)

### Community 37 - "expo"

Cohesion: 0.12
Nodes (15): reactCompiler, typedRoutes, expo, experiments, icon, ios, name, newArchEnabled (+7 more)

### Community 38 - "src/index.ts"

Cohesion: 0.13
Nodes (10): ExpoStepCounter, ExpoStepCounterEvents, ExpoStepCounterModule, NOOP_SUBSCRIPTION, normalizeStepCount(), normalizeStepGoal(), StepCounterApi, StepCounterChangeEvent (+2 more)

### Community 39 - "settings-provider.tsx"

Cohesion: 0.24
Nodes (11): SettingsContext, SettingsContextValue, RestTimerPreset, setHealthConnectStepsEnabled(), setRestTimerDuration(), setSetting(), setStepGoal(), setStepsNotificationEnabled() (+3 more)

### Community 40 - "use-active-workout-exercise-draft.ts"

Cohesion: 0.16
Nodes (17): ActiveWorkoutEditExercisesContent(), TemplateExerciseEditor(), DraftExerciseRow, SaveActiveWorkoutExerciseDraftResult, useActiveWorkoutExerciseDraft(), UseActiveWorkoutExerciseDraftParams, useReorderWorkoutExercises(), useSaveActiveWorkoutExerciseDraft() (+9 more)

### Community 41 - "include"

Cohesion: 0.14
Nodes (13): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/\*.ts, modules/expo-step-counter/package, nativewind-env.d.ts, **/_.ts, \*\*/_.tsx, compilerOptions (+5 more)

### Community 42 - "(tabs)/\_layout.tsx"

Cohesion: 0.23
Nodes (10): ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), triggerBottomTabNavigationHaptics(), triggerSegmentSelectionHaptics(), triggerSelectionHaptics() (+2 more)

### Community 44 - "useSettings"

Cohesion: 0.25
Nodes (11): useSettings(), getDurationDraft(), RestTimerIdleContent(), RestTimerIdleContentProps, RestTimerPresetEditorSheet(), RestTimerSheetContent, RestTimerSheetContentProps, RestTimerSheetProps (+3 more)

### Community 45 - "exercise-track-section.tsx"

Cohesion: 0.25
Nodes (10): ActiveWorkoutExerciseCardProps, ActiveWorkoutExerciseEditRowProps, ExerciseTrackSection(), ExerciseTrackTabProps, ProgressionSuggestion(), WorkoutExerciseWithSets, AddSetValues, getSetStorageValues() (+2 more)

### Community 46 - "devDependencies"

Cohesion: 0.17
Nodes (12): eslint-config-universe, devDependencies, eslint, eslint-config-universe, prettier, react-native, typescript, prettier (+4 more)

### Community 47 - "button.tsx"

Cohesion: 0.20
Nodes (10): StyledActivityIndicator, ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants, ButtonVariant, buttonVariantConfig (+2 more)

### Community 48 - "step-goal-sheet.tsx"

Cohesion: 0.31
Nodes (7): numberFormatter, StepGoalSheet(), StepGoalSheetContent, MAX_STEP_GOAL, MIN_STEP_GOAL, STEP_GOAL_PRESETS, isValidStepGoal()

### Community 49 - "ignoreDependencies"

Cohesion: 0.20
Nodes (10): babel-plugin-inline-import, babel-preset-expo, expo-atlas, expo-blur, ignoreDependencies, expo-blur, babel-plugin-inline-import, babel-preset-expo (+2 more)

### Community 50 - "keywords"

Cohesion: 0.20
Nodes (10): expo-step-counter, expo, react, keywords, peerDependencies, expo, react, react-native (+2 more)

### Community 51 - "knip.json"

Cohesion: 0.20
Nodes (9): ignore, ignoreBinaries, $schema, tags, babel.config.js, -lintignore, modules/expo-step-counter/build/\*\*, plugins/with-step-activity-permissions.js (+1 more)

### Community 53 - "replaySoundEffect"

Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 54 - "android"

Cohesion: 0.25
Nodes (8): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled, android

### Community 55 - "plugins"

Cohesion: 0.25
Nodes (8): plugins, expo-font, expo-font, react-native-health-connect, react-native-notify-kit, react-native-health-connect, react-native-notify-kit, ./plugins/with-step-activity-permissions

### Community 56 - "prepare.js"

Cohesion: 0.29
Nodes (6): fs, path, result, { spawnSyncWithAutoShell }, { spawnSync }, spawnSyncWithAutoShell()

### Community 57 - "nativewind-env.d.ts"

Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 58 - "@commitlint/config-conventional"

Cohesion: 0.29
Nodes (6): @commitlint/config-conventional, extends, rules, type-enum, @commitlint/config-conventional, always

### Community 59 - "useAppTheme"

Cohesion: 0.38
Nodes (5): unstable_settings, WorkoutLayout(), Switch(), SwitchProps, useAppTheme()

### Community 62 - "metro.config.js"

Cohesion: 0.50
Nodes (3): config, { getSentryExpoConfig }, { withNativewind }

### Community 63 - "eslint.config.cjs"

Cohesion: 0.50
Nodes (3): { defineConfig }, universe, universeWeb

### Community 64 - "build-android-release-single-arch.sh"

Cohesion: 0.67
Nodes (3): notify(), on_exit(), build-android-release-single-arch.sh script

### Community 66 - "@react-navigation/native"

Cohesion: 0.67
Nodes (3): @react-navigation/elements, @react-navigation/native, @react-navigation/native

## Knowledge Gaps

- **481 isolated node(s):** `always`, `name`, `slug`, `version`, `orientation` (+476 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `react-native` to `use-steps-screen.ts`, `ui/bottom-sheet.tsx`, `active-workout-content.tsx`, `icon.tsx`, `exercise.repository.ts`, `Button`, `cn`, `chip.tsx`, `Set`, `set-form-row.tsx`, `snackbar.tsx`, `workout-log-calendar.tsx`, `set-duration-picker-sheet.tsx`, `exercise-picker-sheet.tsx`, `database-provider.tsx`, `rest-timer.store.ts`, `weight.utils.ts`, `dependencies`, `tracking.domain.ts`, `app-theme-provider.tsx`, `TrackingType`, `styled/bottom-sheet.tsx`, `segmented-control.tsx`, `exercise-history-list.tsx`, `(tabs)/_layout.tsx`, `useSettings`, `exercise-track-section.tsx`, `devDependencies`, `button.tsx`, `step-goal-sheet.tsx`, `keywords`, `nativewind-env.d.ts`, `useAppTheme`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`, `snackbar.tsx`, `ignoreDependencies`, `keywords`, `plugins`, `@react-navigation/native`, `class-variance-authority`, `clsx`, `expo-build-properties`, `expo-constants`, `expo-dev-client`, `expo-drizzle-studio-plugin`, `expo-linking`, `expo-splash-screen`, `expo-sqlite`, `expo-status-bar`, `expo-system-ui`, `@gorhom/bottom-sheet`, `lucide-react-native`, `nativewind`, `expo`, `react-native-css`, `react-native-drum-picker`, `react-native-gesture-handler`, `react-native-mmkv`, `react-native-safe-area-context`, `react-native-screens`, `react-native-worklets`, `@react-navigation/bottom-tabs`, `@sentry/react-native`, `tailwind-merge`, `victory-native`, `zustand`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Why does `react-native` connect `dependencies` to `react-native`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **What connects `always`, `name`, `slug` to the rest of the system?**
  _481 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06923361717882266 - nodes in this community are weakly interconnected._
- **Should `workout.repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052943354313217325 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06277436347673397 - nodes in this community are weakly interconnected._
