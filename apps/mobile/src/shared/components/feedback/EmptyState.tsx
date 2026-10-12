import { StyleSheet, Text } from 'react-native';
import { colors, fontSizes, fontWeights, lineHeights, spacing } from '@/shared/theme/tokens';
import { Button } from '@/shared/components/ui/Button';
import { StateLayout } from './StateLayout';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <StateLayout>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </StateLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.lg,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
});
