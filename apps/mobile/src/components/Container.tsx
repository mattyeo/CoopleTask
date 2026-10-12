import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useContainerStyle } from '../theme/useContainerStyle';

interface ContainerProps {
  maxWidth: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Container({ maxWidth, children, style }: ContainerProps) {
  const containerStyle = useContainerStyle(maxWidth);

  return <View style={[containerStyle, style]}>{children}</View>;
}
