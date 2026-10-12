import { Pressable, StyleSheet, Text } from 'react-native';
import { goBackToList } from '../lib/navigation';
import { colors, fontSizes, spacing, touchTarget } from '../theme/tokens';
import { getInteractionState } from './pressableState';

export function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to jobs"
      onPress={goBackToList}
      style={(state) => {
        const { pressed, hovered } = getInteractionState(state);
        return [styles.button, (pressed || hovered) && styles.active];
      }}
    >
      <Text style={styles.label}>‹ Jobs</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    cursor: 'pointer',
    justifyContent: 'center',
    minHeight: touchTarget,
    paddingHorizontal: spacing.sm,
  },
  active: {
    opacity: 0.7,
  },
  label: {
    color: colors.primary,
    fontSize: fontSizes.md,
  },
});
