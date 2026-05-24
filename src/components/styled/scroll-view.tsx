import { styled } from 'nativewind';
import { ScrollView } from 'react-native';
import { ScrollView as GestureHandlerScrollView } from 'react-native-gesture-handler';

export const StyledScrollView = styled(ScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle'
});

export const StyledGestureScrollView = styled(GestureHandlerScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle'
});
