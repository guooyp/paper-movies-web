import { formatReleaseDate } from './release-date';

describe('formatReleaseDate', () => {
  it('formats an ISO date', () => {
    expect(formatReleaseDate('2024-02-27')).toBe('Feb 27, 2024');
    expect(formatReleaseDate('2026-12-01')).toBe('Dec 1, 2026');
  });

  it('handles a leap day', () => {
    expect(formatReleaseDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('does not shift the day with the time zone', () => {
    expect(formatReleaseDate('2024-01-01')).toBe('Jan 1, 2024');
    expect(formatReleaseDate('2024-12-31')).toBe('Dec 31, 2024');
  });

  it('returns null for missing or blank values', () => {
    expect(formatReleaseDate(null)).toBeNull();
    expect(formatReleaseDate(undefined)).toBeNull();
    expect(formatReleaseDate('')).toBeNull();
    expect(formatReleaseDate('   ')).toBeNull();
  });

  it('leaves partial or non-date values alone', () => {
    expect(formatReleaseDate('2024')).toBe('2024');
    expect(formatReleaseDate('2024-02')).toBe('2024-02');
    expect(formatReleaseDate('TBA')).toBe('TBA');
  });

  it('does not roll an impossible date over to the next month', () => {
    expect(formatReleaseDate('2024-02-31')).toBe('2024-02-31');
    expect(formatReleaseDate('2023-02-29')).toBe('2023-02-29');
    expect(formatReleaseDate('2024-13-01')).toBe('2024-13-01');
    expect(formatReleaseDate('2024-00-10')).toBe('2024-00-10');
  });

  it('trims surrounding whitespace', () => {
    expect(formatReleaseDate(' 2024-02-27 ')).toBe('Feb 27, 2024');
  });
});
