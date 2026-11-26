import type { RestTimerDurationPicker } from '@/src/features/rest-timer/components/rest-timer-duration-picker';
import type { RestTimerState } from '@/src/features/rest-timer/rest-timer.store';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect, type ComponentProps } from 'react';
import { Button } from 'react-native';

const start = jest.fn<boolean, Parameters<RestTimerState['start']>>();

jest.doMock('@/src/features/rest-timer/rest-timer.store', () => ({
  ...jest.requireActual('@/src/features/rest-timer/rest-timer.store'),
  useRestTimerStore: (
    select: (state: Pick<RestTimerState, 'start'>) => unknown
  ) => select({ start })
}));
jest.doMock('@/src/features/settings/hooks/use-settings', () => ({
  useSettings: () => ({ restTimerPresets: [] })
}));
jest.doMock('@/src/theme/app-theme-provider', () => ({
  useAppTheme: () => ({
    colors: { muted: '#eeeeee', primary: '#0000ff' },
    colorScheme: 'light'
  })
}));
jest.doMock('@gorhom/bottom-sheet', () =>
  jest.requireActual('@gorhom/bottom-sheet/mock')
);
jest.doMock(
  '@/src/features/rest-timer/components/rest-timer-duration-picker',
  () => ({
    RestTimerDurationPicker: ({
      onMinutesChanging,
      onSecondsChanging,
      onSecondsChange
    }: ComponentProps<typeof RestTimerDurationPicker>) => {
      useEffect(() => {
        // Android reports index 0 on first layout without settling either wheel.
        onMinutesChanging?.(0);
        onSecondsChanging?.(0);
      }, [onMinutesChanging, onSecondsChanging]);

      return (
        <Button
          title="Set seconds to 45"
          accessibilityLabel="Set seconds to 45"
          onPress={() => {
            onSecondsChanging?.(45);
            onSecondsChange(45);
          }}
        />
      );
    }
  })
);

const idleContentPromise =
  import('@/src/features/rest-timer/components/rest-timer-idle-content');

it('starts a 1:45 rest timer when only seconds change from the 1:30 default', async () => {
  const { RestTimerIdleContent } = await idleContentPromise;

  render(<RestTimerIdleContent defaultDuration={90} openToken={0} />);
  fireEvent.press(screen.getByRole('button', { name: 'Set seconds to 45' }));
  fireEvent.press(screen.getByRole('button', { name: 'Start rest' }));

  expect(start).toHaveBeenCalledWith(105, undefined);
});
