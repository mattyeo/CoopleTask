import { colors } from '@/shared/theme/tokens';

type ColorName = keyof typeof colors;

/** WCAG 2.x relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [red, green, blue] = channels as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastBetween(foregroundHex: string, backgroundHex: string): number {
  const [lighter, darker] = [luminance(foregroundHex), luminance(backgroundHex)].sort(
    (a, b) => b - a,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastRatio(foreground: ColorName, background: ColorName): number {
  return contrastBetween(colors[foreground], colors[background]);
}

describe('contrast helper', () => {
  // Without this, a bug in the helper could make every palette check below pass.
  it('matches known WCAG reference values', () => {
    expect(contrastBetween('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastBetween('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastBetween('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    expect(contrastBetween('#767676', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('does not depend on the argument order', () => {
    expect(contrastBetween('#1A56DB', '#FFFFFF')).toBeCloseTo(
      contrastBetween('#FFFFFF', '#1A56DB'),
      10,
    );
  });
});

describe('colour tokens', () => {
  it('only contain #RRGGBB values', () => {
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  // Every text-on-background pair the app can produce.
  const textPairs: Array<[ColorName, ColorName]> = [
    ['text', 'surface'],
    ['text', 'background'],
    ['text', 'primarySoft'],
    ['textMuted', 'surface'],
    ['textMuted', 'background'],
    ['textMuted', 'primarySoft'],
    ['textSubtle', 'surface'],
    ['textSubtle', 'background'],
    ['textSubtle', 'primarySoft'],
    ['primary', 'surface'],
    ['primary', 'background'],
    ['primary', 'primarySoft'],
    ['onPrimary', 'primary'],
    ['onPrimary', 'primaryPressed'],
    ['onPrimarySoft', 'primarySoft'],
    ['onWarningSurface', 'warningSurface'],
  ];

  it.each(textPairs)('%s on %s has at least 4.5:1 contrast (WCAG AA text)', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  // Icons and component outlines only need 3:1.
  const graphicPairs: Array<[ColorName, ColorName]> = [
    ['favourite', 'surface'],
    ['favouriteInactive', 'surface'],
    ['primary', 'surface'],
  ];

  it.each(graphicPairs)('%s on %s has at least 3:1 contrast (WCAG AA graphics)', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
