import type { ViewStyle } from 'react-native';
import { pagePadding } from './tokens';
import { useBreakpoint } from './useBreakpoint';

/**
 * Style that centres content in a column of at most `maxWidth`, with page padding that grows with
 * the screen. Use it for a `View`, or as the `contentContainerStyle` of a list / scroll view.
 */
export function useContainerStyle(maxWidth: number): ViewStyle {
  const breakpoint = useBreakpoint();

  return {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
    paddingHorizontal: pagePadding[breakpoint],
  };
}
