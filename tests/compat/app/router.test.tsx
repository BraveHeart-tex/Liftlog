import { screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { act, renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

// Catches an Expo Router or React Native Testing Library upgrade that breaks the
// synchronous renderRouter contract or in-memory route navigation.
test('renderRouter renders an in-memory route and router.push changes the screen', () => {
  const result = renderRouter(
    {
      index: () => <Text>Home probe</Text>,
      'workouts/[id]': () => <Text>Workout probe</Text>
    },
    { initialUrl: '/' }
  );

  expect(screen.getByText('Home probe')).toBeOnTheScreen();

  act(() => router.push('/workouts/1'));

  expect(screen.getByText('Workout probe')).toBeOnTheScreen();
  expect(result.getPathname()).toBe('/workouts/1');
});
