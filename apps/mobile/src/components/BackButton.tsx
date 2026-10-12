import { Pressable, StyleSheet, Text } from 'react-native';
import { goBackToList } from '../lib/navigation';

export function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to jobs"
      onPress={goBackToList}
      hitSlop={8}
      style={styles.button}
    >
      <Text style={styles.label}>‹ Jobs</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    color: '#1a56db',
    fontSize: 17,
  },
});
