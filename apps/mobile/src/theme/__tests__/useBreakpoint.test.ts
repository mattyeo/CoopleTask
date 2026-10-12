import { getBreakpoint, getColumnCount } from '../useBreakpoint';

describe('getBreakpoint', () => {
  it.each([
    [0, 'compact'],
    [359, 'compact'],
    [390, 'compact'],
    [599, 'compact'],
    [600, 'medium'],
    [820, 'medium'],
    [1023, 'medium'],
    [1024, 'expanded'],
    [1440, 'expanded'],
    [1920, 'expanded'],
  ])('%d px wide is %s', (width, expected) => {
    expect(getBreakpoint(width)).toBe(expected);
  });
});

describe('getColumnCount', () => {
  it('uses more columns on wider screens', () => {
    expect(getColumnCount('compact')).toBe(1);
    expect(getColumnCount('medium')).toBe(2);
    expect(getColumnCount('expanded')).toBe(3);
  });

  it('matches the column count to the width end to end', () => {
    expect(getColumnCount(getBreakpoint(360))).toBe(1);
    expect(getColumnCount(getBreakpoint(768))).toBe(2);
    expect(getColumnCount(getBreakpoint(1280))).toBe(3);
  });
});
