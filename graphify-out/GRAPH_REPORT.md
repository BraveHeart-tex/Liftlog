# Graph Report - liftlog (2026-08-08)

## Corpus Check

- 335 files · ~120,666 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1863 nodes · 5347 edges · 137 communities (74 shown, 63 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `174f49fd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- use-steps-screen.ts
- workout.repository.ts
- ui/bottom-sheet.tsx
- active-workout-exercise-list.tsx
- text.tsx
- useDrizzle
- icon.tsx
- scripts
- exercise.repository.ts
- Icon
- cn
- exercise-metadata-form.tsx
- schema.ts
- use-exercise-detail.ts
- devDependencies
- workout-template.repository.ts
- Set
- set-form-row.tsx
- common-providers.tsx
- workout-log-calendar.tsx
- Components
- exercise-picker-sheet.tsx
- database-provider.tsx
- template-exercise-editor.tsx
- migrations.js
- settings.repository.ts
- rest-timer-sheet.tsx
- set-display.utils.ts
- dependencies
- tracking.domain.ts
- app-theme-provider.tsx
- TrackingType
- chip.tsx
- styled/bottom-sheet.tsx
- What You Must Do When Invoked
- workout-log-content.tsx
- exercise-history-list.tsx
- expo
- steps-content.tsx
- Exercise History Critique
- Workout
- include
- LiftLog onboarding critique
- NodeSQLiteDatabase
- Exercise Details critique
- resolveTrackingType
- eslint
- button.tsx
- Workout Home critique
- expo-blur
- exercise-list-row.tsx
- ignoreDependencies
- bottom-sheet-input.tsx
- replaySoundEffect
- overrides
- expo-font
- Product
- nativewind-env.d.ts
- .commitlintrc.json
- package.json
- Liftlog
- NodeSQLiteStatement
- metro.config.js
- exercise-picker-filters.tsx
- build-android-release-single-arch.sh
- graphify reference: extra exports and benchmark
- @react-navigation/elements
- graphify reference: query, path, explain
- Findings
- clsx
- expo-build-properties
- expo-constants
- expo-dev-client
- Exercise Set Form critique
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
- lint-staged
- react-native-screens
- react-native-worklets
- @react-navigation/bottom-tabs
- @sentry/react-native
- tailwind-merge
- victory-native
- zustand
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- styling.md
- ux-display.md
- AGENTS.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- database.md
- extraction-spec.md
- @commitlint/cli
- bottom-sheet.md
- data-access.md
- expo-router.md
- layout.md
- drizzle-orm
- eslint-plugin-unused-imports
- expo-audio
- @expo-google-fonts/inter
- expo-haptics
- expo-notifications
- @faker-js/faker
- lint-staged
- react
- react-native
- react-native-health-connect
- react-native-nitro-modules
- react-native-reanimated
- react-native-reorderable-list
- @shopify/flash-list
- @shopify/react-native-skia
- postcss
- tailwindcss
- @tailwindcss/postcss
- @types/node
- @types/react
- typescript
- @typescript-eslint/eslint-plugin

## God Nodes (most connected - your core abstractions)

1. `DrizzleDb` - 107 edges
2. `cn()` - 102 edges
3. `Text` - 89 edges
4. `useDrizzle()` - 81 edges
5. `Icon()` - 73 edges
6. `Button()` - 62 edges
7. `Workout` - 52 edges
8. `expo-router` - 43 edges
9. `useLiveWithFallback()` - 41 edges
10. `ExerciseListItem` - 37 edges

## Surprising Connections (you probably didn't know these)

- `ExercisePickerFilterOption` --references--> `IconComponent` [EXTRACTED]
  src/features/workouts/components/exercise-picker-filters.tsx → src/components/ui/icon.tsx
- `getHistoricalPersonalRecordRows()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts
- `getPersonalRecordSetIds()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts
- `insertHistoricalWorkout()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts
- `seedHistoricalExercises()` --references--> `DrizzleDb` [EXTRACTED]
  src/db/database.integration.test.ts → src/db/client.ts

## Import Cycles

- None detected.

## Communities (137 total, 63 thin omitted)

### Community 0 - "use-steps-screen.ts"

Cohesion: 0.13
Nodes (30): AndroidStepsSyncHost(), BACKGROUND_PERMISSION, getHealthConnectAvailability(), getStepPermissionState(), getTodayDateKeyFromTimestamp(), GrantedPermission, hasPermission(), HISTORY_PERMISSION (+22 more)

### Community 1 - "workout.repository.ts"

Cohesion: 0.10
Nodes (43): DrizzleDb, NewWorkout, getCompletedSetsForPersonalRecords(), rebuildPersonalRecordsForExerciseInTransaction(), rebuildPersonalRecordsForExercises(), rebuildPersonalRecordsForExercisesInTransaction(), useActiveWorkoutContent(), UseActiveWorkoutContentParams (+35 more)

### Community 2 - "ui/bottom-sheet.tsx"

Cohesion: 0.05
Nodes (61): StyledBottomSheetScrollView, BottomSheet(), BottomSheetChildren, BottomSheetComponentProps, BottomSheetContent(), BottomSheetDescription(), BottomSheetHeader(), BottomSheetRenderState (+53 more)

### Community 3 - "active-workout-exercise-list.tsx"

Cohesion: 0.21
Nodes (12): WorkoutTemplateDetailLoaded(), ActiveWorkoutExerciseEditList, ActiveWorkoutExerciseList(), ActiveWorkoutExerciseListProps, DisplayWorkoutExerciseRow, listEntering, listExiting, useActiveWorkoutExerciseList() (+4 more)

### Community 4 - "text.tsx"

Cohesion: 0.07
Nodes (39): BackButtonProps, Card(), CardContent(), CardProps, IconComponent, PulsatingDot(), SegmentedControl(), SegmentedControlOption (+31 more)

### Community 5 - "useDrizzle"

Cohesion: 0.05
Nodes (59): EditExerciseScreen(), Index(), ExercisesScreen(), ActiveWorkoutEditExercisesScreen(), ActiveWorkoutScreen(), HistoricalWorkoutDraftScreen(), HistoricalWorkoutEditScreen(), WorkoutDetailLoaded() (+51 more)

### Community 6 - "icon.tsx"

Cohesion: 0.08
Nodes (36): AppIconProps, createStyledIcon(), getIconSize(), IconTone, iconToneClassNames, NativeWindIconStyle, NativeWindStylableIcon, styledIconCache (+28 more)

### Community 7 - "scripts"

Cohesion: 0.11
Nodes (19): scripts, android, android:clean, android:device, android:release:single-arch, format, ios, knip (+11 more)

### Community 8 - "exercise.repository.ts"

Cohesion: 0.18
Nodes (21): NewExerciseScreen(), NewExercise, normalizeExerciseName(), archiveExercise(), createExercise(), deleteExercise(), exerciseListFields, ExerciseNameConflictError (+13 more)

### Community 9 - "Icon"

Cohesion: 0.13
Nodes (33): expo-router, WorkoutExerciseHistoryScreen(), ActiveWorkoutExerciseScreen(), HistoricalWorkoutExerciseScreen(), HistoricalWorkoutEditExerciseScreen(), WorkoutTemplateDetailScreen(), BackButton(), BackButtonVariant (+25 more)

### Community 10 - "cn"

Cohesion: 0.10
Nodes (31): OnboardingScreen(), weightUnitOptions, Badge(), BadgeProps, badgeTextVariants, BadgeVariant, badgeVariantConfig, BadgeVariants (+23 more)

### Community 11 - "exercise-metadata-form.tsx"

Cohesion: 0.15
Nodes (16): CATEGORY_OPTIONS, CategoryOption, ExerciseCategorySelector(), ExerciseCategorySelectorProps, ErrorTarget, ExerciseMetadataForm(), ExerciseMetadataFormProps, FocusableInput (+8 more)

### Community 12 - "schema.ts"

Cohesion: 0.08
Nodes (44): ForeignKeysPragma, ForeignKeyViolation, schema, createTrackedSet(), ForeignKeyListRow, getHistoricalPersonalRecordRows(), getPersonalRecordSetIds(), insertHistoricalWorkout() (+36 more)

### Community 13 - "use-exercise-detail.ts"

Cohesion: 0.14
Nodes (23): getExerciseUsageSummaryQuery(), ExercisePersonalRecordSummaryItem, ExerciseTopSetPerformance, buildPersonalRecordSummary(), buildProgressPoints(), buildTopSetPerformances(), CompletedHistoryEntry, getBestSetId() (+15 more)

### Community 14 - "devDependencies"

Cohesion: 0.07
Nodes (27): babel-plugin-inline-import, babel-preset-expo, @commitlint/config-conventional, @dotenvx/dotenvx, drizzle-kit, eslint-config-expo, expo-atlas, husky (+19 more)

### Community 15 - "workout-template.repository.ts"

Cohesion: 0.12
Nodes (33): WorkoutStartScreen(), WorkoutTemplateDetailLoadedProps, WorkoutTemplate, WorkoutTemplateExercise, WorkoutTemplateCardProps, useHistoricalWorkoutStart(), UseHistoricalWorkoutStartOptions, useWorkoutStart() (+25 more)

### Community 16 - "Set"

Cohesion: 0.15
Nodes (28): Set, SetValues, TrackingFieldDefinition, SetForm(), SetFormProps, ActiveDurationPickerState, BaseRowView, DraftRowState (+20 more)

### Community 17 - "set-form-row.tsx"

Cohesion: 0.07
Nodes (34): useSettings(), ActiveWorkoutExerciseEditRow(), ProgressionSuggestion(), darkFeedbackColors, SetFormEmptyState(), emptyStateEntering, emptyStateExiting, SetFormFieldColors (+26 more)

### Community 18 - "common-providers.tsx"

Cohesion: 0.07
Nodes (35): plugins, expo-font, expo-notifications, react-native-health-connect, CommonProviders(), CommonProvidersProps, DatabaseProvider(), ScreenErrorBoundary (+27 more)

### Community 19 - "workout-log-calendar.tsx"

Cohesion: 0.13
Nodes (29): AnimatedText, CalendarDayButton(), CalendarDayButtonProps, MonthCalendar, MonthCalendarProps, CALENDAR_COLUMNS, CALENDAR_ROWS, DEFAULT_CALENDAR_HEIGHT (+21 more)

### Community 20 - "Components"

Cohesion: 0.07
Nodes (27): Bottom Sheets, Buttons, Cards / Containers, Chips, Colors, Components, Design System: LiftLog, Do: (+19 more)

### Community 21 - "exercise-picker-sheet.tsx"

Cohesion: 0.10
Nodes (24): ExerciseRowProps, categoryLabelByValue, ExerciseListDataItem, ExerciseListRowItem, ExerciseListSectionHeaderItem, getExerciseCategoryLabel(), matchesExerciseSearch(), ExerciseListItem (+16 more)

### Community 22 - "database-provider.tsx"

Cohesion: 0.09
Nodes (27): DatabaseErrorBoundary, Props, State, DatabaseProviderProps, DrizzleContext, DrizzleProvider(), DrizzleProviderProps, migrateAsync() (+19 more)

### Community 23 - "template-exercise-editor.tsx"

Cohesion: 0.16
Nodes (19): NewTemplateExerciseListProps, TemplateExerciseEditor(), TemplateExerciseEditorProps, TemplateExerciseEditorRow, DraftExerciseRow, reconcileDraftRows(), SaveWorkoutTemplateExerciseDraftResult, useWorkoutTemplateExerciseDraft() (+11 more)

### Community 24 - "migrations.js"

Cohesion: 0.09
Nodes (13): `app_meta`, `exercises`, `personal_records`, `sets`, `workout_exercises`, `workout_template_exercises`, `workout_templates`, `workouts` (+5 more)

### Community 25 - "settings.repository.ts"

Cohesion: 0.06
Nodes (59): SettingsContext, SettingsContextValue, SettingsProvider(), addRestTimerPreset(), createRestTimerPreset(), deleteRestTimerPreset(), getHealthConnectStepsEnabled(), getRestTimerDuration() (+51 more)

### Community 26 - "rest-timer-sheet.tsx"

Cohesion: 0.16
Nodes (19): getSafeProgress(), RestTimerCountdown(), RestTimerCountdownProps, RestTimerPausedContent(), RestTimerRunningContent(), RestTimerSheet(), RestTimerSheetContent, RestTimerSheetContentProps (+11 more)

### Community 27 - "set-display.utils.ts"

Cohesion: 0.25
Nodes (12): areSameTrackingValues(), formatTrackingValue(), getSetValues(), WorkoutExerciseSummary(), DisplaySetGroup, groupHasPersonalRecord(), WorkoutSetSummary(), formatCompletedSets() (+4 more)

### Community 28 - "dependencies"

Cohesion: 0.18
Nodes (11): class-variance-authority, expo-drizzle-studio-plugin, expo-router, dependencies, class-variance-authority, expo-drizzle-studio-plugin, expo-router, react-native-safe-area-context (+3 more)

### Community 29 - "tracking.domain.ts"

Cohesion: 0.13
Nodes (21): ExerciseTrackingStyleSelectorProps, TRACKING_TYPE_ROWS, assertNonNegativeNumber(), assertPositiveNumber(), computeEstimated1RM(), getDurationMs(), getDurationSecondsFromMs(), getPersonalRecordSnapshot() (+13 more)

### Community 30 - "app-theme-provider.tsx"

Cohesion: 0.07
Nodes (39): RootNavigator(), ExercisesLayout(), AnimatedTabBar(), styles, TabLayout(), LogLayout(), unstable_settings, WorkoutLayout() (+31 more)

### Community 31 - "TrackingType"

Cohesion: 0.21
Nodes (15): axisDateFormatter, ChartPoint, ExerciseProgressChartBody(), ExerciseProgressChartBodyProps, formatAxisDate(), getChartDomain(), ExerciseProgressChartProps, ExerciseProgressPoint (+7 more)

### Community 32 - "chip.tsx"

Cohesion: 0.24
Nodes (10): ChipShape, ChipTextStyle, ChoiceChip(), choiceChipContainerVariants, ChoiceChipProps, choiceChipTextVariants, choiceChipVariantConfig, ChoiceChipVariants (+2 more)

### Community 33 - "styled/bottom-sheet.tsx"

Cohesion: 0.11
Nodes (17): BottomSheetFlatListClassNameProps, BottomSheetScrollViewClassNameProps, BottomSheetTextInputClassNameProps, BottomSheetTextInputColorBridge, BottomSheetTextInputColorBridgeProps, StyledBottomSheetBackdrop, StyledBottomSheetFlatList, StyledBottomSheetFlatListBase (+9 more)

### Community 34 - "What You Must Do When Invoked"

Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 35 - "workout-log-content.tsx"

Cohesion: 0.12
Nodes (19): FlatListClassNameProps, StyledFlatList, StyledFlatListBase, LogHeader(), LogHeaderProps, LogView, formatSelectedDate(), selectedDayEntering (+11 more)

### Community 36 - "exercise-history-list.tsx"

Cohesion: 0.15
Nodes (19): FlashListClassNameProps, StyledFlashList, StyledFlashListBase, formatNumber(), formatPersonalRecordValue(), formatScore(), ExerciseHistoryData, ExerciseHistoryEntry (+11 more)

### Community 37 - "expo"

Cohesion: 0.07
Nodes (27): backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, package, permissions, predictiveBackGestureEnabled (+19 more)

### Community 38 - "steps-content.tsx"

Cohesion: 0.16
Nodes (19): HealthStepDay, StepDayRow(), StepDayRowProps, StepsActionsSheet(), StepsContent(), StepsEmptyState(), StepsSummaryCards(), StepsSummaryCardsProps (+11 more)

### Community 39 - "Exercise History Critique"

Cohesion: 0.11
Nodes (18): AI-Slop Verdict, Design Health Score, Design Specificity Verdict, Exercise History Critique, Minor Observations, Narrow Implementation Sequence, Overall Impression, P1 — Session cards obstruct comparison and waste the viewport (+10 more)

### Community 40 - "Workout"

Cohesion: 0.07
Nodes (41): ActiveWorkoutEditExercisesContent(), ActiveWorkoutEditExercisesContentProps, Exercise, Workout, WorkoutExercise, CustomExerciseDetailsUpdate, ExerciseHistoryQueryOptions, ExerciseHistoryQueryRow (+33 more)

### Community 41 - "include"

Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/\*.ts, nativewind-env.d.ts, **/_.ts, \*\*/_.tsx, compilerOptions, paths (+3 more)

### Community 42 - "LiftLog onboarding critique"

Cohesion: 0.11
Nodes (18): AI-slop verdict, Design Health Score, Design Specificity Verdict, LiftLog onboarding critique, Narrow Implementation Sequence, Overall Impression, [P1] Large-text and compact-screen resilience is blocked, [P1] The CTA hides the first useful action (+10 more)

### Community 44 - "Exercise Details critique"

Cohesion: 0.11
Nodes (17): Design Health Score, Design Specificity Verdict, Exercise Details critique, Minor Observations, Narrow Implementation Sequence, Overall Impression, [P1] Android metadata is too fragile, [P1] Current performance has no primary tier (+9 more)

### Community 45 - "resolveTrackingType"

Cohesion: 0.18
Nodes (16): resolveTrackingType(), ActiveWorkoutExerciseCard(), ActiveWorkoutExerciseCardProps, ActiveWorkoutExerciseEditListProps, ActiveWorkoutExerciseEditRowProps, ExerciseTrackSection(), ExerciseTrackTabProps, WorkoutExerciseWithSets (+8 more)

### Community 47 - "button.tsx"

Cohesion: 0.13
Nodes (13): Props, State, StyledActivityIndicator, ButtonProps, ButtonSize, buttonSpinnerVariants, buttonTextStyle, buttonTextVariants (+5 more)

### Community 48 - "Workout Home critique"

Cohesion: 0.12
Nodes (15): Design Health Score, Design specificity, Findings, Overall verdict, P2 — Active summary consumes too much of the viewport, P2 — Blank start and template start are not framed as two workout-start paths, P2 — Recent workout cards are weakly distinguishable, P2 — Section-header actions are too small for gym-time interaction (+7 more)

### Community 50 - "exercise-list-row.tsx"

Cohesion: 0.22
Nodes (12): ExerciseDetailScreen(), formatUsageBreakdown(), ExerciseListRow(), ExerciseListRowProps, ExerciseTrackingStyleSelector(), formatMuscleList(), getPrimaryMuscleLabel(), ActiveWorkoutStats() (+4 more)

### Community 51 - "ignoreDependencies"

Cohesion: 0.13
Nodes (14): ignore, ignoreBinaries, ignoreDependencies, $schema, tags, babel.config.js, babel-plugin-inline-import, babel-preset-expo (+6 more)

### Community 52 - "bottom-sheet-input.tsx"

Cohesion: 0.16
Nodes (11): StyledBottomSheetTextInput, BottomSheetInput, BottomSheetInputProps, BottomSheetTextInputRef, NativeTextInputProps, Input, InputProps, NativeTextInputProps (+3 more)

### Community 53 - "replaySoundEffect"

Cohesion: 0.33
Nodes (5): StopwatchContent(), playersWithReplayInFlight, ReplayableSoundEffectPlayer, replaySoundEffect(), ReplaySoundEffectOptions

### Community 54 - "overrides"

Cohesion: 0.15
Nodes (13): @babel/core@7.29.0, esbuild@0.18.20, esbuild@0.27.7, js-yaml@3.14.2, js-yaml@4.1.1, lightningcss, postcss@8.4.49, tar@7.5.13 (+5 more)

### Community 56 - "Product"

Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 57 - "nativewind-env.d.ts"

Cohesion: 0.25
Nodes (7): ActivityIndicatorProps, BottomSheetDefaultBackdropProps, FlatListProps, @gorhom/bottom-sheet, react-native, ScrollViewProps, TextInputProps

### Community 58 - ".commitlintrc.json"

Cohesion: 0.33
Nodes (5): extends, rules, type-enum, always, @commitlint/config-conventional

### Community 59 - "package.json"

Cohesion: 0.20
Nodes (9): engines, node, pnpm, main, name, packageManager, pnpm, private (+1 more)

### Community 60 - "Liftlog"

Cohesion: 0.20
Nodes (9): Database, Features, Getting Started, Liftlog, Project Structure, Requirements, Screenshots, Scripts (+1 more)

### Community 62 - "metro.config.js"

Cohesion: 0.50
Nodes (3): config, { getSentryExpoConfig }, { withNativewind }

### Community 63 - "exercise-picker-filters.tsx"

Cohesion: 0.22
Nodes (8): StyledGestureScrollView, StyledScrollView, CATEGORY_OPTIONS, CategoryOption, ExercisePickerFilter, ExercisePickerFilterOption, ExercisePickerFilters(), ExercisePickerFiltersProps

### Community 64 - "build-android-release-single-arch.sh"

Cohesion: 0.67
Nodes (3): notify(), on_exit(), build-android-release-single-arch.sh script

### Community 65 - "graphify reference: extra exports and benchmark"

Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 67 - "graphify reference: query, path, explain"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 68 - "Findings"

Cohesion: 0.33
Nodes (5): Findings, Overall implementation verdict, P1 — Management Mode removals bypass Cancel, P1 — Terminal workout transitions leave the rest timer alive, P2 — Management Mode hides a still-running rest timer

### Community 73 - "Exercise Set Form critique"

Cohesion: 0.33
Nodes (5): Exercise Set Form critique, Overall verdict, Stylistic preference, Usability issues, What is already working

### Community 87 - "lint-staged"

Cohesion: 0.40
Nodes (5): lint-staged, **/\*.{md,json}, **/\*.{ts,tsx,js}, pnpm exec eslint --fix, pnpm exec prettier --write

### Community 99 - "graphify reference: add a URL and watch a folder"

Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 100 - "graphify reference: commit hook and native CLAUDE.md integration"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 101 - "graphify reference: incremental update and cluster-only"

Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 102 - "styling.md"

Cohesion: 0.50
Nodes (3): NativeWind, Styling, Third-Party Components

### Community 103 - "ux-display.md"

Cohesion: 0.50
Nodes (3): Audio Feedback, Data Display, Workout UX

## Knowledge Gaps

- **602 isolated node(s):** `@commitlint/config-conventional`, `always`, `name`, `slug`, `version` (+597 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `Icon` to `use-steps-screen.ts`, `workout.repository.ts`, `ui/bottom-sheet.tsx`, `workout-log-content.tsx`, `useDrizzle`, `icon.tsx`, `exercise.repository.ts`, `Workout`, `cn`, `resolveTrackingType`, `workout-template.repository.ts`, `common-providers.tsx`, `app-theme-provider.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `Text` connect `text.tsx` to `ui/bottom-sheet.tsx`, `useDrizzle`, `icon.tsx`, `exercise.repository.ts`, `Icon`, `cn`, `exercise-metadata-form.tsx`, `set-form-row.tsx`, `common-providers.tsx`, `workout-log-calendar.tsx`, `exercise-picker-sheet.tsx`, `template-exercise-editor.tsx`, `settings.repository.ts`, `rest-timer-sheet.tsx`, `set-display.utils.ts`, `tracking.domain.ts`, `app-theme-provider.tsx`, `chip.tsx`, `workout-log-content.tsx`, `exercise-history-list.tsx`, `steps-content.tsx`, `button.tsx`, `exercise-list-row.tsx`, `bottom-sheet-input.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `ui/bottom-sheet.tsx`, `active-workout-exercise-list.tsx`, `text.tsx`, `useDrizzle`, `icon.tsx`, `Icon`, `set-form-row.tsx`, `workout-log-calendar.tsx`, `settings.repository.ts`, `rest-timer-sheet.tsx`, `set-display.utils.ts`, `tracking.domain.ts`, `app-theme-provider.tsx`, `TrackingType`, `chip.tsx`, `exercise-history-list.tsx`, `steps-content.tsx`, `resolveTrackingType`, `button.tsx`, `exercise-list-row.tsx`, `bottom-sheet-input.tsx`, `replaySoundEffect`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `@commitlint/config-conventional`, `always`, `name` to the rest of the system?**
  _602 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `use-steps-screen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13368983957219252 - nodes in this community are weakly interconnected._
- **Should `workout.repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10195035460992907 - nodes in this community are weakly interconnected._
- **Should `ui/bottom-sheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04968354430379747 - nodes in this community are weakly interconnected._
