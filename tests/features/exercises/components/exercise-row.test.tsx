import { ExerciseRow } from '@/src/features/exercises/components/exercise-row';
import { render, screen } from '@testing-library/react-native';

test('exposes the exercise row as a button named for the exercise', async () => {
  await render(
    <ExerciseRow
      exercise={{
        id: 'squat',
        name: 'Squat',
        equipment: 'barbell',
        trackingType: 'weight_reps',
        primaryMuscles: null,
        secondaryMuscles: null,
        isCustom: 0,
        isArchived: 0,
        createdAt: 0
      }}
      subtitle="Barbell"
      onPress={jest.fn()}
    />
  );

  expect(screen.getByRole('button', { name: /Squat/ })).toBeOnTheScreen();
});
