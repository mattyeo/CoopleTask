import { ActivityIndicator } from 'react-native';
import { colors } from '../theme/tokens';
import { StateLayout } from './StateLayout';

export function LoadingState() {
  return (
    <StateLayout accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator size="large" color={colors.primary} />
    </StateLayout>
  );
}
