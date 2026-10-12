import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { cardStyle } from '../theme/cardStyle';
import { colors } from '../theme/tokens';
import { getInteractionState } from './pressableState';

/**
 * A card that is a single pressable target. It forwards every prop (and the ref) to `Pressable`,
 * so it also works as the child of an expo-router `<Link asChild>`.
 */
export function PressableCard({ style, ...props }: PressableProps) {
  return (
    <Pressable
      {...props}
      style={(state) => {
        const { pressed, hovered } = getInteractionState(state);
        const extra = typeof style === 'function' ? style(state) : style;
        return [
          cardStyle,
          styles.interactive,
          hovered && styles.hovered,
          pressed && styles.pressed,
          extra,
        ];
      }}
    />
  );
}

const styles = StyleSheet.create({
  interactive: {
    cursor: 'pointer',
  },
  hovered: {
    borderColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
  },
});
