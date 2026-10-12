import { useWindowDimensions } from 'react-native';
import { breakpoints } from './tokens';

export type Breakpoint = 'compact' | 'medium' | 'expanded';

export function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.expanded) return 'expanded';
  if (width >= breakpoints.medium) return 'medium';
  return 'compact';
}

export function getColumnCount(breakpoint: Breakpoint): 1 | 2 | 3 {
  switch (breakpoint) {
    case 'compact':
      return 1;
    case 'medium':
      return 2;
    case 'expanded':
      return 3;
  }
}

/** The current breakpoint; re-evaluated when the window is resized or the device is rotated. */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return getBreakpoint(width);
}
