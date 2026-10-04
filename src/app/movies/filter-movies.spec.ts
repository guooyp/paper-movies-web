import { filterMovies } from './filter-movies';
import { Movie } from './movie';
import { ALL_RATINGS, RATING_CATEGORIES, RatingCategory } from './rating-category';

const movie = (title: string, voteAverage: number): Movie => ({
  id: title.length * 1000 + Math.round(voteAverage * 10),
  title,
  voteAverage,
  posterPath: null,
  releaseDate: null,
});

const [all, bad, good, great, recommend] = RATING_CATEGORIES;

describe('filterMovies', () => {
  const movies = [
    movie('Unrated', 0),
    movie('Civil War', 3.9),
    movie('The Fall Guy', 4.0),
    movie('Dune: Part Two', 6.0),
    movie('Furiosa', 7.9),
    movie('Dune', 8.0),
    movie('Perfect', 9.0),
  ];

  const titles = (category: RatingCategory, query = '') =>
    filterMovies(movies, query, category).map((m) => m.title);

  it('All keeps everything, including unrated movies', () => {
    expect(titles(all)).toHaveLength(7);
    expect(ALL_RATINGS).toBe(all);
  });

  it('includes movies exactly at a category minimum', () => {
    expect(titles(bad)).not.toContain('Civil War');
    expect(titles(bad)).toContain('The Fall Guy');
    expect(titles(good)).not.toContain('The Fall Guy');
    expect(titles(good)).toContain('Dune: Part Two');
    expect(titles(great)).toEqual(['Dune', 'Perfect']);
    expect(titles(recommend)).toEqual(['Perfect']);
  });

  it('is case insensitive and ignores surrounding spaces', () => {
    expect(titles(all, '  DUNE ')).toEqual(['Dune: Part Two', 'Dune']);
  });

  it('combines search and rating', () => {
    expect(titles(great, 'dune')).toEqual(['Dune']);
  });

  it('matches anywhere in the title', () => {
    expect(titles(all, 'part')).toEqual(['Dune: Part Two']);
    expect(titles(all, 'fall')).toEqual(['The Fall Guy']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(titles(all, 'zzz')).toEqual([]);
    expect(filterMovies([], '', all)).toEqual([]);
  });

  it('treats a blank query as no query', () => {
    expect(titles(all, '   ')).toHaveLength(7);
  });

  it('keeps the original order', () => {
    expect(titles(bad)).toEqual(['The Fall Guy', 'Dune: Part Two', 'Furiosa', 'Dune', 'Perfect']);
  });

  it('does not change the list it is given', () => {
    const copy = [...movies];
    filterMovies(movies, 'dune', great);
    expect(movies).toEqual(copy);
  });

  it('treats the search as plain text, not a pattern', () => {
    const special = [movie('Mission: Impossible (2024)', 7), movie('A.B', 7)];

    expect(filterMovies(special, '(2024)', all)).toEqual([special[0]]);
    expect(filterMovies(special, 'a.b', all)).toEqual([special[1]]);
    expect(filterMovies(special, '.*', all)).toEqual([]);
  });

  it('matches accented titles', () => {
    const french = [movie('Un père idéal', 6)];
    expect(filterMovies(french, 'père', all)).toEqual(french);
  });
});
