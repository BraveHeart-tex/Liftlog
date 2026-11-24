import { cn } from '@/src/lib/utils/cn.utils';
import { render, screen } from '@testing-library/react-native';
import { styled } from 'nativewind';
import { Text as NativeText, StyleSheet } from 'react-native';
import { Text as CssText } from 'react-native-css/components';
import { registerCSS } from 'react-native-css/jest';

// Catches a Jest setup where NativeWind className or react-native-css styles stop
// resolving to React Native styles, or where text queries cannot find styled output.
const StyledText = styled(NativeText);

test('NativeWind className and react-native-css styles render and are found by text', () => {
  registerCSS(`
    .text-probe { color: rgb(255, 0, 0); }
    .font-probe { font-size: 18px; }
  `);

  render(
    <>
      <StyledText className={cn('text-probe', 'font-probe')}>
        NativeWind probe
      </StyledText>
      <CssText className="text-probe">react-native-css probe</CssText>
    </>
  );

  expect(
    StyleSheet.flatten(screen.getByText('NativeWind probe').props.style)
  ).toEqual(expect.objectContaining({ color: '#f00', fontSize: 18 }));
  expect(
    StyleSheet.flatten(screen.getByText('react-native-css probe').props.style)
  ).toEqual(expect.objectContaining({ color: '#f00' }));
});
