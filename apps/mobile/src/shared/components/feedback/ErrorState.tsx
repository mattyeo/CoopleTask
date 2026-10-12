import { StyleSheet, Text } from 'react-native';
import { isRetryable } from '@/shared/api/ApiError';
import { getErrorMessage } from '@/shared/utils/errorMessages';
import { colors, fontSizes, lineHeights } from '@/shared/theme/tokens';
import { Button } from '@/shared/components/ui/Button';
import { StateLayout } from './StateLayout';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  onBack?: () => void;
}

/** Offers "Retry" only for errors that can succeed on a retry, otherwise "Back to jobs". */
export function ErrorState({ error, onRetry, onBack }: ErrorStateProps) {
  const retryable = isRetryable(error);

  return (
    <StateLayout accessibilityRole="alert">
      <Text style={styles.message}>{getErrorMessage(error)}</Text>
      {retryable && onRetry ? <Button label="Retry" onPress={onRetry} /> : null}
      {!retryable && onBack ? <Button label="Back to jobs" onPress={onBack} /> : null}
    </StateLayout>
  );
}

const styles = StyleSheet.create({
  message: {
    color: colors.text,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    textAlign: 'center',
  },
});
