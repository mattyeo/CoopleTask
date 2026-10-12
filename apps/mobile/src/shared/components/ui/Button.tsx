import { Pressable, StyleSheet, Text } from 'react-native';
import {
  colors,
  fontSizes,
  fontWeights,
  lineHeights,
  radii,
  spacing,
  touchTarget,
} from '@/shared/theme/tokens';
import { getInteractionState } from './pressableState';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={(state) => {
        const { pressed, hovered } = getInteractionState(state);
        const active = pressed || hovered;
        return [
          styles.base,
          isPrimary ? styles.primary : styles.secondary,
          active && (isPrimary ? styles.primaryActive : styles.secondaryActive),
        ];
      }}
    >
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    cursor: 'pointer',
    justifyContent: 'center',
    minHeight: touchTarget,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  primaryActive: {
    backgroundColor: colors.primaryPressed,
    borderColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  secondaryActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.md,
  },
  primaryLabel: {
    color: colors.onPrimary,
  },
  secondaryLabel: {
    color: colors.primary,
  },
});
