import { StyleSheet } from 'react-native';
import { colors, radii, shadows, spacing } from './tokens';

/** The look shared by every card: white surface, hairline border, soft shadow. */
export const cardStyle = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    boxShadow: shadows.card,
    padding: spacing.lg,
  },
}).card;
