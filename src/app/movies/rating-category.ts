export interface RatingCategory {
  readonly name: string;
  /** A movie belongs to the category when its vote average is at least this. */
  readonly minRating: number;
}

export const RATING_CATEGORIES: readonly RatingCategory[] = [
  { name: 'All', minRating: 0 },
  { name: 'Bad', minRating: 4 },
  { name: 'Good', minRating: 6 },
  { name: 'Great', minRating: 8 },
  { name: 'Recommend', minRating: 9 },
];

export const ALL_RATINGS = RATING_CATEGORIES[0];
