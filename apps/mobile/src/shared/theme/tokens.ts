export const colors = {
  background: '#F3F5F9',
  surface: '#FFFFFF',
  border: '#E2E6EE',

  text: '#111827',
  textMuted: '#4B5563',
  textSubtle: '#5F6B7A',

  primary: '#1A56DB',
  primaryPressed: '#1E429F',
  onPrimary: '#FFFFFF',
  primarySoft: '#E8F0FE',
  onPrimarySoft: '#1A4BB3',

  favourite: '#D97706',
  favouriteInactive: '#6B7280',

  warningSurface: '#FEF3C7',
  onWarningSurface: '#92400E',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSizes = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
} as const;

export const lineHeights = {
  xs: 18,
  sm: 22,
  md: 24,
  lg: 28,
  xl: 32,
  xxl: 38,
} as const;

export const fontWeights = {
  regular: '400',
  semibold: '600',
  bold: '700',
} as const;

export const shadows = {
  // Always paired with a 1 px border, so the card still reads where shadows are not rendered.
  card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)',
} as const;

export const breakpoints = {
  medium: 600,
  expanded: 1024,
} as const;

export const maxWidths = {
  list: 1200,
  details: 1040,
  narrow: 720,
  state: 480,
  /** About 70 characters per line of body text. */
  readableText: 680,
} as const;

/** Width of the details side card on expanded screens. */
export const sidebarWidth = 340;

/** Smallest comfortable touch target, in points. */
export const touchTarget = 44;

/** Horizontal page padding per breakpoint. */
export const pagePadding = {
  compact: spacing.lg,
  medium: spacing.xl,
  expanded: spacing.xxl,
} as const;
