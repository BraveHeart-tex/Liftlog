import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RestTimerDurationPicker } from '@/src/features/rest-timer/components/rest-timer-duration-picker';
import { useEffect, type ComponentProps } from 'react';

type DurationPickerProps = ComponentProps<typeof RestTimerDurationPicker>;

jest.doMock('@/src/theme/app-theme-provider', () => ({
  useAppTheme: () => ({
    colors: { muted: '#eeeeee', primary: '#0000ff' },
    colorScheme: 'light'
  })
}));
// The editor renders in a Gorhom sheet, which needs a native host.
jest.doMock('@gorhom/bottom-sheet', () =>
  jest.requireActual('@gorhom/bottom-sheet/mock')
);
// The native wheel reports a scroll to index 0 shortly after its first layout,
// after the editor has set its starting duration, and never settles with onChange.
jest.doMock(
  '@/src/features/rest-timer/components/rest-timer-duration-picker',
  () => ({
    RestTimerDurationPicker: ({
      onMinutesChanging,
      onSecondsChanging
    }: DurationPickerProps) => {
      useEffect(() => {
        const timeout = setTimeout(() => {
          onMinutesChanging?.(0);
          onSecondsChanging?.(0);
        }, 50);

        return () => clearTimeout(timeout);
      }, [onMinutesChanging, onSecondsChanging]);

      return null;
    }
  })
);

const editorPromise =
  import('@/src/features/rest-timer/components/rest-timer-preset-editor-sheet');

describe('RestTimerPresetEditorSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves a new preset when the wheel reports a layout scroll to index 0', async () => {
    const { RestTimerPresetEditorSheet } = await editorPromise;
    const onSave = jest.fn();

    render(
      <RestTimerPresetEditorSheet
        isOpen
        preset={null}
        defaultDuration={90}
        onClose={jest.fn()}
        onSave={onSave}
        onDelete={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });
    fireEvent.changeText(screen.getByLabelText('Name'), 'Heavy sets');
    fireEvent.press(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith({
      name: 'Heavy sets',
      durationSeconds: 90
    });
  });
});
