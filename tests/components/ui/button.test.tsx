import { Button } from '@/src/components/ui/button';
import { render, screen } from '@testing-library/react-native';

test('updates the explicit accessibility label and busy state when loading ends', async () => {
  const { rerender } = await render(
    <Button loading loadingLabel="Loading templates...">
      Start Workout
    </Button>
  );

  expect(screen.getByRole('button', { busy: true })).toHaveProp(
    'accessibilityLabel',
    'Loading templates...'
  );

  await rerender(<Button>Start Workout</Button>);

  expect(screen.getByRole('button', { busy: false })).toHaveProp(
    'accessibilityLabel',
    'Start Workout'
  );
});
