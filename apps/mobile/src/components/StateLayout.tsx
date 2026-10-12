import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { maxWidths, spacing } from '../theme/tokens';

interface StateLayoutProps extends ViewProps {
  children: ReactNode;
}

/** Centres a loading / empty / error state in a narrow, readable column. */
export function StateLayout({ children, style, ...props }: StateLayoutProps) {
  return (
    <View style={styles.outer} {...props}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  inner: {
    alignItems: 'center',
    gap: spacing.lg,
    maxWidth: maxWidths.state,
    width: '100%',
  },
});
