import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { colors, fontSizes, lineHeights, spacing } from '../../theme/tokens';

interface JobListFooterProps {
  isLoadingMore: boolean;
  hasLoadMoreError: boolean;
  hasMore: boolean;
  onRetry: () => void;
}

/** What sits below the last card: a spinner, a retry prompt, or the end-of-list note. */
export function JobListFooter({
  isLoadingMore,
  hasLoadMoreError,
  hasMore,
  onRetry,
}: JobListFooterProps) {
  if (hasLoadMoreError) {
    return (
      <View style={styles.footer} accessibilityRole="alert">
        <Text style={styles.message}>Could not load more jobs.</Text>
        <Button label="Retry" variant="secondary" onPress={onRetry} />
      </View>
    );
  }

  if (isLoadingMore) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Loading more jobs" />
      </View>
    );
  }

  if (!hasMore) {
    return (
      <View style={styles.footer}>
        <Text style={styles.message}>You have reached the end of the list.</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    textAlign: 'center',
  },
});
