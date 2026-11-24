import type { Set } from '@/src/db/schema';
import { getProgressionSuggestion } from '@/src/features/workouts/set-entry/components/progression-suggestion.utils';
import { setRow, workoutRow } from '@/tests/support/factories';

const WEIGHT_STEP_KG = 2.5;

function entry(id: string, sets: Partial<Set>[]) {
  return {
    workout: workoutRow({ id }),
    sets: sets.map((set, index) =>
      setRow({ id: `${id}-set-${index}`, order: index, ...set })
    )
  };
}

describe('getProgressionSuggestion', () => {
  test('returns nothing without history', () => {
    expect(getProgressionSuggestion([], WEIGHT_STEP_KG)).toBeNull();
  });

  test('ignores workouts without completed sets', () => {
    expect(
      getProgressionSuggestion(
        [entry('workout-1', [{ status: 'pending', completedAt: null }])],
        WEIGHT_STEP_KG
      )
    ).toBeNull();
  });

  test('increases weight after repeated sets of at least five reps', () => {
    expect(
      getProgressionSuggestion(
        [
          entry('workout-1', [
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 },
            { weightKg: 60, reps: 8 }
          ])
        ],
        WEIGHT_STEP_KG
      )
    ).toEqual({
      kind: 'increase-weight',
      estimated1rmKg: 76,
      estimated1rmDeltaKg: null,
      lastFourDeltaKg: null,
      previousWeightKg: 60,
      previousReps: 8,
      suggestedWeightKg: 62.5,
      suggestedReps: 8,
      repeatedSetCount: 3
    });
  });

  test.each<[string, Partial<Set>[]]>([
    ['a single set', [{ weightKg: 60, reps: 8 }]],
    [
      'sets with fewer than five reps',
      [
        { weightKg: 100, reps: 4 },
        { weightKg: 100, reps: 4 }
      ]
    ],
    [
      'sets that differ',
      [
        { weightKg: 60, reps: 8 },
        { weightKg: 60, reps: 7 }
      ]
    ]
  ])('repeats the last working set after %s', (_name, sets) => {
    const suggestion = getProgressionSuggestion(
      [entry('workout-1', sets)],
      WEIGHT_STEP_KG
    );
    const lastSet = sets[sets.length - 1];

    expect(suggestion).toMatchObject({
      kind: 'repeat-last',
      suggestedWeightKg: lastSet.weightKg,
      suggestedReps: lastSet.reps
    });
  });

  test('follows only completed sets of the latest workout', () => {
    const suggestion = getProgressionSuggestion(
      [
        entry('workout-1', [
          { weightKg: 60, reps: 8 },
          { weightKg: 60, reps: 8 },
          { weightKg: 70, reps: 3, status: 'pending', completedAt: null }
        ])
      ],
      WEIGHT_STEP_KG
    );

    expect(suggestion).toMatchObject({
      kind: 'increase-weight',
      previousWeightKg: 60,
      repeatedSetCount: 2
    });
  });

  test('compares the estimated 1RM against earlier workouts', () => {
    const suggestion = getProgressionSuggestion(
      [
        entry('workout-4', [{ weightKg: 90, reps: 5 }]),
        entry('workout-3', [{ weightKg: 85, reps: 5 }]),
        entry('workout-2', [{ weightKg: 80, reps: 5 }]),
        entry('workout-1', [{ weightKg: 75, reps: 5 }]),
        entry('workout-0', [{ weightKg: 30, reps: 5 }])
      ],
      WEIGHT_STEP_KG
    );

    expect(suggestion?.estimated1rmKg).toBe(105);
    expect(suggestion?.estimated1rmDeltaKg).toBeCloseTo(105 - 99.17, 2);
    // Only the last four workouts count, so workout-0 is ignored.
    expect(suggestion?.lastFourDeltaKg).toBeCloseTo(105 - 87.5, 2);
  });

  // Suggestions follow weight and reps; other tracking types have no weight.
  test.each<[string, Partial<Set>]>([
    ['reps', { weightKg: null, reps: 15 }],
    ['duration', { weightKg: null, reps: null, durationMs: 60_000 }],
    [
      'distance_time',
      { weightKg: null, reps: null, distanceMeters: 1000, durationMs: 250_000 }
    ],
    ['weight_time', { weightKg: 20, reps: null, durationMs: 40_000 }]
  ])('returns nothing for %s sets', (_name, set) => {
    expect(
      getProgressionSuggestion([entry('workout-1', [set, set])], WEIGHT_STEP_KG)
    ).toBeNull();
  });
});
