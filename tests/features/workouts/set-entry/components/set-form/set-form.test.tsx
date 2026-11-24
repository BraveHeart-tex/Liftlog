import type { Set as WorkoutSet } from '@/src/db/schema';
import { applicationUpdateExclusion } from '@/src/features/app-updates/update-exclusion';
import type { SetValues } from '@/src/features/progress/tracking.domain';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react-native';
import type { ComponentProps } from 'react';

// The set form reads the weight unit and theme from app providers; tests pin them.
jest.doMock('@/src/features/settings/hooks/use-settings', () => ({
  useSettings: () => ({ weightUnit: 'kg' })
}));
jest.doMock('@/src/theme/app-theme-provider', () => ({
  useAppTheme: () => ({
    colors: { muted: '#eeeeee', primary: '#0000ff' },
    colorScheme: 'light'
  })
}));
// The delete confirmation renders in a Gorhom sheet, which needs a native host.
jest.doMock('@gorhom/bottom-sheet', () =>
  jest.requireActual('@gorhom/bottom-sheet/mock')
);
// Weight and reps never opens the duration picker, whose stopwatch loads native audio.
jest.doMock(
  '@/src/features/workouts/set-entry/components/set-duration-picker-sheet',
  () => ({ SetDurationPickerSheet: () => null })
);

const setFormPromise =
  import('@/src/features/workouts/set-entry/components/set-form/set-form');
const alertDialogPromise = import('@/src/components/ui/alert-dialog');

type SetFormProps = ComponentProps<Awaited<typeof setFormPromise>['SetForm']>;

function completedSet(
  id: string,
  order: number,
  values: { weightKg: number; reps: number }
): WorkoutSet {
  return {
    id,
    workoutExerciseId: 'workout-exercise-1',
    order,
    weightKg: values.weightKg,
    reps: values.reps,
    distanceMeters: null,
    durationMs: null,
    durationSeconds: null,
    rpe: null,
    status: 'completed',
    completedAt: order + 1,
    sourceSetId: null
  };
}

/** Renders a weight and reps set form with injected set callbacks. */
async function harness(sets: WorkoutSet[] = []) {
  const { SetForm } = await setFormPromise;
  const { AlertDialogHost } = await alertDialogPromise;
  const onAddSet = jest.fn((data: SetValues & { order: WorkoutSet['order'] }) =>
    completedSet(`created-${data.order}`, data.order, {
      weightKg: data.weightKg ?? 0,
      reps: data.reps ?? 0
    })
  );
  const onUpdateSet = jest.fn<
    ReturnType<SetFormProps['onUpdateSet']>,
    Parameters<SetFormProps['onUpdateSet']>
  >();
  const onDeleteSet = jest.fn<void, [WorkoutSet['id']]>();
  const view = render(
    <>
      <SetForm
        trackingType="weight_reps"
        sets={sets}
        previousSets={[]}
        onAddSet={onAddSet}
        onUpdateSet={onUpdateSet}
        onDeleteSet={onDeleteSet}
      />
      <AlertDialogHost />
    </>
  );

  return { onAddSet, onDeleteSet, onUpdateSet, view };
}

beforeEach(() => {
  applicationUpdateExclusion.hydrate(false);
});

// Catches a draft row that saves raw strings, the wrong order or nothing at all.
test('saving a new row adds the set with parsed weight and reps', async () => {
  const { onAddSet } = await harness();

  fireEvent.press(screen.getByRole('button', { name: 'Add Set' }));
  fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '82.5');
  fireEvent.changeText(screen.getByLabelText('Set 1 reps'), '8');
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Commit set 1' }));
  });

  expect(onAddSet).toHaveBeenCalledWith({ weightKg: 82.5, reps: 8, order: 0 });
});

// Catches invalid input reaching the add callback or locking the row.
test('invalid input is not saved and its row stays editable', async () => {
  const { onAddSet } = await harness();

  fireEvent.press(screen.getByRole('button', { name: 'Add Set' }));
  fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '80');
  fireEvent.changeText(screen.getByLabelText('Set 1 reps'), '0');

  expect(screen.getByRole('button', { name: 'Commit set 1' })).toBeDisabled();
  expect(onAddSet).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Set 1 weight')).not.toBeDisabled();
  expect(screen.getByLabelText('Set 1 reps')).not.toBeDisabled();
  expect(screen.getByLabelText('Set 1 reps')).toHaveDisplayValue('0');
});

// Catches a copy that adds an empty row or saves values other than the copied set's.
test('copying a set fills the new row with that set’s values', async () => {
  const { onAddSet } = await harness([
    completedSet('set-1', 0, { weightKg: 80, reps: 8 })
  ]);

  fireEvent.press(screen.getByRole('button', { name: 'Copy set 1' }));

  expect(screen.getByLabelText('Set 2 weight')).toHaveDisplayValue('80');
  expect(screen.getByLabelText('Set 2 reps')).toHaveDisplayValue('8');
  await waitFor(() =>
    expect(onAddSet).toHaveBeenCalledWith({ weightKg: 80, reps: 8, order: 1 })
  );
});

// Catches a delete that skips the confirmation or never reaches the delete callback.
test('deleting a saved set asks for confirmation before removing it', async () => {
  const { onDeleteSet } = await harness([
    completedSet('set-1', 0, { weightKg: 80, reps: 8 })
  ]);

  fireEvent.press(screen.getByRole('button', { name: 'Delete set 1' }));

  expect(await screen.findByText('Delete set?')).toBeOnTheScreen();
  expect(onDeleteSet).not.toHaveBeenCalled();

  fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

  await waitFor(() => expect(onDeleteSet).toHaveBeenCalledWith('set-1'));
});

// Catches an Update starting over unsaved set input, or a form that blocks it after unmount.
test('the mounted set form blocks Update while editing and releases on unmount', async () => {
  const { view } = await harness();

  expect(applicationUpdateExclusion.getUpdateBlockReason()).toBeUndefined();

  fireEvent.press(screen.getByRole('button', { name: 'Add Set' }));

  expect(applicationUpdateExclusion.getUpdateBlockReason()).toBe(
    'transient_workout_edit'
  );

  view.unmount();

  expect(applicationUpdateExclusion.getUpdateBlockReason()).toBeUndefined();
});
