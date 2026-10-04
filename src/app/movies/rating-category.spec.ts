import { ALL_RATINGS, RATING_CATEGORIES } from './rating-category';

describe('RATING_CATEGORIES', () => {
  it('lists the categories in the order the chips are shown', () => {
    expect(RATING_CATEGORIES.map((c) => c.name)).toEqual([
      'All',
      'Bad',
      'Good',
      'Great',
      'Recommend',
    ]);
  });

  it('gets stricter from left to right', () => {
    const minimums = RATING_CATEGORIES.map((c) => c.minRating);
    expect(minimums).toEqual([0, 4, 6, 8, 9]);
    expect([...minimums].sort((a, b) => a - b)).toEqual(minimums);
  });

  it('All lets everything through, including unrated movies', () => {
    expect(ALL_RATINGS.name).toBe('All');
    expect(ALL_RATINGS.minRating).toBe(0);
  });
});
