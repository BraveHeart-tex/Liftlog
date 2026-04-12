import { styled } from 'nativewind';
import { ActivityIndicator } from 'react-native';

export const StyledActivityIndicator = styled(ActivityIndicator, {
  className: {
    target: 'style',
    nativeStyleMapping: {
      color: 'color'
    }
  }
});
