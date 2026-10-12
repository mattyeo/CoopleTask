import { StyleSheet, Text, View } from 'react-native';
import { isRetryable } from '../api/ApiError';
import { getErrorMessage } from '../lib/errorMessages';
import { Button } from './Button';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  onBack?: () => void;
}

/** Offers "Retry" only for errors that can succeed on a retry, otherwise "Back to jobs". */
export function ErrorState({ error, onRetry, onBack }: ErrorStateProps) {
  const retryable = isRetryable(error);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.message}>{getErrorMessage(error)}</Text>
      {retryable && onRetry ? <Button label="Retry" onPress={onRetry} /> : null}
      {!retryable && onBack ? <Button label="Back to jobs" onPress={onBack} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    color: '#111827',
    fontSize: 16,
    textAlign: 'center',
  },
});
