import {
  exercises,
  workoutExercises,
  workouts,
  workoutTemplateExercises,
  workoutTemplates
} from '@/src/db/schema';
import {
  createExercise,
  ExerciseNameConflictError,
  getExerciseUsageExistsQuery,
  hasExerciseNameConflict,
  removeCustomExercise,
  updateCustomExerciseDetails,
  updateCustomExerciseName
} from '@/src/features/exercises/exercise.repository';
import {
  ActiveWorkoutExerciseDraftConflictError,
  saveActiveWorkoutExerciseDraft
} from '@/src/features/workouts/active/active.repository';
import {
  saveWorkoutTemplateExerciseDraft,
  WorkoutTemplateExerciseDraftConflictError
} from '@/src/features/workouts/templates/workout-template.repository';
import { eq } from 'drizzle-orm';
import assert from 'node:assert/strict';
import type { SQLInputValue } from 'node:sqlite';
import {
  closeTestDatabases,
  createMigratedTestDatabase,
  rejectPersonalRecordRebuilds
} from '@/tests/support/db';
import {
  createTrackedSet,
  seedTrackedExercise
} from '@/tests/support/factories';

afterEach(closeTestDatabases);

describe('exercise usage query checks workout and template references together', () => {
  const cases = [
    {
      name: 'no usage',
      workoutUsageCount: 0,
      templateUsageCount: 0,
      isUsed: 0
    },
    {
      name: 'workout-only usage',
      workoutUsageCount: 2,
      templateUsageCount: 0,
      isUsed: 1
    },
    {
      name: 'template-only usage',
      workoutUsageCount: 0,
      templateUsageCount: 2,
      isUsed: 1
    },
    {
      name: 'usage in both tables',
      workoutUsageCount: 2,
      templateUsageCount: 3,
      isUsed: 1
    }
  ];

  for (const testCase of cases) {
    test(testCase.name, async () => {
      const { db, nodeClient } = await createMigratedTestDatabase();

      db.insert(exercises)
        .values({
          id: 'usage-exercise',
          name: 'Usage exercise',
          normalizedName: 'usage exercise',
          equipment: 'other'
        })
        .run();
      db.insert(workouts)
        .values({
          id: 'usage-workout',
          name: 'Usage workout',
          status: 'completed',
          startedAt: 1,
          dateKey: '1970-01-01'
        })
        .run();
      db.insert(workoutTemplates)
        .values({
          id: 'usage-template',
          name: 'Usage template',
          createdAt: 1,
          updatedAt: 1
        })
        .run();

      if (testCase.workoutUsageCount > 0) {
        db.insert(workoutExercises)
          .values(
            Array.from({ length: testCase.workoutUsageCount }, (_, index) => ({
              id: `workout-usage-${index}`,
              workoutId: 'usage-workout',
              exerciseId: 'usage-exercise',
              order: index
            }))
          )
          .run();
      }

      if (testCase.templateUsageCount > 0) {
        db.insert(workoutTemplateExercises)
          .values(
            Array.from({ length: testCase.templateUsageCount }, (_, index) => ({
              id: `template-usage-${index}`,
              templateId: 'usage-template',
              exerciseId: 'usage-exercise',
              order: index
            }))
          )
          .run();
      }

      const query = getExerciseUsageExistsQuery(db, 'usage-exercise');

      nodeClient.resetPreparedStatementCount();
      assert.deepEqual(query.get(), { isUsed: testCase.isUsed });
      assert.equal(nodeClient.getPreparedStatementCount(), 1);

      const generatedQuery = query.toSQL();
      const queryPlan = nodeClient.getAllSync<{ detail: string }>(
        `EXPLAIN QUERY PLAN ${generatedQuery.sql}`,
        generatedQuery.params as SQLInputValue[]
      );
      const queryPlanDetails = queryPlan.map(row => row.detail).join('\n');

      assert.match(
        queryPlanDetails,
        /workout_exercises_exercise_id_workout_id_idx/
      );
      assert.match(
        queryPlanDetails,
        /workout_template_exercises_exercise_id_template_id_idx/
      );
    });
  }
});

test('custom exercise updates use reduced statement paths', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  db.insert(exercises)
    .values([
      {
        id: 'custom-exercise',
        name: 'Custom exercise',
        normalizedName: 'custom exercise',
        equipment: 'other',
        trackingType: 'reps',
        isCustom: 1
      },
      {
        id: 'built-in-exercise',
        name: 'Built-in exercise',
        normalizedName: 'built-in exercise',
        equipment: 'other',
        trackingType: 'reps'
      }
    ])
    .run();

  nodeClient.resetPreparedStatementCount();
  assert.equal(
    updateCustomExerciseName(db, {
      id: 'custom-exercise',
      name: 'Renamed'
    })?.name,
    'Renamed'
  );
  assert.equal(nodeClient.getPreparedStatementCount(), 1);

  nodeClient.resetPreparedStatementCount();
  assert.equal(
    updateCustomExerciseName(db, {
      id: 'built-in-exercise',
      name: 'Blocked'
    }),
    undefined
  );
  assert.equal(nodeClient.getPreparedStatementCount(), 1);

  nodeClient.resetPreparedStatementCount();
  assert.equal(
    updateCustomExerciseDetails(db, 'custom-exercise', {
      equipment: 'arms',
      trackingType: 'reps',
      primaryMuscles: ['biceps'],
      secondaryMuscles: []
    })?.equipment,
    'arms'
  );
  assert.equal(nodeClient.getPreparedStatementCount(), 2);

  nodeClient.resetPreparedStatementCount();
  assert.equal(
    updateCustomExerciseDetails(db, 'custom-exercise', {
      equipment: 'cardio',
      trackingType: 'duration',
      primaryMuscles: [],
      secondaryMuscles: []
    })?.trackingType,
    'duration'
  );
  assert.equal(nodeClient.getPreparedStatementCount(), 4);
});

test('exercise name writes enforce and translate active normalized conflicts', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  const created = createExercise(db, {
    id: 'unicode-name',
    name: ' ÜBUNG ',
    equipment: 'other'
  });

  assert.equal(created.normalizedName, 'übung');
  assert.equal(hasExerciseNameConflict(db, undefined, 'übung'), true);
  assert.equal(hasExerciseNameConflict(db, created.id, '  ÜBUNG  '), false);
  assert.throws(
    () =>
      createExercise(db, {
        id: 'duplicate-name',
        name: 'übung',
        equipment: 'other'
      }),
    ExerciseNameConflictError
  );
  assert.throws(
    () =>
      nodeClient.execSync(`
        INSERT INTO exercises (id, name, equipment, created_at)
        VALUES ('missing-normalized-name', 'Missing', 'other', 1);
      `),
    /NOT NULL constraint failed: exercises.normalized_name/
  );

  createExercise(db, {
    id: 'rename-target',
    name: 'Different',
    equipment: 'other'
  });
  assert.throws(
    () =>
      updateCustomExerciseName(db, {
        id: 'rename-target',
        name: 'Übung'
      }),
    ExerciseNameConflictError
  );
  assert.doesNotThrow(() =>
    db
      .insert(exercises)
      .values({
        id: 'archived-name',
        name: 'übung',
        normalizedName: 'übung',
        equipment: 'other',
        isArchived: 1
      })
      .run()
  );
});

test('staged exercise saves scope name checks to staged names', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  db.insert(exercises)
    .values(
      Array.from({ length: 1_000 }, (_, index) => ({
        id: `catalog-exercise-${index}`,
        name: `Catalog exercise ${index}`,
        normalizedName: `catalog exercise ${index}`,
        equipment: 'other'
      }))
    )
    .run();
  db.insert(workouts)
    .values([
      {
        id: 'active-workout',
        name: 'Active',
        status: 'in_progress',
        startedAt: 1,
        dateKey: '1970-01-01'
      },
      {
        id: 'conflicting-active-workout',
        name: 'Conflicting active',
        status: 'in_progress',
        startedAt: 1,
        dateKey: '1970-01-01'
      }
    ])
    .run();
  db.insert(workoutTemplates)
    .values([
      {
        id: 'template',
        name: 'Template',
        createdAt: 1,
        updatedAt: 1
      },
      {
        id: 'conflicting-template',
        name: 'Conflicting template',
        createdAt: 1,
        updatedAt: 1
      }
    ])
    .run();
  const stagedExercise = (id: string, name: string) => ({
    id,
    name,
    normalizedName: 'stale',
    equipment: 'other',
    trackingType: 'weight_reps' as const,
    primaryMuscles: '[]',
    secondaryMuscles: '[]',
    isCustom: 1,
    isArchived: 0,
    createdAt: 1
  });
  const stopRecordingActiveNameQueries = () =>
    nodeClient
      .stopRecordingPreparedStatements()
      .filter(
        statement =>
          statement.source.includes('from "exercises"') &&
          statement.source.includes('"is_archived" = ?')
      );
  const assertScopedNameQuery = (normalizedNames: string[]) => {
    const activeNameQueries = stopRecordingActiveNameQueries();

    assert.equal(activeNameQueries.length, 1);
    assert.match(activeNameQueries[0].source, /"normalized_name" in \(/);
    assert.deepEqual(
      activeNameQueries[0].params.filter(
        (param): param is string => typeof param === 'string'
      ),
      normalizedNames
    );
  };

  const activeStagedExercises = [
    stagedExercise('active-staged-1', ' New active exercise 1 '),
    stagedExercise('active-staged-2', 'New active exercise 2')
  ];

  nodeClient.startRecordingPreparedStatements();
  saveActiveWorkoutExerciseDraft(db, {
    workoutId: 'active-workout',
    rows: activeStagedExercises.map((exercise, index) => ({
      id: `active-workout-exercise-${index}`,
      exerciseId: exercise.id,
      supersetId: null
    })),
    baselineRows: [],
    stagedCustomExercises: activeStagedExercises
  });
  assertScopedNameQuery(['new active exercise 1', 'new active exercise 2']);

  const templateStagedExercises = [
    stagedExercise('template-staged-1', ' New template exercise 1 '),
    stagedExercise('template-staged-2', 'New template exercise 2')
  ];

  nodeClient.startRecordingPreparedStatements();
  saveWorkoutTemplateExerciseDraft(db, {
    templateId: 'template',
    rows: templateStagedExercises.map((exercise, index) => ({
      id: `template-exercise-${index}`,
      exerciseId: exercise.id,
      supersetId: null
    })),
    baselineRows: [],
    stagedCustomExercises: templateStagedExercises
  });
  assertScopedNameQuery(['new template exercise 1', 'new template exercise 2']);

  const duplicateActiveExercises = [
    stagedExercise('active-duplicate-1', 'Duplicate active exercise'),
    stagedExercise('active-duplicate-2', ' DUPLICATE ACTIVE EXERCISE ')
  ];

  nodeClient.startRecordingPreparedStatements();
  assert.throws(
    () =>
      saveActiveWorkoutExerciseDraft(db, {
        workoutId: 'conflicting-active-workout',
        rows: duplicateActiveExercises.map((exercise, index) => ({
          id: `duplicate-active-workout-exercise-${index}`,
          exerciseId: exercise.id,
          supersetId: null
        })),
        baselineRows: [],
        stagedCustomExercises: duplicateActiveExercises
      }),
    ActiveWorkoutExerciseDraftConflictError
  );
  assert.equal(stopRecordingActiveNameQueries().length, 0);

  const duplicateTemplateExercises = [
    stagedExercise('template-duplicate-1', 'Duplicate template exercise'),
    stagedExercise('template-duplicate-2', ' DUPLICATE TEMPLATE EXERCISE ')
  ];

  nodeClient.startRecordingPreparedStatements();
  assert.throws(
    () =>
      saveWorkoutTemplateExerciseDraft(db, {
        templateId: 'conflicting-template',
        rows: duplicateTemplateExercises.map((exercise, index) => ({
          id: `duplicate-template-exercise-${index}`,
          exerciseId: exercise.id,
          supersetId: null
        })),
        baselineRows: [],
        stagedCustomExercises: duplicateTemplateExercises
      }),
    WorkoutTemplateExerciseDraftConflictError
  );
  assert.equal(stopRecordingActiveNameQueries().length, 0);

  const conflictingActiveExercises = [
    stagedExercise('active-conflict-1', ' CATALOG EXERCISE 777 '),
    stagedExercise('active-conflict-2', 'Unpersisted active exercise')
  ];

  nodeClient.startRecordingPreparedStatements();
  assert.throws(
    () =>
      saveActiveWorkoutExerciseDraft(db, {
        workoutId: 'conflicting-active-workout',
        rows: conflictingActiveExercises.map((exercise, index) => ({
          id: `conflicting-workout-exercise-${index}`,
          exerciseId: exercise.id,
          supersetId: null
        })),
        baselineRows: [],
        stagedCustomExercises: conflictingActiveExercises
      }),
    ActiveWorkoutExerciseDraftConflictError
  );
  assertScopedNameQuery([
    'catalog exercise 777',
    'unpersisted active exercise'
  ]);

  const conflictingTemplateExercises = [
    stagedExercise('template-conflict-1', ' CATALOG EXERCISE 888 '),
    stagedExercise('template-conflict-2', 'Unpersisted template exercise')
  ];

  nodeClient.startRecordingPreparedStatements();
  assert.throws(
    () =>
      saveWorkoutTemplateExerciseDraft(db, {
        templateId: 'conflicting-template',
        rows: conflictingTemplateExercises.map((exercise, index) => ({
          id: `conflicting-template-exercise-${index}`,
          exerciseId: exercise.id,
          supersetId: null
        })),
        baselineRows: [],
        stagedCustomExercises: conflictingTemplateExercises
      }),
    WorkoutTemplateExerciseDraftConflictError
  );
  assertScopedNameQuery([
    'catalog exercise 888',
    'unpersisted template exercise'
  ]);
});

test('tracking-type update rolls back when personal-record rebuild fails', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  seedTrackedExercise(db);
  db.update(exercises)
    .set({ isCustom: 1 })
    .where(eq(exercises.id, 'exercise-1'))
    .run();
  createTrackedSet(db, 'set-1', 10, 0);
  rejectPersonalRecordRebuilds(nodeClient);

  assert.throws(
    () =>
      updateCustomExerciseDetails(db, 'exercise-1', {
        equipment: 'cardio',
        trackingType: 'duration',
        primaryMuscles: [],
        secondaryMuscles: []
      }),
    /unexpected personal record rebuild/
  );

  assert.deepEqual(
    db
      .select({
        equipment: exercises.equipment,
        trackingType: exercises.trackingType
      })
      .from(exercises)
      .where(eq(exercises.id, 'exercise-1'))
      .get(),
    { equipment: 'chest', trackingType: 'reps' }
  );
});

test('custom exercise removal preserves results with three-statement paths', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  db.insert(exercises)
    .values([
      {
        id: 'unused-custom',
        name: 'Unused custom',
        normalizedName: 'unused custom',
        equipment: 'other',
        isCustom: 1
      },
      {
        id: 'referenced-custom',
        name: 'Referenced custom',
        normalizedName: 'referenced custom',
        equipment: 'other',
        isCustom: 1
      },
      {
        id: 'built-in',
        name: 'Built-in',
        normalizedName: 'built-in',
        equipment: 'other'
      }
    ])
    .run();
  db.insert(workouts)
    .values({
      id: 'removal-workout',
      name: 'Removal workout',
      status: 'completed',
      startedAt: 1,
      dateKey: '1970-01-01'
    })
    .run();
  db.insert(workoutExercises)
    .values({
      id: 'removal-workout-exercise',
      workoutId: 'removal-workout',
      exerciseId: 'referenced-custom',
      order: 0
    })
    .run();

  nodeClient.resetPreparedStatementCount();
  assert.equal(removeCustomExercise(db, 'missing'), 'not_found');
  assert.equal(nodeClient.getPreparedStatementCount(), 1);

  nodeClient.resetPreparedStatementCount();
  assert.equal(removeCustomExercise(db, 'built-in'), 'not_custom');
  assert.equal(nodeClient.getPreparedStatementCount(), 1);

  nodeClient.resetPreparedStatementCount();
  assert.equal(removeCustomExercise(db, 'referenced-custom'), 'archived');
  assert.equal(nodeClient.getPreparedStatementCount(), 3);

  nodeClient.resetPreparedStatementCount();
  assert.equal(removeCustomExercise(db, 'unused-custom'), 'deleted');
  assert.equal(nodeClient.getPreparedStatementCount(), 3);
});

test('custom exercise removal archives after a defensive delete fallback', async () => {
  const { db, nodeClient } = await createMigratedTestDatabase();

  db.insert(exercises)
    .values({
      id: 'fallback-custom',
      name: 'Fallback custom',
      normalizedName: 'fallback custom',
      equipment: 'other',
      isCustom: 1
    })
    .run();
  nodeClient.execSync(`
    CREATE TRIGGER reject_custom_exercise_delete
    BEFORE DELETE ON exercises
    WHEN OLD.id = 'fallback-custom'
    BEGIN
      SELECT RAISE(ABORT, 'FOREIGN KEY constraint failed');
    END;
  `);

  const originalConsoleError = console.error;
  console.error = () => undefined;
  nodeClient.resetPreparedStatementCount();

  try {
    assert.equal(removeCustomExercise(db, 'fallback-custom'), 'archived');
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(nodeClient.getPreparedStatementCount(), 4);
  assert.equal(
    db
      .select({ isArchived: exercises.isArchived })
      .from(exercises)
      .where(eq(exercises.id, 'fallback-custom'))
      .get()?.isArchived,
    1
  );
});
