import type { PressableStateCallbackType } from 'react-native';

export interface InteractionState {
  pressed: boolean;
  hovered: boolean;
}

/**
 * React Native's typings only know `pressed`, but on web `Pressable` also reports `hovered`
 * (and nothing at all on touch devices, hence the defaults).
 */
export function getInteractionState(state: PressableStateCallbackType): InteractionState {
  const { pressed, hovered } = state as PressableStateCallbackType & { hovered?: boolean };
  return { pressed, hovered: hovered === true };
}
