import { exercises, workouts, workoutTemplates } from '@/src/db/schema';
import {
  createHistoricalWorkoutDraft,
  createWorkout,
  repeatWorkout
} from '@/src/features/workouts/shared/workout.repository';
import { createWorkoutFromTemplate } from '@/src/features/workouts/templates/workout-template.repository';
import {
  applicationUpdateExclusion,
  WorkoutCreationBlockedError
} from '@/src/features/app-updates/update-exclusion';
import assert from 'node:assert/strict';
import {
  closeTestDatabases,
  createMigratedTestDatabase
} from '@/tests/support/db';

afterEach(closeTestDatabases);

test('active workout creation paths honor update exclusion', async () => {
  const { db } = await createMigratedTestDatabase();

  try {
    db.insert(exercises)
      .values({
        id: 'guard-exercise',
        name: 'Guard Exercise',
        normalizedName: 'guard exercise',
        equipment: 'other',
        trackingType: 'reps'
      })
      .run();
    db.insert(workoutTemplates)
      .values({ id: 'guard-template', name: 'Guard Template' })
      .run();

    applicationUpdateExclusion.hydrate(true);

    assert.throws(
      () =>
        createWorkout(db, {
          name: 'Blank',
          status: 'in_progress',
          startedAt: 1
        }),
      WorkoutCreationBlockedError
    );
    assert.throws(
      () => createWorkoutFromTemplate(db, { templateId: 'guard-template' }),
      WorkoutCreationBlockedError
    );
    assert.throws(
      () =>
        repeatWorkout(db, {
          sourceWorkout: { name: 'Repeat' },
          sourceWorkoutExercises: []
        }),
      WorkoutCreationBlockedError
    );

    assert.doesNotThrow(() => createHistoricalWorkoutDraft(db, '2026-09-07'));
    assert.equal(db.select().from(workouts).all().length, 1);
  } finally {
    applicationUpdateExclusion.hydrate(false);
  }
});
